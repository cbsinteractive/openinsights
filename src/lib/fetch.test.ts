import { fetch } from "./fetch"
import {
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

function invokeFetch(url: string) {
    return fetch(
        dependencies,
        url,
        10000, // 10 second timeout
        null,
        // beforeTest
        () => Promise.resolve({ timeout: false, foo: "bar" }),
        // beforeBeacon
        (
            _result: any,
            _response: Response,
            _performanceEntry: PerformanceEntry,
        ) => {
            return Promise.resolve()
        },
        // sendBeacon
        (_result: any) => {},
        // afterTest
        (_result: any) => {},
        // onError,
        (e) => {
            // Allow test to catch and examine the error
            throw e
        },
    )
}

type SetTimeoutSignature = (
    setTimeoutCallback: () => void,
    timeout: number,
) => void

type TestConfig = {
    description: string
    fetchImplementation: (
        url: string,
        options?: RequestInit,
    ) => Promise<Response>
    newDateResults: Date[]
    setTimeoutResults: SetTimeoutSignature[]
    fetchInvocations: (() => Promise<void>)[]
    performanceEntryLists: PerformanceEntryList[]
    expectedFetchError?: Error
}

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

export class TestPerformanceResourceTiming
    implements PerformanceResourceTiming
{
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

const testCases: TestConfig[] = [
    {
        description: "Resource Timing entry found after multiple retries",
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
        fetchInvocations: [() => invokeFetch("https://www.example.com/test")],
        performanceEntryLists: [[new TestPerformanceResourceTiming("foo", {})]],
    },
    {
        description: "Simultaneous measurements are prevented",
        fetchImplementation: newFetchImplementationWithBlob(
            new Blob(["{}"], { type: "application/json" }),
        ),
        newDateResults: [
            new Date("2020-01-17T03:24:00Z"),
            new Date("2020-01-17T03:24:00.5Z"),
        ],
        setTimeoutResults: [
            () => {},
            (setTimeoutCallback) => {
                setTimeoutCallback()
            },
        ],
        fetchInvocations: [
            () => invokeFetch("https://www.example.com/test1"),
            () => invokeFetch("https://www.example.com/test2"),
        ],
        performanceEntryLists: [],
        expectedFetchError: new RegisteredCallbackNotConsumedError(
            "https://www.example.com/test2",
            "https://www.example.com/test1",
        ),
    },
]

testCases.forEach((t) =>
    test(
        t.description,
        async () => {
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
                    t.fetchInvocations.map((invocation) => invocation()),
                )
            } else {
                fetchResult = t.fetchInvocations[0]()
            }

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
                console.log("Callback complete")
                console.log(mockGetEntriesByName.mock.calls)
            })

            console.log("Test awaiting fetch result")
            await fetchResult.catch((e) => {
                if (t.expectedFetchError) {
                    expect(e).toEqual(t.expectedFetchError)
                } else {
                    throw e
                }
            })
            console.log("Production code called")
        },
        // Fail fast (temporary)
        500,
    ),
)
