require('dotenv').config();
const Papa = require('papaparse');

module.exports = function (eleventyConfig) {
  // Enable Jekyll-like filenames for includes
  eleventyConfig.setLiquidOptions({ dynamicPartials: false });

  // 11ty only supports js and json data files, enable csv
  const parseConfig = { header: true, delimiter: ',', skipEmptyLines: true };
  eleventyConfig.addDataExtension(
    'csv',
    (contents) => Papa.parse(contents, parseConfig).data
  );

  // Copy the `public/` directory to output dir
  eleventyConfig.addPassthroughCopy({ './public/': '/' });

  return {
    templateFormats: ['md', 'html'],
    dir: {
      input: 'content',
      layouts: '../_layouts',
      includes: '../_includes',
      data: '../_data'
    }
  };
};
