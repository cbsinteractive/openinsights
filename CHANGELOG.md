# Changelog

All notable changes to this project will be listed here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [next] - TBD

## [4.0.0] - TBD

### Changed

-   BREAKING CHANGE: The `ProviderBase` constructor now requires a `Window` argument.
-   Default feature detection (i.e. `ProviderBase::shouldRun`) now requires user agent to implement `PerformanceObserver`, `performance.getEntriesByType` and `PerformanceResourceTiming`.

## [3.1.0] - 2022-02-07

### Added

-   Export ClientInfo type.

## [3.0.0] - 2022-02-07

### Changed

-   BREAKING CHANGE: Changed Fetch::updateFetchTestResults to take a `PerformanceResourceTiming` parameter. The custom `ResourceTimingEntry` type has been removed.

### Added

-   Add optional Test::shouldSendBeacon hook.

### Removed

-   Generated documentation is removed from source control. Users can generate documentation from source code to read locally by running `npm run build:doc`.

## [0.1.0] - ???

### Added

-   Initial implementation of the Open Insights library.
