/**
 * Simulate an event loop running to allow awaited processes to complete
 */
export function runEventLoop() {
    return new Promise<void>((resolve) => setTimeout(() => resolve(), 0))
}

export function newPerformanceObserverEntryList(entries: PerformanceEntryList) {
    return {
        getEntries: () => {
            throw "Unexpected call"
        },
        getEntriesByName: jest.fn().mockReturnValueOnce(entries),
        getEntriesByType: () => {
            throw "Unexpected call"
        },
    }
}

export type PerformanceTimingProperties = {
    transferSize?: number
    encodedBodySize?: number
    decodedBodySize?: number
    startTime?: number
    duration?: number
    redirectStart?: number
    redirectEnd?: number
    fetchStart?: number
    domainLookupStart?: number
    domainLookupEnd?: number
    connectStart?: number
    connectEnd?: number
    secureConnectionStart?: number
    requestStart?: number
    responseStart?: number
    responseEnd?: number
}

export class TestAbortSignal implements AbortSignal {
    aborted = false
    onabort = null
    reason = "unknown"
    throwIfAborted = jest.fn()
    addEventListener = jest.fn()
    removeEventListener = jest.fn()
    dispatchEvent = jest.fn()
}

export class TestAbortController implements AbortController {
    signal: AbortSignal = new TestAbortSignal()
    /**
     * In general, the mock implementation should do nothing. In production,
     * calling this function manifests as an error thrown by the fetch sequence.
     * Simulate these in testing by throwing an error from the mock
     * implementations of fetch() and response.blob().
     */
    abort = jest.fn()
}
