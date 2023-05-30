# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- [ ] add a script for generating an index of all of the media organized by batch
- [x] add to readme the required .env vars
- [ ] add tests
- [x] move the console log at the end of the ingest file to the end of each ingest section, and provide a summary of how many files were ingested.
- [x] console log the links to each page from the ingested media once ingestion is complete

## [1.0.0] - 2023-05-28

### Added

- README.md
- CHANGELOG.md
- LICENSE

## [0.1.0] - 2023-05-27

### Added

```
.
├── _data
│   ├── images.csv (gitignored)
│   ├── site.js
│   └── videos.csv (gitignored)
├── _includes
│   ├── head.html
│   └── styles.css
├── _layouts
│   ├── base.html
│   ├── image.html
│   └── video.html
├── content
│   ├── image.md
│   └── video.md
├── eleventy.config.js
├── ingest
│   ├── fields_of_interest.json
│   ├── ingest.sh
│   ├── originals
│   ├── processed
│   └── wrangle.js
├── package-lock.json
├── package.json
├── public
    └── robots.txt
└── .env (gitignored)
```
