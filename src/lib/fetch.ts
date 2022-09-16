import { EntryAwaiter, PerformanceEntryManager } from "./resourceTiming"

export interface Dependencies {
    clearTimeout: (timeoutID: number) => void
    fetch: (url: string, options?: RequestInit) => Promise<Response>
    newAbortController: () => AbortController
    newDate: () => Date
    performanceEntryManager: PerformanceEntryManager
    setTimeout: (fn: () => void, timeout: number) => number
}

export type FetchTestResult = {
    status?: number
    error?: unknown
    timeout: boolean
    entry?: PerformanceEntry
}

/**
 * An asynchronous function encapsulating a configurable test based on the
 * [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API).
 *
 * @param dependencies
 * @param url
 * @param fetchTimeout
 * @param requestHeaders
 * @param beforeTest
 * @param beforeBeacon A callback giving the client an opportunity to produce
 * update their test result based on the Response object and the Resource Timing
 * entry. This *might* involve network activity, so it returns a promise.
 * @param sendBeacon
 * @param afterTest
 * @param onError A callback invoked if any error is encounter *outside of*
 * the fetch request context.
 */
export async function fetch<T extends FetchTestResult>(
    dependencies: Dependencies,
    url: string,
    fetchTimeout: number,
    requestHeaders: Record<string, string> | null,
    beforeTest: () => Promise<T>,
    beforeBeacon: (
        result: T,
        response: Response,
        /**
         * The performance timeline entry for the caller to validate.
         */
        performanceEntry: PerformanceEntry,
    ) => Promise<void>,
    sendBeacon: (result: T) => void,
    afterTest: (result: T) => void,
    onError: (error: unknown) => void,
) {
    try {
        const entryAwaiter = new EntryAwaiter(
            url,
            dependencies.newDate,
            dependencies.setTimeout,
            dependencies.performanceEntryManager,
        )
        const result = await beforeTest()
        const response = await fetchObject(
            dependencies,
            url,
            fetchTimeout,
            requestHeaders,
            result,
        )
        if (response) {
            const entry = await entryAwaiter.awaitEntry()
            if (entry) {
                result.entry = entry
                // Give the caller an opportunity to adorn the result based
                // on the response and performance entry
                await beforeBeacon(result, response, entry)
            }
        }
        sendBeacon(result)
        afterTest(result)
    } catch (e) {
        // Swallow errors but provide caller with an opportunity to respond
        onError(e)
    }
    // Unregistering the performance entry callback **once**, as late as in
    // the measurement sequences as possible
    dependencies.performanceEntryManager.unregisterCallback(url)
}

async function fetchObject<T extends FetchTestResult>(
    dependencies: Dependencies,
    url: string,
    fetchTimeout: number,
    requestHeaders: Record<string, string> | null,
    result: T,
) {
    const abortController = dependencies.newAbortController()
    const timeoutID = dependencies.setTimeout(() => {
        // Record that a timeout took place
        result.timeout = true
        // Force download to stop
        abortController.abort()
    }, fetchTimeout)
    const options: RequestInit = {
        method: "GET",
        // Explicitly prevent request from outliving the page
        keepalive: false,
        signal: abortController.signal,
    }
    if (requestHeaders) {
        options.headers = { ...requestHeaders }
    }
    try {
        const response = await dependencies.fetch(url, options)
        result.status = response.status
        await response.blob()
        dependencies.clearTimeout(timeoutID)
        return response
    } catch (e) {
        // Let caller handle the error later
        result.error = e
    }
}
