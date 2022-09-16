export class RegisteredCallbackNotConsumedError extends Error {
    constructor(urlBeingAdded: string, urlStillRegistered: string) {
        super(
            `Callback not consumed (being added: ${urlBeingAdded}, still registered: ${urlStillRegistered})`,
        )
        Object.setPrototypeOf(this, new.target.prototype)
    }
}

export class PerformanceEntryAwaitTimeout extends Error {
    constructor(url: string, duration: number, maxWait: number) {
        super(
            `Failed to find an entry for ${url} after ${duration} milliseconds (max wait ${maxWait})`,
        )
        Object.setPrototypeOf(this, new.target.prototype)
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
            (entryList) => {
                console.log("PerformanceObserver callback invoked")
                if (this._callbackBundle != undefined) {
                    // Note that getEntriesBy... *can* produce multiple
                    // records for the same URL. However, this would be
                    // considered pathological input indicating a problem
                    // with the way measurements are being taken. Therefore,
                    // we tend to overlook that possibility.
                    const entries = entryList.getEntriesByName(
                        this._callbackBundle.url,
                        "resource",
                    )
                    if (entries.length) {
                        // We could validate the entry `name` property, but
                        // we're counting on getEntriesByName to do the right
                        // thing
                        this._callbackBundle.callback(entries[0])
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
                url,
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
        private _newDate: () => Date,
        private _setTimeout: (fn: () => void, timeout: number) => number,
        performanceEntryManager: PerformanceEntryManager,
    ) {
        console.log("Registering performance entry manager callback")
        performanceEntryManager.registerCallback(_url, (entry) => {
            this._entry = entry
        })
    }

    async awaitEntry() {
        if (this._entry) {
            return this._entry
        }
        const beganAt = this._newDate().getTime()
        let entry: PerformanceEntry | undefined
        const MAX_WAIT = 2000
        let diff = MAX_WAIT
        do {
            const result = await Promise.all([
                new Promise((resolve: (entry?: PerformanceEntry) => void) => {
                    resolve(this._entry)
                }),
                new Promise((resolve) => {
                    console.log(
                        "Prod: setting timeout waiting for performance entry callback to be invoked",
                    )
                    this._setTimeout(resolve as () => void, 100)
                }),
            ])
            if (result[0]) {
                entry = result[0]
                break
            }
            const newDate = this._newDate()
            diff = newDate.getTime() - beganAt
        } while (!entry && diff < MAX_WAIT)
        if (entry) {
            return entry
        }
        throw new PerformanceEntryAwaitTimeout(this._url, diff, MAX_WAIT)
    }
}
