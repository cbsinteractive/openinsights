import { fetch } from "./fetch"
import {
    PerformanceEntryAwaitTimeout,
    PerformanceEntryManager,
    RegisteredCallbackNotConsumedError,
} from "./resourceTiming"

type FakePerformanceObserver = {
    callback: PerformanceObserverCallback
}

let fakePerformanceObserver: FakePerformanceObserver & PerformanceObserver

const dependencies = {
    clearTimeout: jest.fn(),
    fetch: jest.fn(),
    newAbortController: jest.fn(),
    newDate: jest.fn(),
    performanceEntryManager: new PerformanceEntryManager({
        newDate: jest.fn(),
        newPerformanceObserver: (performanceObserverCallback) => {
            fakePerformanceObserver = {
                callback: performanceObserverCallback,
                disconnect: jest.fn(),
                observe: jest.fn(),
                takeRecords: jest.fn(),
            }
            return fakePerformanceObserver
        },
    }),
    setTimeout: jest.fn(),
}

function newFetchImplementationWithBlob(blob: Blob) {
    return (_url: string, _options?: RequestInit) =>
        Promise.resolve({
            blob: () => Promise.resolve(blob),
        } as Response)
}

beforeEach(() => {
    // Reset all mocks in scope
    jest.resetAllMocks()
})

function invokeFetch(
    t: TestConfig,
    url: string,
    requestHeaders: Record<string, string> | null,
) {
    return fetch(
        dependencies,
        url,
        10000, // 10 second timeout
        requestHeaders,
        // beforeTest
        () => Promise.resolve({ timeout: false, foo: "bar" }),
        t.beforeBeacon || (() => Promise.resolve()),
        t.sendBeacon || (() => {}),
        // afterTest
        (_result: any) => {},
        t.onError ||
            (() => {
                // Normal behavior is to swallow the error
                // Test might override this if they need to examine it
            }),
    )
}

type SetTimeoutSignature = (
    setTimeoutCallback: () => void,
    timeout: number,
) => void

type PerformanceTimingProperties = {
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

class TestPerformanceResourceTiming implements PerformanceResourceTiming {
    constructor(name: string, props: PerformanceTimingProperties) {
        const getNumericProperty = (
            setting: number | undefined,
            defaultValue: number,
        ) => {
            return typeof setting === "number" ? setting : defaultValue
        }

        this.name = name
        this.transferSize = getNumericProperty(props.transferSize, 1000000)
        this.encodedBodySize = getNumericProperty(props.encodedBodySize, 900000)
        this.decodedBodySize = getNumericProperty(props.decodedBodySize, 800000)
        this.startTime = getNumericProperty(props.startTime, 1000.123)
        // Default redirect time is 0s
        this.redirectStart = getNumericProperty(props.redirectStart, 0)
        this.redirectEnd = getNumericProperty(props.redirectEnd, 0)
        // `fetchStart` is basically the "post-redirect" start time. It's usually a
        // tiny bit later than `startTime`
        this.fetchStart = getNumericProperty(props.fetchStart, 1000.456)
        this.domainLookupStart = getNumericProperty(
            props.domainLookupStart,
            1001.123,
        )
        this.domainLookupEnd = getNumericProperty(
            props.domainLookupEnd,
            1002.123,
        )
        this.connectStart = getNumericProperty(props.connectStart, 2010.123)
        this.secureConnectionStart = getNumericProperty(
            props.secureConnectionStart,
            2012.123,
        )
        // Connect end encompasses TLS handshake
        this.connectEnd = getNumericProperty(props.connectEnd, 2013.123)
        // Usually a tiny bit later than connect end
        this.requestStart = getNumericProperty(props.requestStart, 2013.456)
        this.responseStart = getNumericProperty(props.responseStart, 2014.123)
        this.responseEnd = getNumericProperty(props.responseEnd, 3010.123)

        // Calculate the default
        this.duration = getNumericProperty(
            props.duration,
            this.responseEnd - this.startTime,
        )
    }

    entryType = "resource"
    name: string
    transferSize: number
    encodedBodySize: number
    decodedBodySize: number
    initiatorType = "unused"
    nextHopProtocol = "unused"
    startTime: number
    duration: number
    workerStart = 0 // unused
    redirectStart: number
    redirectEnd: number
    fetchStart: number
    domainLookupStart: number
    domainLookupEnd: number
    connectStart: number
    secureConnectionStart: number
    connectEnd: number
    requestStart: number
    responseStart: number
    responseEnd: number
    serverTiming: readonly PerformanceServerTiming[] = []
    toJSON() {
        return {
            startTime: this.startTime,
            duration: this.duration,
            redirectStart: this.redirectStart,
            redirectEnd: this.redirectEnd,
            fetchStart: this.fetchStart,
            domainLookupStart: this.domainLookupStart,
            domainLookupEnd: this.domainLookupEnd,
            connectStart: this.connectStart,
            connectEnd: this.connectEnd,
            secureConnectionStart: this.secureConnectionStart,
            requestStart: this.requestStart,
            responseStart: this.responseStart,
            responseEnd: this.responseEnd,
            transferSize: this.transferSize,
            encodedBodySize: this.encodedBodySize,
            decodedBodySize: this.decodedBodySize,
        }
    }
}

class TestAbortSignal implements AbortSignal {
    aborted = false
    onabort = null
    reason: any
    throwIfAborted(): void {
        throw new Error("Method not implemented.")
    }
    addEventListener<K extends "abort">(
        type: K,
        listener: (this: AbortSignal, ev: AbortSignalEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions | undefined,
    ): void
    addEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions | undefined,
    ): void
    addEventListener(
        _type: unknown,
        _listener: unknown,
        _options?: unknown,
    ): void {
        throw new Error("Method not implemented.")
    }
    removeEventListener<K extends "abort">(
        type: K,
        listener: (this: AbortSignal, ev: AbortSignalEventMap[K]) => any,
        options?: boolean | EventListenerOptions | undefined,
    ): void
    removeEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | EventListenerOptions | undefined,
    ): void
    removeEventListener(
        _type: unknown,
        _listener: unknown,
        _options?: unknown,
    ): void {
        throw new Error("Method not implemented.")
    }
    dispatchEvent(_event: Event): boolean {
        throw new Error("Method not implemented.")
    }
}

class TestAbortController implements AbortController {
    signal: AbortSignal = new TestAbortSignal()
    abort(reason?: any): void
    abort(): void
    abort(_reason?: unknown): void {
        // Do nothing. Calling this function manifests at an error thrown by
        // the fetch sequence (e.g. fetch() or response.blob())
    }
}

type TestConfig = {
    description: string
    newAbortControllerResult: AbortController | null
    fetchImplementation: (
        url: string,
        options?: RequestInit,
    ) => Promise<Response>
    newDateResults: Date[]
    setTimeoutResults: SetTimeoutSignature[]
    fetchInvocations: { url: string; requestHeaders?: Record<string, string> }[]
    performanceEntryLists: PerformanceEntryList[]
    beforeBeacon?: (
        result: any,
        response: Response,
        performanceEntry: PerformanceEntry,
    ) => Promise<void>
    sendBeacon?: (result: any) => void
    onError?: (e: unknown) => void
    validations?: {
        clearTimeout?: (m: jest.Mock) => void
        fetch?: (m: jest.Mock) => void
        onError?: (m: jest.Mock) => void
    }
}

const testCases: TestConfig[] = [
    {
        description: "Resource Timing entry found after multiple retries",
        newAbortControllerResult: new TestAbortController(),
        fetchImplementation: newFetchImplementationWithBlob(
            new Blob(["{}"], { type: "application/json" }),
        ),
        newDateResults: [
            new Date("2020-01-17T03:24:00Z"),
            new Date("2020-01-17T03:24:01Z"),
            new Date("2020-01-17T03:24:02Z"),
        ],
        setTimeoutResults: [
            () => {},
            (setTimeoutCallback) => {
                setTimeoutCallback()
            },
            (setTimeoutCallback) => {
                setTimeoutCallback()
            },
        ],
        fetchInvocations: [
            { url: "https://entry-found-after-multiple-retries" },
        ],
        performanceEntryLists: [[new TestPerformanceResourceTiming("foo", {})]],
        validations: {
            clearTimeout: (m) => {
                console.log(m)
                expect(m).toHaveBeenCalledTimes(1)
            },
        },
    },
    {
        description: "Simultaneous measurements are prevented",
        newAbortControllerResult: new TestAbortController(),
        fetchImplementation: newFetchImplementationWithBlob(
            new Blob(["{}"], { type: "application/json" }),
        ),
        newDateResults: [
            new Date("2020-01-17T03:24:00Z"),
            new Date("2020-01-17T03:24:00.2Z"),
        ],
        setTimeoutResults: [
            () => {},
            (setTimeoutCallback) => {
                setTimeoutCallback()
            },
        ],
        fetchInvocations: [
            { url: "https://simultaneous-measurements-prevented/1" },
            { url: "https://simultaneous-measurements-prevented/2" },
        ],
        performanceEntryLists: [[new TestPerformanceResourceTiming("foo", {})]],
        onError: jest.fn(),
        validations: {
            onError: (m) => {
                const typed = m.mock
                    .calls[0][0] as RegisteredCallbackNotConsumedError
                expect(typed.message).toBe(
                    "Callback not consumed (being added: https://simultaneous-measurements-prevented/2, still registered: https://simultaneous-measurements-prevented/1)",
                )
                expect(typed.urlBeingAdded).toBe(
                    "https://simultaneous-measurements-prevented/2",
                )
                expect(typed.urlStillRegistered).toBe(
                    "https://simultaneous-measurements-prevented/1",
                )
            },
        },
    },
    {
        description: "Timeout reached during fetch",
        newAbortControllerResult: new TestAbortController(),
        fetchImplementation: () => {
            throw "Some browser-specific error talking about how this download failed"
        },
        newDateResults: [new Date("2020-01-17T03:24:00Z")],
        setTimeoutResults: [
            (setTimeoutCallback) => {
                console.warn("Timeout handler 1")
                setTimeoutCallback()
            },
        ],
        fetchInvocations: [{ url: "https://www.example.com/3/test" }],
        performanceEntryLists: [],
        sendBeacon: (result) => {
            expect(result.error).toBe(
                "Some browser-specific error talking about how this download failed",
            )
        },
    },
    {
        description: "Resource Timing entry fails to appear",
        newAbortControllerResult: new TestAbortController(),
        fetchImplementation: newFetchImplementationWithBlob(
            new Blob(["{}"], { type: "application/json" }),
        ),
        newDateResults: (() => {
            const result = [new Date("2020-01-17T03:24:00Z")]
            for (let i = 0; i < 20; i++) {
                // Add 100 milliseconds to each successive Date
                result.push(new Date(result[i].getTime() + 100))
            }
            return result
        })(),
        setTimeoutResults: (() => {
            const result: SetTimeoutSignature[] = [() => {}]
            for (let i = 0; i < 20; i++) {
                result.push((setTimeoutCallback) => {
                    setTimeoutCallback()
                })
            }
            return result
        })(),
        fetchInvocations: [{ url: "https://entry-fails-to-appear" }],
        performanceEntryLists: Array(20).fill([]),
        onError: jest.fn(),
        validations: {
            onError: (m) => {
                const typed = m.mock.calls[0][0] as PerformanceEntryAwaitTimeout
                expect(typed.message).toBe(
                    "Failed to find an entry for https://entry-fails-to-appear after 2000 milliseconds (max wait 2000)",
                )
                expect(typed.url).toBe("https://entry-fails-to-appear")
                expect(typed.duration).toBe(2000)
                expect(typed.maxWait).toBe(2000)
            },
        },
    },
    {
        description: "Timeout reached during response.blob",
        newAbortControllerResult: new TestAbortController(),
        fetchImplementation: () =>
            Promise.resolve({
                blob: () => {
                    throw "Some browser-specific error talking about how this download failed (response.blob)"
                },
            } as unknown as Response),
        newDateResults: [new Date("2020-01-17T03:24:00Z")],
        setTimeoutResults: [
            (setTimeoutCallback) => {
                console.warn("Timeout handler 1")
                setTimeoutCallback()
            },
        ],
        fetchInvocations: [{ url: "https://www.example.com/4/test" }],
        performanceEntryLists: [],
        sendBeacon: (result) => {
            expect(result.error).toBe(
                "Some browser-specific error talking about how this download failed (response.blob)",
            )
        },
    },
    {
        description: "Send custom request headers",
        newAbortControllerResult: new TestAbortController(),
        fetchImplementation: newFetchImplementationWithBlob(
            new Blob(["{}"], { type: "application/json" }),
        ),
        newDateResults: [
            new Date("2020-01-17T03:24:00Z"),
            new Date("2020-01-17T03:24:01Z"),
        ],
        setTimeoutResults: [
            () => {},
            (setTimeoutCallback) => {
                setTimeoutCallback()
            },
        ],
        fetchInvocations: [
            {
                url: "https://send-custom-request-headers",
                requestHeaders: { foo: "bar" },
            },
        ],
        performanceEntryLists: [[new TestPerformanceResourceTiming("foo", {})]],
        validations: {
            fetch: (m) => {
                expect(m.mock.calls[0][0]).toBe(
                    "https://send-custom-request-headers",
                )
                expect(m.mock.calls[0][1].headers).toEqual({ foo: "bar" })
            },
        },
    },
]

testCases.forEach((t) =>
    test(
        t.description,
        async () => {
            if (t.newAbortControllerResult) {
                dependencies.newAbortController.mockReturnValueOnce(
                    t.newAbortControllerResult,
                )
            }
            dependencies.fetch.mockImplementationOnce(t.fetchImplementation)
            t.newDateResults.forEach((d) =>
                dependencies.newDate.mockReturnValueOnce(d),
            )
            t.setTimeoutResults.forEach((sig) =>
                dependencies.setTimeout.mockImplementationOnce(sig),
            )

            // Code under test
            let fetchResult: Promise<void | void[]>
            if (t.fetchInvocations.length > 1) {
                fetchResult = Promise.all(
                    t.fetchInvocations.map((invocationConfig) =>
                        invokeFetch(
                            t,
                            invocationConfig.url,
                            invocationConfig.requestHeaders != undefined
                                ? invocationConfig.requestHeaders
                                : null,
                        ),
                    ),
                )
            } else {
                const invocationConfig = t.fetchInvocations[0]
                fetchResult = invokeFetch(
                    t,
                    invocationConfig.url,
                    invocationConfig.requestHeaders != undefined
                        ? invocationConfig.requestHeaders
                        : null,
                )
            }
            console.log("Test: Invoked fetch")
            console.log(fetchResult)

            // At this point openinsights.fetch has been called, possibly
            // multiple times. At some point in the future, the PerformanceObserver
            // encapsulated in dependencies.performanceEntryManager will notice
            // that an entry matching the test object's URL exists. It's callback
            // may be invoked many times before this happens, however.

            t.performanceEntryLists.forEach((entries) => {
                const mockGetEntriesByName = jest
                    .fn()
                    .mockReturnValueOnce(entries)
                fakePerformanceObserver.callback(
                    {
                        getEntries: function (): PerformanceEntryList {
                            throw new Error("Function not implemented.")
                        },
                        getEntriesByName: mockGetEntriesByName,
                        getEntriesByType: function (
                            _type: string,
                        ): PerformanceEntryList {
                            throw new Error("Function not implemented.")
                        },
                    },
                    fakePerformanceObserver,
                )
                console.log(mockGetEntriesByName.mock.calls)
            })

            console.log("Test: awaiting fetch result")
            console.log(fetchResult)
            await fetchResult

            // Validate calls on mock functions
            if (t.validations) {
                if (t.validations.clearTimeout) {
                    t.validations.clearTimeout(dependencies.clearTimeout)
                }
                if (t.validations.fetch) {
                    t.validations.fetch(dependencies.fetch)
                }
                if (t.validations.onError) {
                    t.validations.onError(t.onError as jest.Mock)
                }
            }
        },
        // Fail fast (temporary)
        // 500,
    ),
)
