import { TestCaseConfig, TestPerformanceResourceTiming } from "../testUtil"
import {
    asyncGetEntry,
    NoValidEntryError,
    PerformanceTimingObserverTimeoutError,
} from "./resourceTiming"

describe("resourceTiming", () => {
    interface TestConfig extends TestCaseConfig {
        resourceName: string
        timeout: number
        getEntriesByNameResults?: Array<PerformanceEntryList>
        isValidEntryFuncResults: Array<boolean>
        ensureTimeout?: boolean
        exceptionOnObserve?: Error
        expectedResult?: PerformanceResourceTiming
        expectedError?: Error
    }
    const testConfigs: Array<TestConfig> = [
        {
            description: "RT entry found",
            resourceName: "foo",
            timeout: 10000,
            getEntriesByNameResults: [
                [
                    new TestPerformanceResourceTiming(
                        "https://foo.com/testobject",
                        {},
                    ),
                ],
            ],
            isValidEntryFuncResults: [true],
            expectedResult: new TestPerformanceResourceTiming(
                "https://foo.com/testobject",
                {},
            ),
        },
        {
            description:
                "RT entry not found results in PerformanceObserverTimeoutError",
            resourceName: "foo",
            timeout: 10000,
            getEntriesByNameResults: [
                [
                    new TestPerformanceResourceTiming(
                        "https://foo.com/testobject",
                        {},
                    ),
                ],
            ],
            isValidEntryFuncResults: [true],
            ensureTimeout: true,
            expectedError: new PerformanceTimingObserverTimeoutError(
                "foo",
                10000,
            ),
        },
        {
            description: "Invalid RT entry results in NoValidEntryError",
            resourceName: "foo",
            timeout: 10000,
            getEntriesByNameResults: [
                [
                    new TestPerformanceResourceTiming(
                        "https://foo.com/testobject",
                        {},
                    ),
                ],
            ],
            isValidEntryFuncResults: [false],
            ensureTimeout: false,
            expectedError: new NoValidEntryError("foo", [
                new TestPerformanceResourceTiming(
                    "https://foo.com/testobject/blah",
                    {},
                ),
            ]),
        },
        {
            description: "Exception thrown by observe is propagated",
            resourceName: "foo",
            timeout: 10000,
            isValidEntryFuncResults: [],
            ensureTimeout: false,
            exceptionOnObserve: new Error("Oh noes!!!"),
            expectedError: new Error("Oh noes!!!"),
        },
    ]
    testConfigs.forEach((testConfig) => {
        test(testConfig.description, async () => {
            const list: PerformanceObserverEntryList = {
                getEntries: function (): PerformanceEntryList {
                    throw new Error("Function not implemented.")
                },
                getEntriesByName: jest.fn(),
                getEntriesByType: function (): PerformanceEntryList {
                    throw new Error("Function not implemented.")
                },
            }
            testConfig.getEntriesByNameResults &&
                testConfig.getEntriesByNameResults.forEach((i) =>
                    (
                        list.getEntriesByName as jest.Mock<any, any>
                    ).mockReturnValueOnce(i),
                )
            const window = {
                Promise: Promise,
                PerformanceObserver: class TestPerformanceObserver
                    implements PerformanceObserver
                {
                    constructor(
                        private _callback: PerformanceObserverCallback,
                    ) {}
                    disconnect(): void {}
                    observe(): void {
                        if (testConfig.exceptionOnObserve) {
                            throw testConfig.exceptionOnObserve
                        }
                        this._callback(list, this)
                    }
                    takeRecords(): PerformanceEntryList {
                        throw new Error("Method not implemented.")
                    }
                },
                PerformanceResourceTiming: TestPerformanceResourceTiming,
                setTimeout: jest.fn(),
                clearTimeout: () => {},
            }
            const isValidEntryFunc = jest.fn()
            testConfig.isValidEntryFuncResults.forEach((i) =>
                isValidEntryFunc.mockReturnValueOnce(i),
            )
            if (testConfig.expectedResult) {
                window.setTimeout.mockReturnValueOnce(123)
                expect(
                    await asyncGetEntry(
                        window as unknown as Window & typeof globalThis,
                        {
                            clearTimeout: jest.fn(),
                            setTimeout: jest.fn(),
                            Promise,
                        },
                        testConfig.resourceName,
                        testConfig.timeout,
                        isValidEntryFunc,
                    ),
                ).toEqual(testConfig.expectedResult)
            } else {
                window.setTimeout.mockImplementationOnce((callback) => {
                    if (testConfig.ensureTimeout) {
                        callback.apply()
                    }
                    return 123
                })
                await expect(
                    asyncGetEntry(
                        window as unknown as Window & typeof globalThis,
                        testConfig.resourceName,
                        testConfig.timeout,
                        isValidEntryFunc,
                    ),
                ).rejects.toEqual(testConfig.expectedError)
            }
            expect(isValidEntryFunc.mock.calls.length).toBe(
                testConfig.isValidEntryFuncResults.length,
            )
        })
    })

    test("Cover PerformanceTimingObserverTimeoutError", () => {
        const sut = new PerformanceTimingObserverTimeoutError("foo", 123)
        expect(sut.message).toBe(
            "Timeout waiting for timing data to appear for foo (timeout: 123)",
        )
    })

    test("Cover NoValidEntryError", () => {
        const sut = new NoValidEntryError("foo", [])
        expect(sut.message).toBe(
            "At least one Resource Timing entry was found for foo but none passed validation",
        )
    })
})
