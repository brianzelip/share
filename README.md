# share

A solution for self-hosted sharing of videos and images over the web with moderate privacy-through-obscurity; or, "those with the link can see it".

## Motivation

- Allow grandparents to share videos and photos of grandchildren via email instead of social media
- Control all the data

## Use

1. Manually export media to ./ingest/originals/
2. Run `npm run ingest` from ./
3. Run `npm run build` from ./
4. Copy all files in ./\_site/ to remote server (TODO: automate)

### Prerequisites

#### Install dependencies

The following tools are required for the scripts above to work (Homebrew install commands provided for macOS and Linux):

- [Bash](<https://en.wikipedia.org/wiki/Bash_(Unix_shell)>)
- [exiftool](https://exiftool.org/) (`brew install exiftool`)
- [ffmpeg](https://ffmpeg.org/) (`brew install ffmpeg`)
- [imagemagick](https://imagemagick.org/) (`brew install imagemagick`)
- [jq](https://stedolan.github.io/jq/) (`brew install jq`)
- [s3cmd](https://s3tools.org/s3cmd) (`brew install s3cmd`)
- [Node.js](https://nodejs.org/en) (`brew install node`)

Install the Node.js dependencies to generate the static site by running the following command from the project root (./):

```sh
npm install
```

#### Create .env for secrets

Create a file named `.env` in the project root for storing secrets. This file is gitignored. The following variables are needed:

- `SITE_NAME`
- `SITE_AUTHOR`
- `SITE_DESCRIPTION`
- `CDN_BASE` (URI path with out the published file name, include trailing slash)
- `WWW_BASE` (site url, include trailing slash)
- `BACKUP_PATH` (assumes a local directory connected to cloud storage)
- `S3_BUCKET`

## System overview

- Linux server hosting website (eg [Digital Ocean droplets](https://m.do.co/c/a23535c3f83e))
- S3-compatible data store serving static assets (eg [Digital Ocean Spaces](https://m.do.co/c/a23535c3f83e))
- Manually export videos and images to ./ingest/originals/
- Transform videos and images locally via a script
  - Keep a local and backup CSV record of media metadata (git ignored)
- Generate static site locally via a script
  - One video or image per html page
  - URLs made from media date, type, and shasum
- Copy local site to linux server via a script

## Assumptions

- Media is iOS-centric (.MOV, .JPG)
  - iphone used for taking videos and images so some exif metadata fields might not exist from other sources and file formats might be different
- Certain media metadata fields are recorded (./ingest/fields_of_interest.json)

## Contributing

Open a PR!

## Author

Brian Zelip, https://zelip.me

## License

GNU GPLv3
