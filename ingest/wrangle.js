const fs = require('fs');
const Papa = require('papaparse');
require('dotenv').config({ path: '../.env' });
const foi = require('./fields_of_interest.json');

const mediaType = process.argv[2]; // 'img' or 'vid'
const mShort = mediaType;
const mLong = mediaType === 'img' ? 'image' : 'video';
const mPlural = mediaType === 'img' ? 'images' : 'videos';

const mediasOriginalCsv = fs.readFileSync(`./temp_${mPlural}_og.csv`, 'utf8');
const mediasProcessedCsv = fs.readFileSync(
  `./temp_${mPlural}_processed.csv`,
  'utf8'
);
const mediasShasumCsv = fs.readFileSync(`./temp_${mPlural}_shasum.csv`, 'utf8');
const mediasFinalizedTempJson = `./temp_${mPlural}_finalized.json`;
const mediasFinalizedCsv = `../_data/${mPlural}.csv`;

const csvReadCfg = { header: true, delimiter: ',', skipEmptyLines: true };
const csvWriteCfg = { header: false, delimiter: ',', skipEmptyLines: true };

const mediasOriginal = Papa.parse(mediasOriginalCsv, csvReadCfg).data;
const mediasProcessed = Papa.parse(mediasProcessedCsv, csvReadCfg).data;
const mediasShasum = Papa.parse(mediasShasumCsv, csvReadCfg).data;

if (
  mediasOriginal.length !== mediasProcessed.length ||
  mediasOriginal.length !== mediasShasum.length
) {
  throw new Error(`The ${mLong} data are not the same length!`);
}

const batchId = batchID(mShort);

const newMediasBase = mediasOriginal.map(
  (med) => new MediaBase(batchId, med, foi[mShort].og)
);

// Add the desired metadata from the processed and shasum csv files
// into the newMediasBase objects created from the originals csv file
const mediasFinalized = newMediasBase.map((med) => {
  // Find the rows in the processed and shasum csv files that correspond
  // to the current row (or media) from the originals csv file
  const proTargetMed = mediasProcessed.find((pMed) => uid(pMed) === med.ID);
  const shaTargetMed = mediasShasum.find((sMed) => uid(sMed) === med.ID);

  if (proTargetMed) {
    addFields(proTargetMed, foi[mShort].processed, med);
  } else {
    throw new Error('No processed target object found!');
  }

  if (shaTargetMed) {
    addFields(shaTargetMed, foi[mShort].shasum, med);
  } else {
    throw new Error('No shashum target object found!');
  }

  // Compute the published ID and its variants from CreateDate or CreationDate,
  // short sha256, and media type. ID ie: 2023-04-06-img-646e8a7b3e7f28f
  const originDate =
    mediaType === 'img' ? med.OG_CreateDate : med.OG_CreationDate;
  const pubYmd = originDate.split(' ')[0].replaceAll(':', '-');
  const pubExt = mediaType === 'img' ? '.webp' : '.mp4';
  const pubId = `${pubYmd}-${mShort}-${med.Processed_SHA256_short}`;
  const pubFileName = `${pubId}${pubExt}`;

  med.Publish_ID = pubId;
  med.Publish_FileName = `${pubFileName}`;
  med.Publish_CDN = `${process.env.CDN_BASE}${pubFileName}`;
  med.Publish_WWW = `${process.env.WWW_BASE}${pubId}.html`;

  return med;
});

// Write mediasFinalized to a temp json file for bash script
try {
  fs.writeFileSync(
    mediasFinalizedTempJson,
    JSON.stringify(mediasFinalized),
    'utf8'
  );
} catch (err) {
  throw new Error(err);
}

// Append mediasFinalized to the appropriate 11ty global data file
try {
  fs.appendFileSync(
    mediasFinalizedCsv,
    Papa.unparse(mediasFinalized, csvWriteCfg) + '\n',
    'utf8'
  );
} catch (err) {
  throw new Error(err);
}

console.log('mediasFinalized', mediasFinalized);

/**
 * MediaBase
 * @constructor
 * @description The starting point for the complete store per media file,
 * comprised of metadata from the original media file and a unique id.
 * The processed and shasum metadata are added after this instantiation.
 * @param {string} batchId - unique id for the batch of files being
 * processed that this media belongs to
 * @param {object} data - an object representing a row from the media
 * CSV file parsed as JSON
 * @param {[string]} fields - array of strings of fields of interest
 */
function MediaBase(batchId, data, fields) {
  this.BatchID = batchId;
  this.ID = uid(data);
  addFields(data, fields, this, 'OG');
}

/**
 * uid
 * @description The unique identifier for a media file, based on the
 * FileName and CreateDate or CreationDate properties.
 * ASSUMES it is being run against csv data not newMediasBase.
 * @param {object} data - a media metadata object from CSV data
 * @returns {string} ie: IMG_3657--2023:03:19
 */
function uid(data) {
  const fileName = data.FileName.split('.')[0];
  const _date = data.FileName.endsWith('.MP4')
    ? data.CreationDate.split(' ')[0]
    : data.CreateDate.split(' ')[0];

  return `${fileName}--${_date}`;
}

/**
 * addFields
 * @description Adds the fields of interest from a csv file as properties on
 * a MediaBase media object
 * @param {object} data - a media metadata object
 * @param {[string]} fields - array of strings of fields of interest
 * @param {object} target - the object to which the properties will be added
 * @param {string} [prefix='Processed'] - prefix for all property names,
 * defaults to 'Processed'
 * @returns {undefined}
 */
function addFields(data, fields, target, prefix = 'Processed') {
  fields.forEach((field) => {
    if (data[field]) {
      target[`${prefix}_${field}`] = data[field];
    }
  });
}

/**
 * batchID
 * @description Creates a filename for the batch of files being processed
 * in the form of YYYY-MM-DD-S-type, where S is the time of day in seconds
 * converted from HH:mm:ss format, and type is the media type. This provides
 * a unique filename with filename-safe characters if multiple batches
 * happen the same day.
 * @param {string} type - the type of media being processed, img or vid
 * @returns {string} - ie: 2023-05-11-66755-img
 */
function batchID(type) {
  const now = new Date().toISOString(); // ie: 2023-05-11T18:28:31.551Z
  const date = now.split('T')[0];
  const seconds = now
    .split('T')[1]
    .split('.')[0]
    .split(':')
    .reduce((acc, cur, i) => {
      return acc + cur * Math.pow(60, 2 - i);
    }, 0);

  return `${date}-${seconds}-${type}`;
}
