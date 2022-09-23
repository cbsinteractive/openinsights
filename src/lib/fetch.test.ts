import {
    newPerformanceObserverEntryList,
    runEventLoop,
    TestAbortController,
} from "../testExtras"
import { fetch } from "./fetch"
import {
    createPerformanceEntryManager,
    PerformanceEntryAwaitTimeout,
    RegisteredCallbackNotConsumedError,
} from "./resourceTiming"

test("Find entry immediately", async () => {
    const mockPerformanceObserver = {
        disconnect: jest.fn(),
        observe: jest.fn(),
    } as unknown as PerformanceObserver
    const performanceEntryManagerDependencies = {
        newDate: jest.fn(),
        newPerformanceObserver: jest
            .fn<PerformanceObserver, [PerformanceObserverCallback]>()
            .mockReturnValue(mockPerformanceObserver),
    }
    const testAbortController = new TestAbortController()
    const testResponse = {
        blob: jest
            .fn()
            .mockResolvedValueOnce(
                new Blob(["{}"], { type: "application/json" }),
            ),
    }
    const dependencies = {
        clearTimeout: jest.fn(),
        fetch: jest.fn().mockResolvedValueOnce(testResponse),
        newAbortController: jest.fn().mockReturnValueOnce(testAbortController),
        newDate: jest.fn(),
        performanceEntryManager: createPerformanceEntryManager(
            performanceEntryManagerDependencies,
        ),
        setTimeout: jest.fn(),
    }

    // Code under test
    const fetchResult = fetch(
        dependencies,
        "http://foo/test",
        10000,
        { foo: "bar" },
        () => Promise.resolve({ timeout: false }),
        // beforeBeacon
        () => Promise.resolve(),
        // sendBeacon
        () => {},
        // afterTest
        () => {},
        // onError
        () => {},
    )
    const prodPerformanceObserverCallback =
        performanceEntryManagerDependencies.newPerformanceObserver.mock
            .calls[0][0]

    // Simulate production code not finding the entry
    prodPerformanceObserverCallback(
        newPerformanceObserverEntryList([{} as PerformanceEntry]),
        mockPerformanceObserver,
    )

    await fetchResult

    // Verify
    expect(
        performanceEntryManagerDependencies.newPerformanceObserver,
    ).toHaveBeenCalledTimes(1)
    expect(dependencies.newDate).not.toHaveBeenCalled()
})

test("Find entry after multiple retries", async () => {
    const mockPerformanceObserver = {
        disconnect: jest.fn(),
        observe: jest.fn(),
    } as unknown as PerformanceObserver
    const performanceEntryManagerDependencies = {
        newDate: jest.fn(),
        newPerformanceObserver: jest
            .fn<PerformanceObserver, [PerformanceObserverCallback]>()
            .mockReturnValue(mockPerformanceObserver),
    }
    const testAbortController = new TestAbortController()
    const testResponse = {
        blob: jest
            .fn()
            .mockResolvedValueOnce(
                new Blob(["{}"], { type: "application/json" }),
            ),
    }
    const dependencies = {
        clearTimeout: jest.fn(),
        fetch: jest.fn().mockResolvedValueOnce(testResponse),
        newAbortController: jest.fn().mockReturnValueOnce(testAbortController),
        newDate: jest
            .fn()
            .mockReturnValueOnce(new Date("2020-01-10T10:20:00Z"))
            .mockReturnValueOnce(new Date("2020-01-10T10:20:00.2Z"))
            .mockReturnValueOnce(new Date("2020-01-10T10:20:00.4Z")),
        performanceEntryManager: createPerformanceEntryManager(
            performanceEntryManagerDependencies,
        ),
        setTimeout: jest.fn(),
    }

    // Code under test
    const fetchResult = fetch(
        dependencies,
        "http://foo/test",
        10000,
        { foo: "bar" },
        () => Promise.resolve({ timeout: false }),
        // beforeBeacon
        () => Promise.resolve(),
        // sendBeacon
        () => {},
        // afterTest
        () => {},
        // onError
        () => {},
    )
    const prodPerformanceObserverCallback =
        performanceEntryManagerDependencies.newPerformanceObserver.mock
            .calls[0][0]

    // Simulate production code not finding the entry
    prodPerformanceObserverCallback(
        newPerformanceObserverEntryList([]),
        mockPerformanceObserver,
    )

    await runEventLoop()
    dependencies.setTimeout.mock.calls[1][0]()
    await runEventLoop()
    dependencies.setTimeout.mock.calls[2][0]()

    // Allow production code to "find" the entry before the next
    // simulated timeout elapses
    prodPerformanceObserverCallback(
        newPerformanceObserverEntryList([{} as PerformanceEntry]),
        mockPerformanceObserver,
    )
    await runEventLoop()
    dependencies.setTimeout.mock.calls[3][0]()
    await fetchResult

    // Verify
    expect(
        performanceEntryManagerDependencies.newPerformanceObserver,
    ).toHaveBeenCalledTimes(1)
    expect(dependencies.newDate).toHaveBeenCalledTimes(3)
})

test("Prevent simultaneous measurements", async () => {
    const mockPerformanceObserver = {
        disconnect: jest.fn(),
        observe: jest.fn(),
    } as unknown as PerformanceObserver
    const performanceEntryManagerDependencies = {
        newDate: jest.fn(),
        newPerformanceObserver: jest
            .fn<PerformanceObserver, [PerformanceObserverCallback]>()
            .mockReturnValue(mockPerformanceObserver),
    }
    const testAbortController = new TestAbortController()
    const testResponse = {
        blob: jest
            .fn()
            .mockResolvedValueOnce(
                new Blob(["{}"], { type: "application/json" }),
            ),
    }
    const dependencies = {
        clearTimeout: jest.fn(),
        fetch: jest.fn().mockResolvedValueOnce(testResponse),
        newAbortController: jest.fn().mockReturnValueOnce(testAbortController),
        newDate: jest
            .fn()
            .mockReturnValueOnce(new Date("2020-01-10T10:20:00Z"))
            .mockReturnValueOnce(new Date("2020-01-10T10:20:00.2Z"))
            .mockReturnValueOnce(new Date("2020-01-10T10:20:00.4Z")),
        performanceEntryManager: createPerformanceEntryManager(
            performanceEntryManagerDependencies,
        ),
        setTimeout: jest.fn(),
    }

    // Code under test
    const fetchResult1 = fetch(
        dependencies,
        "http://foo/test1",
        10000,
        { foo: "bar" },
        () => Promise.resolve({ timeout: false }),
        // beforeBeacon
        () => Promise.resolve(),
        // sendBeacon
        () => {},
        // afterTest
        () => {},
        // onError
        () => {},
    )
    let expectedErrorCaught = false
    const fetchResult2 = fetch(
        dependencies,
        "http://foo/test2",
        10000,
        { foo: "bar" },
        () => Promise.resolve({ timeout: false }),
        // beforeBeacon
        () => Promise.resolve(),
        // sendBeacon
        () => {},
        // afterTest
        () => {},
        // onError
        (e) => {
            expect(e).toEqual(
                new RegisteredCallbackNotConsumedError(
                    "http://foo/test2",
                    "http://foo/test1",
                ),
            )
            expectedErrorCaught = true
        },
    )

    await fetchResult2
    const prodPerformanceObserverCallback =
        performanceEntryManagerDependencies.newPerformanceObserver.mock
            .calls[0][0]

    // Simulate production code not finding the entry
    prodPerformanceObserverCallback(
        newPerformanceObserverEntryList([{} as PerformanceEntry]),
        mockPerformanceObserver,
    )
    await fetchResult1

    // Verify
    expect(expectedErrorCaught).toBe(true)
}, 500)

test("Performance entry not found", async () => {
    const mockPerformanceObserver = {
        disconnect: jest.fn(),
        observe: jest.fn(),
    } as unknown as PerformanceObserver
    const performanceEntryManagerDependencies = {
        newDate: jest.fn(),
        newPerformanceObserver: jest
            .fn<PerformanceObserver, [PerformanceObserverCallback]>()
            .mockReturnValue(mockPerformanceObserver),
    }
    const testAbortController = new TestAbortController()
    const testResponse = {
        blob: jest
            .fn()
            .mockResolvedValueOnce(
                new Blob(["{}"], { type: "application/json" }),
            ),
    }
    const dependencies = {
        clearTimeout: jest.fn(),
        fetch: jest.fn().mockResolvedValueOnce(testResponse),
        newAbortController: jest.fn().mockReturnValueOnce(testAbortController),
        newDate: jest
            .fn()
            .mockReturnValueOnce(new Date("2020-01-10T10:20:00Z")),
        performanceEntryManager: createPerformanceEntryManager(
            performanceEntryManagerDependencies,
        ),
        setTimeout: jest.fn(),
    }

    for (
        let i = 0, date = new Date("2020-01-10T10:20:00Z");
        i < 100;
        i++, date = new Date(date.getTime() + 200)
    ) {
        dependencies.newDate.mockReturnValueOnce(date)
    }

    // Code under test
    let expectedErrorCaught = false
    const fetchResult = fetch(
        dependencies,
        "http://foo/test",
        10000,
        { foo: "bar" },
        () => Promise.resolve({ timeout: false }),
        // beforeBeacon
        () => Promise.resolve(),
        // sendBeacon
        () => {},
        // afterTest
        () => {},
        // onError
        (e) => {
            expect(e).toEqual(
                new PerformanceEntryAwaitTimeout("http://foo/test", 2000, 2000),
            )
            expectedErrorCaught = true
        },
    )

    for (let i = 1; i < 12; i++) {
        await runEventLoop()
        dependencies.setTimeout.mock.calls[i][0]()
    }

    await fetchResult

    // Verify
    expect(expectedErrorCaught).toBe(true)
})

test("Timeout during blob phase", async () => {
    const mockPerformanceObserver = {
        disconnect: jest.fn(),
        observe: jest.fn(),
    } as unknown as PerformanceObserver
    const performanceEntryManagerDependencies = {
        newDate: jest.fn(),
        newPerformanceObserver: jest
            .fn<PerformanceObserver, [PerformanceObserverCallback]>()
            .mockReturnValue(mockPerformanceObserver),
    }
    const testAbortController = new TestAbortController()
    const testResponse = {
        blob: jest.fn().mockImplementationOnce(() => {
            // Simulate a timeout
            dependencies.setTimeout.mock.calls[0][0]()
            throw "Some browser-specific way of saying that the download was cancelled"
        }),
    }
    const dependencies = {
        clearTimeout: jest.fn(),
        fetch: jest.fn().mockResolvedValueOnce(testResponse),
        newAbortController: jest.fn().mockReturnValueOnce(testAbortController),
        newDate: jest
            .fn()
            .mockReturnValueOnce(new Date("2020-01-10T10:20:00Z")),
        performanceEntryManager: createPerformanceEntryManager(
            performanceEntryManagerDependencies,
        ),
        setTimeout: jest.fn(),
    }

    for (
        let i = 0, date = new Date("2020-01-10T10:20:00Z");
        i < 100;
        i++, date = new Date(date.getTime() + 200)
    ) {
        dependencies.newDate.mockReturnValueOnce(date)
    }

    // Code under test
    const result = { timeout: false }
    const fetchResult = fetch(
        dependencies,
        "http://foo/test",
        10000,
        { foo: "bar" },
        () => Promise.resolve(result),
        // beforeBeacon
        () => Promise.resolve(),
        // sendBeacon
        () => {},
        // afterTest
        () => {},
        // onError
        () => {},
    )

    await fetchResult

    // Verify
    expect(result.timeout).toBe(true)
}, 500)
