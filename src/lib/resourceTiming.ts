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
    constructor(
        newPerformanceObserver: (
            callback: PerformanceObserverCallback,
        ) => PerformanceObserver,
    ) {
        this._observer = newPerformanceObserver((entries) => {
            entries.getEntriesByType("resource").forEach((entry) => {
                // Test the resource "name" to see if any consumers have
                // registered an interest in it.
                const countOfConsumersBefore = this._consumers.length
                const interestedConsumers = this._consumers.filter(
                    (consumer) => consumer.url === entry.name,
                )
                interestedConsumers.forEach((consumer) => {
                    consumer.callback(entry)
                })
                // `indexOf` uses strict equality. For object operands, that's
                // true only if both refer to the same object.
                this._consumers = this._consumers.filter(
                    (consumer) => interestedConsumers.indexOf(consumer) === -1,
                )
                const countOfConsumersAfter = this._consumers.length
                console.log(
                    `Performance Entry Manager: consumer count diff: ${
                        countOfConsumersAfter - countOfConsumersBefore
                    }`,
                )
            })
        })
        this._observer.observe({
            type: "resource",
            // Disregard entries buffered before the observer was created
            buffered: false,
        })
    }

    disconnectObserver() {
        this._observer && this._observer.disconnect()
    }

    onResourceTimingBufferFull(performance: Performance) {
        console.log("Clearing Resource Timing buffer")
        performance.clearResourceTimings()
    }

    registerCallback(url: string, callback: (entry: PerformanceEntry) => void) {
        // Need some kind of defensive logic to prevent a memory leak here
        console.warn("TODO: Implement better callback cache guard")
        if (this._consumers.length < 5) {
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
