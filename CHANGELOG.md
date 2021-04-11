# Changelog

## [1.0.16]

### Changed

- Parse survey's validFrom and validUntil properties correctly. (gRPC sends them as strings, needs conversion)

- Updated case-web-ui dependency to deal with missing options in the single or multiple choice survey components more gracefully.

## [1.0.15]

### Changed

- Updated project dependecies

## [1.0.14]

### Added

- Store language selection into localStorage. When opening an other tab, reloading or revisiting the page, this selection will be picked up and used. If the item is not available in the local storage, the default language defined by the environment variable will be used.

### Changed

- Updated dependencies - case-web-ui's new version with support for multiple choice subtitles and markdown survey component
