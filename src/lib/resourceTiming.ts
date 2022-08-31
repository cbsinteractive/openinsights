export class RegisteredCallbackNotConsumedError extends Error {
    constructor(private _previousCallbackBundle: RegisteredCallbackBundle) {
        super("The previous callback was not consumed")
        Object.setPrototypeOf(this, new.target.prototype)
    }

    get previousCallback() {
        return this._previousCallbackBundle
    }
}

export type RegisteredCallbackBundle = {
    /**
     * The URL of the Resource Timing entry to find.
     */
    url: string
    /**
     * Consumers use the callback to validate and process the
     * Resource Timing entry.
     */
    callback: (entry: PerformanceEntry) => void
    registeredAt: Date
}

type Dependencies = {
    newDate: () => Date
    newPerformanceObserver: (
        callback: PerformanceObserverCallback,
    ) => PerformanceObserver
}

export class PerformanceEntryManager {
    private _observer
    private _callbackBundle?: RegisteredCallbackBundle
    constructor(private _dependencies: Dependencies) {
        this._observer = this._dependencies.newPerformanceObserver(
            (entries) => {
                if (this._callbackBundle != undefined) {
                    // Note that getEntriesByType *can* produce multiple
                    // records for the same URL. However, this would be
                    // considered pathological input indicating a problem
                    // with the way measurements are being taken, so we
                    // prefer not to check for that possibility here.
                    const entry = entries
                        .getEntriesByType("resource")
                        .find(
                            (entry) => this._callbackBundle?.url === entry.name,
                        )
                    if (entry != undefined) {
                        this._callbackBundle.callback(entry)
                        delete this._callbackBundle
                    }
                }
            },
        )
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

    /**
     * Set the URL that the consumer is interested in and a callback to be
     * executed when it is observed.
     * @param url The precise URL of interest.
     * @param callback A callback to be executed when the registered URL
     * is observed.
     */
    registerCallback(url: string, callback: (entry: PerformanceEntry) => void) {
        if (this._callbackBundle) {
            throw new RegisteredCallbackNotConsumedError(this._callbackBundle)
        }
        this._callbackBundle = {
            url,
            callback,
            registeredAt: this._dependencies.newDate(),
        }
    }
}
