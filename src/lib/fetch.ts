import { PerformanceEntryManager } from "./resourceTiming"

/**
 * Contains common fetch configuration attributes
 */
export interface FetchConfiguration {
    /**
     * Time to wait before aborting fetch, in milliseconds.
     */
    timeout: number
    /**
     * PerformanceObserver timeout in milliseconds.
     */
    performanceTimingObserverTimeout: number
}

export interface FetchTestResultBundle {
    timeoutTriggered: boolean
}

export class ResponseError extends Error {
    constructor(private _url: string, private _status: number) {
        super(`Error downloading ${_url} (HTTP status ${_status})`)
        Object.setPrototypeOf(this, new.target.prototype)
    }

    get status() {
        return this._status
    }

    get url() {
        return this._url
    }
}

interface Dependencies {
    clearTimeout: (timeoutID: number) => void
    fetch: (url: string, options?: RequestInit) => Promise<Response>
    performanceEntryManager: PerformanceEntryManager
    setTimeout: (fn: () => void, timeout: number) => number
}

export function fetch<T extends FetchTestResultBundle>(
    dependencies: Dependencies,
    url: string,
    fetchTimeout: number,
    requestHeaders: Record<string, string> | null,
    beforeTest: () => Promise<T>,
    /**
     * A callback giving the client an opportunity to produce update their
     * test result based on the Response object and the Resource Timing entry.
     */
    beforeBeacon: (
        testResult: T,
        response: Response,
        performanceEntry: PerformanceEntry,
    ) => Promise<T>,
    sendBeacon: (testResult: T) => Promise<T>,
    afterTest: (testResult: T) => Promise<T>,
    onError: (error: string) => void,
): Promise<T> {
    let foundEntry: PerformanceEntry
    dependencies.performanceEntryManager.registerCallback(url, (entry) => {
        console.log(
            `Performance observer consumer callback found ${entry.name}`,
        )
        foundEntry = entry
    })
    const maxRetries = 5
    return beforeTest()
        .then((testResult) =>
            Promise.all([
                Promise.resolve(testResult),
                fetchObject(
                    dependencies,
                    url,
                    fetchTimeout,
                    requestHeaders,
                    testResult,
                ),
            ]),
        )
        .then(([testResult, response]) => {
            console.log(`Ok: ${response.ok}`)
            console.log(`Status: ${response.status}`)
            if (!response.ok) {
                throw new ResponseError(url, response.status)
            }
            return Promise.all([
                Promise.resolve(testResult),
                Promise.resolve(response),
                findEntry(1, 0),
            ])
        })
        .then(([testResult, response, entry]) =>
            beforeBeacon(testResult, response, entry),
        )
        .then((testResult) => sendBeacon(testResult))
        .then((testResult) => afterTest(testResult))
        .catch((reason) => {
            onError(reason)
            return Promise.reject(reason)
        })

    function findEntry(tryNumber: number, delay: number) {
        console.log(`findEntry (try ${tryNumber}, found ${foundEntry})`)
        return foundEntry
            ? Promise.resolve(foundEntry)
            : new Promise<PerformanceEntry>((resolve, reject) =>
                  setTimeout(() => {
                      if (foundEntry) {
                          console.log("Found after delay")
                          resolve(foundEntry)
                      } else if (tryNumber >= maxRetries) {
                          reject(`Entry not found after ${tryNumber} tries`)
                      } else {
                          findEntry(tryNumber + 1, 1000)
                              .then((entry) => resolve(entry))
                              .catch((reason) => reject(reason))
                      }
                  }, delay),
              )
    }
}

function fetchObject<T extends FetchTestResultBundle>(
    dependencies: Dependencies,
    url: string,
    fetchTimeout: number,
    requestHeaders: Record<string, string> | null,
    testResults: T,
): Promise<Response> {
    throw new Error("Oh noes!")
    const abortController = new AbortController()
    const timeoutID = dependencies.setTimeout(() => {
        abortController.abort()
        console.log("Fetch aborted")
        testResults.timeoutTriggered = true
    }, fetchTimeout)
    console.log(`Abort timeout ID: ${timeoutID}`)
    const options: RequestInit = {
        method: "GET",
        // explicitly prevent request from outliving the page
        keepalive: false,
        signal: abortController.signal,
    }
    if (requestHeaders) {
        options.headers = { ...requestHeaders }
    }
    return dependencies
        .fetch(url, options)
        .then((response) => {
            console.log("Response received. Beginning blob download")
            return Promise.all([Promise.resolve(response), response.blob()])
        })
        .then(([response, _blob]) => {
            dependencies.clearTimeout(timeoutID)
            console.log("Blob received. Returning response")
            return response
        })
}
