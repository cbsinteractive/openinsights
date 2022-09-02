import { EntryAwaiter, PerformanceEntryManager } from "./resourceTiming"

interface Dependencies {
    clearTimeout: (timeoutID: number) => void
    fetch: (url: string, options?: RequestInit) => Promise<Response>
    newDate: () => Date
    performanceEntryManager: PerformanceEntryManager
    setTimeout: (fn: () => void, timeout: number) => number
}

export async function fetch<T>(
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
        result: T,
        response: Response,
        performanceEntry: PerformanceEntry,
    ) => Promise<void>,
    sendBeacon: (result: T) => void,
    afterTest: (result: T) => void,
    onError: (error: unknown) => void,
    timeoutCallback: (result: T) => void,
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
        )
        if (response) {
            const entry = await entryAwaiter.awaitEntry()
            if (entry) {
                await beforeBeacon(result, response, entry)
                sendBeacon(result)
            }
        }
        // Ensure that the caller gets to run any clean-up code even if
        // the fetch was unsuccessful. This might include beaconing some
        // kind of error result.
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
        console.warn(e)
        // Swallow errors
    }
}
