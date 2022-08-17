export class PerformanceEntryManagerInitializedMultipleTimes extends Error {
    constructor() {
        super("Performance entry manager initialized multiple times")
        Object.setPrototypeOf(this, new.target.prototype)
    }
}

export class PerformanceEntryManagerNotInitialized extends Error {
    constructor() {
        super("Performance entry manager not initialized")
        Object.setPrototypeOf(this, new.target.prototype)
    }
}

export class PerformanceEntryManager {
    private static _instance: PerformanceEntryManager
    private _observer
    private _consumers: {
        /**
         * The URL of the Resource Timing entry to find.
         */
        url: string
        /**
         * Consumers use the callback to validate and process the
         * Resource Timing entry.
         */
        callback: (entry: PerformanceEntry) => void
    }[] = []
    private constructor(
        newPerformanceObserver: (
            callback: PerformanceObserverCallback,
        ) => PerformanceObserver,
    ) {
        this._observer = newPerformanceObserver((entries) => {
            entries.getEntriesByType("resource").forEach((entry) => {
                // Test the resource "name" to see if any consumers have
                // registered an interest in it.
                console.log(
                    `Count of consumers before: ${this._consumers.length}`,
                )
                const interestedConsumers = this._consumers.filter(
                    (consumer) => consumer.url === entry.name,
                )
                interestedConsumers.forEach((consumer) =>
                    consumer.callback(entry),
                )
                // `indexOf` uses strict equality. For object operands, that's
                // true only if both refer to the same object.
                this._consumers = this._consumers.filter(
                    (consumer) => interestedConsumers.indexOf(consumer) === -1,
                )
                console.log(
                    `Count of consumers after: ${this._consumers.length}`,
                )
            })
        })
        this._observer.observe({
            type: "resource",
            // Disregard entries buffered before the observer was created
            buffered: false,
        })
    }

    static getInstance() {
        if (!PerformanceEntryManager._instance) {
            throw new PerformanceEntryManagerNotInitialized()
        }
        return PerformanceEntryManager._instance
    }

    static init(
        newPerformanceObserver: (
            callback: PerformanceObserverCallback,
        ) => PerformanceObserver,
    ): PerformanceEntryManager {
        if (PerformanceEntryManager._instance) {
            throw new PerformanceEntryManagerInitializedMultipleTimes()
        }
        return (PerformanceEntryManager._instance = new PerformanceEntryManager(
            newPerformanceObserver,
        ))
    }

    disconnectObserver() {
        this._observer && this._observer.disconnect()
    }

    onResourceTimingBufferFull(performance: Performance) {
        performance.clearResourceTimings()
    }

    registerCallback(url: string, callback: (entry: PerformanceEntry) => void) {
        // Need some kind of defensive logic to prevent a memory leak here
        if (this._consumers.length < 10) {
            this._consumers.push({
                url,
                callback,
            })
        } else {
            throw new Error(
                `Too many registered consumers (${this._consumers.length})`,
            )
        }
    }
}
