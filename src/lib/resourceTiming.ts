export class RegisteredCallbackNotConsumedError extends Error {
    constructor(private _url: string) {
        super(`The callback for ${_url} was not consumed`)
        Object.setPrototypeOf(this, new.target.prototype)
    }

    get url() {
        return this._url
    }
}

export class PerformanceEntryAwaitTimeout extends Error {
    constructor(private _url: string, private _duration: number) {
        super(
            `Failed to find an entry for ${_url} after ${_duration} milliseconds`,
        )
        Object.setPrototypeOf(this, new.target.prototype)
    }

    get url() {
        return this._url
    }
    get duration() {
        return this._duration
    }
}

type RegisteredCallbackBundle = {
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
        console.warn("Clearing Resource Timing buffer")
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
        console.log(`Registering callback for ${url}`)
        if (this._callbackBundle) {
            throw new RegisteredCallbackNotConsumedError(
                this._callbackBundle.url,
            )
        }
        this._callbackBundle = {
            url,
            callback,
            registeredAt: this._dependencies.newDate(),
        }
    }

    /**
     * Clear the registered callback if it matches the given URL.
     * @param url
     */
    unregisterCallback(url: string) {
        if (this._callbackBundle && this._callbackBundle.url === url) {
            delete this._callbackBundle
            console.log(`Unregistered callback for ${url}`)
        }
    }
}

/**
 * A class to manage waiting for a certain `PerformanceEntry` to appear in the
 * Resource Timing buffer.
 *
 * Please note that observation begins in the constructor. Create an
 * `EntryAwaiter` *before* you expect the item to appear in the buffer.
 */
export class EntryAwaiter {
    private _entry?: PerformanceEntry
    constructor(
        private _url: string,
        private _performanceEntryManager: PerformanceEntryManager,
        private _maxWait: number,
        private _newDate: () => Date,
        private _setTimeout: (fn: () => void, timeout: number) => number,
    ) {
        _performanceEntryManager.registerCallback(
            _url,
            (entry) => (this._entry = entry),
        )
    }

    async awaitEntry() {
        if (this._entry) {
            return this._entry
        }
        const beganAt = this._newDate().getTime()
        let diff: number
        let entry: PerformanceEntry | undefined
        do {
            const result = await Promise.all([
                new Promise((resolve: (entry?: PerformanceEntry) => void) => {
                    resolve(this._entry)
                }),
                new Promise((resolve) =>
                    this._setTimeout(resolve as () => void, 100),
                ),
            ])
            if (result[0]) {
                entry = result[0]
            }
            diff = this._newDate().getTime() - beganAt
        } while (!entry && diff < this._maxWait)
        this._performanceEntryManager.unregisterCallback(this._url)
        if (entry) {
            return entry
        }
        throw new PerformanceEntryAwaitTimeout(this._url, diff)
    }
}
