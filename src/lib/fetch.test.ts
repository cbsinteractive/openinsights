import { Dependencies, fetch } from "./fetch"
import { PerformanceEntryManagerInterface } from "./resourceTiming"

function newSimpleReturner<T>(series: T[]) {
    let callCount = 0
    return () => {
        return series[callCount++]
    }
}

type SomeResult = {
    timeout: boolean
    blah: string
}

test("Resource Timing entry not found on first try", async () => {
    const performanceEntryManager: PerformanceEntryManagerInterface = {
        disconnectObserver: jest.fn(),
        onResourceTimingBufferFull: jest.fn(),
        registerCallback: jest.fn(),
        unregisterCallback: jest.fn(),
    }
    const mockSetTimeout = jest.fn(
        (() => {
            let callCount = 0
            return (...args) => {
                console.log(
                    `Inside mock setTimeout implementation call ${callCount}`,
                )
                console.log(args)
                if (callCount === 0) {
                } else if (callCount === 1) {
                    args[0]()
                    console.log("Unit test calling production callback:")
                    resourceTimingEntryFoundCallback({})
                } else if (callCount === 2) {
                    args[0]()
                } else {
                    throw new Error(`Unexpected call count`)
                }
                return ++callCount
            }
        })(),
    )
    const dependencies: Dependencies = {
        clearTimeout: jest.fn(),
        fetch: jest.fn((url: string, options?: RequestInit) =>
            Promise.resolve({
                blob: () => Promise.resolve({}),
            } as Response),
        ),
        newDate: jest.fn(
            newSimpleReturner([
                new Date("2020-01-17T03:24:00Z"),
                new Date("2020-01-17T03:24:00.01Z"),
                new Date("2020-01-17T03:24:00.02Z"),
            ]),
        ),
        performanceEntryManager,
        setTimeout: mockSetTimeout,
    }
    // Don't await the result
    const fetchPromise = fetch<SomeResult>(
        dependencies,
        "https://www.example.com/test",
        10000, // 10 second timeout
        null,
        // beforeTest
        () => Promise.resolve({ timeout: false, blah: "abc" }),
        // beforeBeacon
        (
            _result: any,
            _response: Response,
            _performanceEntry: PerformanceEntry,
        ) => {
            console.log(_result)
            console.log(_response)
            console.log(_performanceEntry)
            return Promise.resolve()
        },
        // sendBeacon
        (_result: any) => {
            console.log("sendBeacon")
            console.log(_result)
        },
        // afterTest
        (_result: any) => {
            console.log("afterTest")
            console.log(_result)
        },
        // onError
        (_error: unknown) => {
            console.log("onError")
            console.log(_error)
        },
    )
    console.log("Fetch promise:")
    console.log(fetchPromise)
    console.log("Mock setTimeout calls:")
    console.log(mockSetTimeout.mock.calls)

    const mockRegisterCallback = dependencies.performanceEntryManager
        .registerCallback as jest.Mock
    console.log("Mock registerCallback calls:")
    console.log(mockRegisterCallback.mock.calls)
    const resourceTimingEntryFoundCallback =
        mockRegisterCallback.mock.calls[0][1]

    console.log("Awaiting fetch promise")
    await fetchPromise
})
