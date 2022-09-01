import { EntryAwaiter, PerformanceEntryManager } from "./resourceTiming"

/**
 * Contains common fetch configuration attributes
 */
export interface FetchConfiguration {
    /**
     * Time to wait before aborting fetch, in milliseconds.
     */
    timeout: number
}

export interface FetchTestResultBundle {
    timeoutTriggered: boolean
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
            url,
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
        // Swallow errors but provide caller with an opportunity to respond
        onError(e)
    }
}

async function fetchObject<T extends FetchTestResultBundle>(
    dependencies: Dependencies,
    url: string,
    fetchTimeout: number,
    requestHeaders: Record<string, string> | null,
    testResults: T,
): Promise<Response> {
    const abortController = new AbortController()
    const timeoutID = dependencies.setTimeout(() => {
        abortController.abort()
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
    const response = await dependencies.fetch(url, options)
    await response.blob()
    dependencies.clearTimeout(timeoutID)
    return response
}
