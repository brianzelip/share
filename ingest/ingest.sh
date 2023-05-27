#!/bin/bash

# Read environment variables
source "../.env"

# Go to directory with exported original media
cd ./originals

jpg_count=$(ls -1 *.JPG | wc -l)
mp4_count=$(ls -1 *.MP4 | wc -l)

if [ $jpg_count -ge 1 ]; then

    # Write exif data from original images to file
    # -csv - export in csv format, adds SourceFile column
    # -c '%+.6f' - format coordinates as decimal with 6 places and a + or - prefix
    # -ext JPG - .JPG extension
    # . - look in this directory
    # > ../temp_images_og.csv - write to file
    exiftool -csv -c '%+.6f' -ext JPG . > ../temp_images_og.csv

    # Resize and convert images to webp
    magick mogrify -resize 75% -format webp *.JPG

    # Move processed images
    mv ./*.webp ../processed

    # Write exif data from processed images to file
    exiftool -csv -ext webp ../processed > ../temp_images_processed.csv

    # Manually create file for images sha hashes
    echo "FileName,CreateDate,SHA256,SHA256_short" > ../temp_images_shasum.csv

    # The directory prefix in the for loop ahead gets prepended to ${file}
    # but we only want the file name in the store, so cd for no prefix
    cd ../processed

    # Loop over the webp files to clear exif data and write to sha store
    for image in *.webp
    do
        create_date=$(exiftool -CreateDate -T ${image})

        exiftool -all:all= -AllDates=2000:01:01 ${image}

        # shasum returns two strings, the shasum and the filename
        # so isolate the shasum with awk.
        # Trim the sha256 to 15 chars for use in filenames
        hash=$(shasum --algorithm 256 ${image} | awk '{print $1}')
        hash_short=$(echo $hash | cut -c1-15)
        echo $image","$create_date","$hash","$hash_short >> ../temp_images_shasum.csv
    done

    # Go to ingest directory
    cd ../

    # Compute the final metadata for this batch of images and append
    # to _data/images.csv
    node ./wrangle.js "img"

    # Rename processed images using the batch date and their shasum,
    # quicker in bash than node so create a temp json file for jq access.
    # [IFS](https://en.wikipedia.org/wiki/Input_Field_Separators)
    cat temp_images_finalized.json | \
    jq -r '.[] | .Processed_FileName + "," + .Publish_FileName' | \
    while IFS=, read -r old new; do
        mv ./processed/$old ./processed/${new}
    done

    # Copy processed images to CDN, make public, set MIME type, and
    # set cache control to 1 year
    s3cmd put ./processed/*.webp $S3_BUCKET \
    --acl-public \
    --add-header=Cache-Control:max-age=31536000 \
    --no-guess-mime-type \
    --content-type="image/webp"

    # Backup to cloud
    cp ../_data/images.csv "$BACKUP_PATH"

    # Clean up! remove temp files and processed images
    rm ./temp_images_*.{csv,json} ./processed/*.webp*
fi

if [ $mp4_count -ge 1 ]; then
    cd ./originals

    exiftool -csv -c '%+.6f' -ext MP4 . > ../temp_videos_og.csv

    # Resize video and save it to ../processed/
    # -n: avoid overwriting output files
    # -loglevel error: show errors and hide the rows of progress
    # -i: input file name
    # -movflags use_metadata_tags: copy metadata from input file
    # -map_metadata 0: copy metadata from input file
    # -vcodec libx264: codec lib to use
    # -crf 30: single-pass compression with minor noticeable difference ("0 = lossless, 23 = default, 51 = worst)
    # -preset faster: faster than default encoding time of 'medium'
    # -tune film: specify input is an HQ video other than 'cartoon', 'stillimage', etc
    for video in *.MP4
    do
        ffmpeg -n -loglevel error -i "$video" \
        -movflags use_metadata_tags \
        -map_metadata 0 \
        -vcodec libx264 \
        -crf 30 \
        -preset faster \
        -tune film \
        "../processed/${video}"
    done

    exiftool -csv -ext MP4 ../processed > ../temp_videos_processed.csv 

    echo "FileName,CreationDate,SHA256,SHA256_short" > ../temp_videos_shasum.csv

    cd ../processed

    for video in *.MP4
    do 
        creation_date=$(exiftool -CreationDate -T ${video})

        exiftool -all:all= -AllDates=2000:01:01 ${video}

        hash=$(shasum --algorithm 256 ${video} | awk '{print $1}')
        hash_short=$(echo $hash | cut -c1-15)
        echo $video","$creation_date","$hash","$hash_short >> ../temp_videos_shasum.csv
    done

    cd ../

    node ./wrangle.js "vid"

    cat temp_videos_finalized.json | \
    jq -r '.[] | .Processed_FileName + "," + .Publish_FileName' | \
    while IFS=, read -r old new; do
        mv ./processed/$old ./processed/${new}
    done

    s3cmd put ./processed/*.mp4 $S3_BUCKET \
    --acl-public \
    --add-header=Cache-Control:max-age=31536000 \
    --no-guess-mime-type \
    --content-type="video/mp4"

    cp ../_data/videos.csv "$BACKUP_PATH"

    rm ./temp_videos_*.{csv,json} ./processed/*.{mp4,MP4}*
fi

echo "🎉 MEDIA INGEST COMPLETE"
