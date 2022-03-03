import { TestCaseConfig, TestPerformanceResourceTiming } from "../testUtil"
import { asyncGetEntry } from "./resourceTiming"

describe("resourceTiming", () => {
    interface TestConfig extends TestCaseConfig {
        resourceName: string
        timeout: number
        getEntriesByNameResults: Array<PerformanceEntryList>
        isValidEntryFuncResults: Array<boolean>
        expectedResult: PerformanceResourceTiming
    }
    const testConfigs: Array<TestConfig> = [
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
            expectedResult: new TestPerformanceResourceTiming(
                "https://foo.com/testobject",
                {},
            ),
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
                    observe(options?: PerformanceObserverInit): void {
                        expect(options).toEqual({ entryTypes: ["resource"] })
                        this._callback(list, this)
                    }
                    takeRecords(): PerformanceEntryList {
                        throw new Error("Method not implemented.")
                    }
                },
                PerformanceResourceTiming: TestPerformanceResourceTiming,
                setTimeout: () => 123,
                clearTimeout: () => {},
            }
            const isValidEntryFunc = jest.fn()
            testConfig.isValidEntryFuncResults.forEach((i) =>
                isValidEntryFunc.mockReturnValueOnce(i),
            )
            const result = await asyncGetEntry(
                window as unknown as Window & typeof globalThis,
                testConfig.resourceName,
                testConfig.timeout,
                isValidEntryFunc,
            )
            console.log(result)
            expect(isValidEntryFunc.mock.calls.length).toBe(
                testConfig.isValidEntryFuncResults.length,
            )
            expect(result).toEqual(testConfig.expectedResult)
        })
    })
})
