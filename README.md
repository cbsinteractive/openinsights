# Open Insights

[![Lint](https://github.com/cbsinteractive/openinsights/actions/workflows/lint.yml/badge.svg?branch=main-forked)](https://github.com/cbsinteractive/openinsights/actions/workflows/lint.yml)

Open Insights is a framework for constructing browser-based RUM clients.

## Why Use It

- Open Insights represents a collaboration by industry members to measure, and ultimately improve, the internet as a whole.
- Open Insights is designed to work with multiple vendors.
- Open Insights is meant to be self-hosted, unlike many vendor-centric, browser-based RUM clients.
- Open Insights gives the site owner control over code compilation and included functionality.

## Example

```typescript
import * as openinsights from "@tacoherd/openinsights"

const openinsightsFetchDependencies = {
  clearTimeout: (timeoutID) => clearTimeout(timeoutID),
  fetch: (url, options) => fetch(url, options),
  newAbortController: () => new AbortController(),
  newDate: () => new Date(),
  performanceEntryManager: new openinsights.PerformanceEntryManager({
    newDate: () => new Date(),
    newPerformanceObserver: (callback) => new PerformanceObserver(callback),
  }),
  setTimeout: (fn, timeout) => setTimeout(fn as TimerHandler, timeout),
}

const customFetchBehavior = (sessionConfiguration, url) => async () => {
  console.log(sessionConfiguration)
  openinsights.fetch(
    openinsightsFetchDependencies,
    url,
    /**
     * fetchTimeoutInMilliseconds
     */
    8000,
    /**
     * requestHeaders
     */
    null,
    /**
     * beforeTest
     */
    async () => ({ timeout: false }),
    /**
     * beforeBeacon
     *
     * Optional processing before sending a beacon (e.g. obtain client DNS resolver IP)
     */
    async (result, response, performanceEntry) => {},
    /**
     * sendBeacon
     *
     * Clients can beacon data any way they like here (Beacon API, Fetch API, <img src="...">, etc.)
     *
     * @param result An object containing the HTTP status and the Resource Timing entry from which to produce a beacon payload
     */
    (result) => {
      navigator.sendBeacon(
        "https://some.beacon.ingest.service/",
        new Blob(
          [
            JSON.stringify({
              /* some encoded data */
            }),
          ],
          { type: "application/json" },
        ),
      )
    },
    /**
     * afterTest
     */
    (result) => {},
    /**
     * onError
     */
    (error: unknown) => {},
  )
}

const sessionStartupFuncs = [
  {
    fetchSessionConfiguration: async () => {
      return await fetch(
        "https://some.session.config.service/sessionconfig.json",
      ).then((response) => response.json())
    },
    produceExecutables: (sessionConfiguration) => {
      // Produce any number of tests to be run sequentially
      return [
        {
          execute: customFetchBehavior(
            sessionConfiguration,
            /**
             * A test object served with:
             * - `access-control-allow-origin: *`
             * - `timing-allow-origin: *`
             */
            "https://some.service.to.test/test.png",
          ),
        },
        /* ... */
      ]
    },
  },
  /* ... */
]

openinsights.init(
  /**
   * getDocumentReadyState
   */
  () => document.readyState,
  /**
   * addDocumentReadyStateChangeListener
   */
  (callback) => document.addEventListener("readystatechange", callback),
  /**
   * sessionConfigDelayInMilliseconds
   */
  10000,
  /**
   * sessionStartupFuncs
   */
  sessionStartupFuncs,
)
```

## Development

In most cases, developers will reference the core module as a dependency, using it to compile a customized client for use on their sites. These instructions are for working on the core module itself.

### Install Dependencies

Within the project root directory:

```shell
npm install
```

### Run Linter

```shell
npm run lint
```

### Run Tests

```shell
npm test
```

### Build Code Documentation

```shell
npm run build:doc
```

### Publish

Install prerequesite:

```shell
npm install --global np
```

Build release and publish to npm:

```shell
np --branch main-forked
```
