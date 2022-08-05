# Changelog

All notable changes to this project will be listed here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [next] - TBD

## [4.5.0] - TBD

### Changed

- Enable TypeScript strict null checks.
- Avoid fetching if caller doesn't provide Window dependency.

### Security

- Address security alery: [Inefficient Regular Expression Complexity in moment](https://github.com/cbsinteractive/openinsights/security/dependabot/21)

## [4.4.1] - 2022-07-21

### Security

- Bump terser from 5.12.1 to 5.14.2.

## [4.4.0] - 2022-04-13

### Removed

- Remove the TestConfiguration interface. The lone attribute that it contained is no longer used.

## [4.3.0] - 2022-04-12

### Changed

- Make beacon handler argument optional. Callers don't need it if they intend to implement their own beaconing strategy.
- The abstract `Test` class' `beaconData` and `beaconURL` properties were previously abstract, requiring callers to provide implementations. For callers that implement their own beaconing strategy, these are not needed. Therefore, we now provide default implementations that throw an exception if called by mistake. Similarly, the `onSendBeaconResolved` and `onSendBeaconRejected` methods now have default implementations for the caller's convenience, although these do not throw an exception since they _are_ expected to be called.

## [4.2.0] - 2022-04-01

### Added

- Add `entries` property to NoValidEntryError. Allows callers to troubleshoot validation issues.

### Removed

- Remove the `PerformanceTimingObserverError` common base class for errors.

## [4.1.1] - 2022-04-01

### Changed

- Bump minimist from 1.2.5 to 1.2.6 to address a vulnerability.

## [4.1.0] - 2022-03-02

### Changed

- The promise returned from `asyncGetEntry` rejects with a `PerformanceTimingObserverError` in the following cases:

  1. A Resource Timing entry for the test cannot be found within the allotted timeframe. This appears to happen due to Resource Timing implementation bugs, particularly in Safari.
  2. A Resource Timing entry is found for the test but fails validation.

## [4.0.0] - 2022-03-01

### Changed

- BREAKING CHANGE: The `ProviderBase` constructor now requires a `Window` argument.
- Default feature detection (i.e. `ProviderBase::shouldRun`) now requires user agent to implement `PerformanceObserver`, `performance.getEntriesByType` and `PerformanceResourceTiming`.
- Since default feature detection requires native implementations to be present, removed dependencies on `unfetch` and `@fastly/performance-observer-polyfill`.

## [3.1.0] - 2022-02-07

### Added

- Export ClientInfo type.

## [3.0.0] - 2022-02-07

### Changed

- BREAKING CHANGE: Changed Fetch::updateFetchTestResults to take a `PerformanceResourceTiming` parameter. The custom `ResourceTimingEntry` type has been removed.

### Added

- Add optional Test::shouldSendBeacon hook.

### Removed

- Generated documentation is removed from source control. Users can generate documentation from source code to read locally by running `npm run build:doc`.

## [0.1.0] - ???

### Added

- Initial implementation of the Open Insights library.
