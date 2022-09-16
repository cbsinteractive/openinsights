import { TestPerformanceObserver } from "../testExtras"
import { PerformanceEntryManager } from "./resourceTiming"

test("Clear Resource Timing buffer when full", () => {
    const manager = new PerformanceEntryManager({
        newDate: jest.fn(),
        newPerformanceObserver: jest
            .fn()
            .mockReturnValueOnce(new TestPerformanceObserver()),
    })
    const performance = {
        clearResourceTimings: jest.fn(),
    }

    // Code under test
    manager.onResourceTimingBufferFull(performance as unknown as Performance)

    // Verify
    expect(performance.clearResourceTimings).toHaveBeenCalled()
})
