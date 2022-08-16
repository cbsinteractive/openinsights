export class PerformanceTimingObserverTimeoutError extends Error {
    constructor(name: string, timeout: number) {
        super(
            `Timeout waiting for timing data to appear for ${name} (timeout: ${timeout})`,
        )
        Object.setPrototypeOf(this, new.target.prototype)
    }
}

export class NoValidEntryError extends Error {
    constructor(name: string, private _entries: PerformanceEntryList) {
        super(
            `At least one Resource Timing entry was found for ${name} but none passed validation`,
        )
        Object.setPrototypeOf(this, new.target.prototype)
    }

    get entries() {
        return this._entries
    }
}

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

// /**
//  * Given a list of Resource Timing entries, return the first one that matches
//  * a set of rules.
//  * @remarks
//  * Providers may override the default rules.
//  * See {@link Fetch.constructor}.
//  * @param list The list of entries to test.
//  * @param isValidEntryFunc A predicate function used to determine the validity
//  * of Resource Timing entries.
//  */
// function getValidEntry(
//     list: PerformanceEntryList,
//     isValidEntryFunc: ResourceTimingEntryValidationPredicate,
// ): PerformanceEntry | undefined {
//     let k = 0
//     while (k < list.length) {
//         const e = list[k]
//         if (isValidEntryFunc(e)) {
//             return e
//         }
//         k++
//     }
// }

// /**
//  * Asyncronusly gets a Resource Timing entry from the performance timeline
//  * by its name (url).
//  * @remarks
//  * It starts a PerformanceObserver to observe the timeline for the entry and
//  * resolves with the entry when found. If the timeout is reached before an
//  * entry is returned, the Promise is rejected.
//  * @param name URL of the of the entry
//  * @param timeout Time to wait (in milliseconds) for the observer to find the
//  * Resource Timing entry.
//  * @param isValidEntryFunc Boolean function used to determine validity of
//  * Resource Timing entry.
//  */
// export function asyncGetEntry(
//     _name: string,
//     _timeout: number,
//     _isValidEntryFunc: ResourceTimingEntryValidationPredicate,
// ): Promise<PerformanceResourceTiming> {
//     throw new Error("asyncGetEntry not implemented")
// }

export class Manager {
    private static _instance: Manager
    private _observer
    private constructor(
        newPerformanceObserver: (
            callback: PerformanceObserverCallback,
        ) => PerformanceObserver,
    ) {
        this._observer = newPerformanceObserver((entries) => {
            entries.getEntriesByType("resource").forEach((entry) => {
                console.log(entry)
            })
        })
        this._observer.observe({
            type: "resource",
            // Disregard entries buffered before the observer was created
            buffered: false,
        })
    }

    static init(
        newPerformanceObserver: (
            callback: PerformanceObserverCallback,
        ) => PerformanceObserver,
    ) {
        if (Manager._instance) {
            throw new PerformanceEntryManagerInitializedMultipleTimes()
        }
        Manager._instance = new Manager(newPerformanceObserver)
    }

    static getInstance() {
        if (!Manager._instance) {
            throw new PerformanceEntryManagerNotInitialized()
        }
        return Manager._instance
    }
}

export function asyncGetEntry(url: string): Promise<PerformanceResourceTiming> {
    console.log(`Hunting down ${url}`)
    console.log(Manager.getInstance())
    throw new Error("asyncGetEntry not implemented")
}
