import { Dependencies, fetch } from "./fetch"
import { PerformanceEntryManagerInterface } from "./resourceTiming"

const tests = [
    {
        description: "foo",
        fetchURL: "some URL",
        fetchTimeout: 123,
    },
]

tests.forEach((t) =>
    test(t.description, async () => {
        const performanceEntryManager: PerformanceEntryManagerInterface = {
            disconnectObserver: function (): void {
                throw new Error("Function not implemented.")
            },
            onResourceTimingBufferFull: function (
                _performance: Performance,
            ): void {
                throw new Error("Function not implemented.")
            },
            registerCallback: function (
                _url: string,
                _callback: (entry: PerformanceEntry) => void,
            ): void {
                throw new Error("Function not implemented.")
            },
            unregisterCallback: function (_url: string): void {
                throw new Error("Function not implemented.")
            },
        }
        const dependencies: Dependencies = {
            clearTimeout: jest.fn(),
            fetch: jest.fn(),
            newDate: jest.fn(),
            performanceEntryManager,
            setTimeout: jest.fn(),
        }
        await fetch(
            dependencies,
            t.fetchURL,
            t.fetchTimeout,
            null,
            () => Promise.resolve({ timeout: false }),
            (
                _result: any,
                _response: Response,
                _performanceEntry: PerformanceEntry,
            ) => Promise.resolve(),
            (_result: any) => {},
            (_result: any) => {},
            (_error: unknown) => {},
        )
    }),
)
