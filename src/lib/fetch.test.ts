import { fetch } from "./fetch"

const dependencies = {
    clearTimeout: jest.fn(),
    fetch: jest.fn(),
    newDate: jest.fn(),
    performanceEntryManager: {
        disconnectObserver: jest.fn(),
        onResourceTimingBufferFull: jest.fn(),
        registerCallback: jest.fn(),
        unregisterCallback: jest.fn(),
    },
    setTimeout: jest.fn(),
}

function newFetchImplementationWithBlob(blob: Blob) {
    return (url: string, options?: RequestInit) =>
        Promise.resolve({
            blob: () => Promise.resolve(blob),
        } as Response)
}

beforeEach(() => {
    // Reset all mocks in scope
    jest.resetAllMocks()
})

async function invokeFetch() {
    const fetchPromise = fetch(
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
    await fetchPromise
}

test("Resource Timing found after multiple retries", async () => {
    dependencies.fetch.mockImplementationOnce(
        newFetchImplementationWithBlob(
            new Blob(["{}"], { type: "application/json" }),
        ),
    )
    dependencies.newDate.mockReturnValueOnce(new Date("2020-01-17T03:24:00Z"))
    dependencies.newDate.mockReturnValueOnce(new Date("2020-01-17T03:24:01Z"))
    dependencies.newDate.mockReturnValueOnce(new Date("2020-01-17T03:24:02Z"))
    dependencies.setTimeout.mockImplementationOnce((_setTimeoutCallback) => {})
    dependencies.setTimeout.mockImplementationOnce((setTimeoutCallback) => {
        setTimeoutCallback()
        // Invoke the entry found callback after this setTimeout callback so
        // that the next setTimeout callback will find the entry cached
        const entryFoundCallback =
            dependencies.performanceEntryManager.registerCallback.mock
                .calls[0][1]
        entryFoundCallback({
            foo: "bar",
        })
    })
    dependencies.setTimeout.mockImplementationOnce((setTimeoutCallback) => {
        setTimeoutCallback()
    })

    // Code under test
    await invokeFetch()

    // Verify
    expect(
        dependencies.performanceEntryManager.registerCallback.mock.calls.length,
    ).toBe(1)
})
