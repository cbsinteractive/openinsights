import { EntryAwaiter, PerformanceEntryManager } from "./resourceTiming"

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
    newDate: () => Date
    performanceEntryManager: PerformanceEntryManager
    setTimeout: (fn: () => void, timeout: number) => number
}

export async function fetch<T extends FetchTestResultBundle>(
    dependencies: Dependencies,
    url: string,
    fetchTimeout: number,
    requestHeaders: Record<string, string> | null,
    beforeTest: () => Promise<T>,
    /**
     * A callback giving the client an opportunity to produce update their
     * test result based on the Response object and the Resource Timing entry.
     * This *might* involve network activity, so it returns a promise.
     */
    beforeBeacon: (
        testResult: T,
        response: Response,
        performanceEntry: PerformanceEntry,
    ) => Promise<void>,
    sendBeacon: (testResult: T) => void,
    afterTest: (testResult: T) => void,
    onError: (error: unknown) => void,
) {
    try {
        const entryAwaiter = new EntryAwaiter(
            url + "foo",
            dependencies.performanceEntryManager,
            2000,
            dependencies.newDate,
            dependencies.setTimeout,
        )
        const testResult = await beforeTest()
        const response = await fetchObject(
            dependencies,
            url,
            fetchTimeout,
            requestHeaders,
            testResult,
        )
        const entry = await entryAwaiter.awaitEntry()
        if (entry) {
            console.log("Finished await entryAwaiter.awaitEntry()")
            await beforeBeacon(testResult, response, entry)
            sendBeacon(testResult)
            afterTest(testResult)
        }
    } catch (e) {
        onError(e)
        debugger
    }
}

function fetchObject<T extends FetchTestResultBundle>(
    dependencies: Dependencies,
    url: string,
    fetchTimeout: number,
    requestHeaders: Record<string, string> | null,
    testResults: T,
): Promise<Response> {
    const abortController = new AbortController()
    const timeoutID = dependencies.setTimeout(() => {
        abortController.abort()
        console.warn("Fetch aborted")
        testResults.timeoutTriggered = true
    }, fetchTimeout)
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
            return Promise.all([Promise.resolve(response), response.blob()])
        })
        .then(([response, _blob]) => {
            dependencies.clearTimeout(timeoutID)
            return response
        })
}
