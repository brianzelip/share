// dotenv required in ../eleventy.config.js works here

module.exports = {
  name: `${process.env.SITE_NAME}`,
  description: `${process.env.SITE_DESCRIPTION}`,
  author: `${process.env.SITE_AUTHOR}`
};
