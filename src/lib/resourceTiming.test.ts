import { ResourceTimingEntryValidationPredicate } from "../@types"
import { TestCaseConfig } from "../testUtil"
import { asyncGetEntry } from "./resourceTiming"

describe("resourceTiming", () => {
    interface TestConfig extends TestCaseConfig {
        resourceName: string
        timeout: number
        isValidEntryFunc: ResourceTimingEntryValidationPredicate
    }
    const DEFAULT_VALIDATION_FUN = () => true
    const testConfigs: Array<TestConfig> = [
        {
            description:
                "RT entry not found results in PerformanceObserverTimeoutError",
            resourceName: "foo",
            timeout: 10000,
            isValidEntryFunc: DEFAULT_VALIDATION_FUN,
        },
    ]
    testConfigs.forEach((testConfig) => {
        test(testConfig.description, async () => {
            const window = {
                Promise: Promise,
                PerformanceObserver: class implements PerformanceObserver {
                    disconnect(): void {
                        throw new Error("Method not implemented.")
                    }
                    observe(options?: PerformanceObserverInit): void {
                        expect(options).toEqual({ entryTypes: ["resource"] })
                    }
                    takeRecords(): PerformanceEntryList {
                        throw new Error("Method not implemented.")
                    }
                },
                setTimeout: () => 123,
            }
            const result = await asyncGetEntry(
                window as unknown as Window & typeof globalThis,
                testConfig.resourceName,
                testConfig.timeout,
                testConfig.isValidEntryFunc,
            )
            console.log(result)
            expect(1).toBe(2)
        })
    })
})
