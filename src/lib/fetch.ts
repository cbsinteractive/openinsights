import { EntryAwaiter, PerformanceEntryManager } from "./resourceTiming"

interface Dependencies {
    clearTimeout: (timeoutID: number) => void
    fetch: (url: string, options?: RequestInit) => Promise<Response>
    newDate: () => Date
    performanceEntryManager: PerformanceEntryManager
    setTimeout: (fn: () => void, timeout: number) => number
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
 * @param timeoutCallback A callback invoked if the download is cancelled due
 * to the maximum allowed duration being reached.
 * @param fetchError A callback invoked if any error is encountered *during*
 * the fetch request.
 * @param onError A callback invoked if any error is encounter *outside of*
 * the fetch request context.
 */
export async function fetch<T>(
    dependencies: Dependencies,
    url: string,
    fetchTimeout: number,
    requestHeaders: Record<string, string> | null,
    beforeTest: () => Promise<T>,
    beforeBeacon: (
        result: T,
        response: Response,
        performanceEntry: PerformanceEntry,
    ) => Promise<void>,
    sendBeacon: (result: T) => void,
    afterTest: (result: T) => void,
    timeoutCallback: (result: T) => void,
    fetchError: (result: T, e: unknown) => void,
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
        const result = await beforeTest()
        const response = await fetchObject(
            dependencies,
            url,
            fetchTimeout,
            requestHeaders,
            result,
            timeoutCallback,
            fetchError,
        )
        if (response) {
            const entry = await entryAwaiter.awaitEntry()
            if (entry) {
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
}

async function fetchObject<T>(
    dependencies: Dependencies,
    url: string,
    fetchTimeout: number,
    requestHeaders: Record<string, string> | null,
    result: T,
    timeoutCallback: (result: T) => void,
    errorCallback: (result: T, e: unknown) => void,
) {
    const abortController = new AbortController()
    const timeoutID = dependencies.setTimeout(() => {
        // De-register pending callback
        dependencies.performanceEntryManager.unregisterCallback(url)
        // Force download to abort
        abortController.abort()
        // Notify caller of the event
        timeoutCallback(result)
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
    try {
        const response = await dependencies.fetch(url, options)
        await response.blob()
        dependencies.clearTimeout(timeoutID)
        return response
    } catch (e) {
        // Swallow any error, but provide caller with an opportunity
        // to handle it
        errorCallback(result, e)
    }
}
