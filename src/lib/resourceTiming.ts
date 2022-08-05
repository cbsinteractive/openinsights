import { ResourceTimingEntryValidationPredicate } from "../@types"

interface Dependencies {
    clearTimeout: (timeoutID: number) => void
    makePerformanceObserver: (
        callback: PerformanceObserverCallback,
    ) => PerformanceObserver
    makePromise: (executor: Function) => Promise<any>
    setTimeout: (fn: TimerHandler, timeout: number) => number
}

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

/**
 * Given a list of Resource Timing entries, return the first one that matches
 * a set of rules.
 * @remarks
 * Providers may override the default rules.
 * See {@link Fetch.constructor}.
 * @param list The list of entries to test.
 * @param isValidEntryFunc A predicate function used to determine the validity
 * of Resource Timing entries.
 */
function getValidEntry(
    list: PerformanceEntryList,
    isValidEntryFunc: ResourceTimingEntryValidationPredicate,
): PerformanceResourceTiming | undefined {
    let k = 0
    while (k < list.length) {
        const e = list[k]
        if (isValidEntryFunc(e)) {
            return e as PerformanceResourceTiming
        }
        k++
    }
    return undefined
}

/**
 * Asyncronusly gets a Resource Timing entry from the performance timeline
 * by its name (url).
 * @remarks
 * It starts a PerformanceObserver to observe the timeline for the entry and
 * resolves with the entry when found. If the timeout is reached before an
 * entry is returned, the Promise is rejected.
 * @param name URL of the of the entry
 * @param timeout Time to wait (in milliseconds) for the observer to find the
 * Resource Timing entry.
 * @param isValidEntryFunc Boolean function used to determine validity of
 * Resource Timing entry.
 */
export function asyncGetEntry(
    deps: Dependencies,
    name: string,
    timeout: number,
    isValidEntryFunc: ResourceTimingEntryValidationPredicate,
): Promise<PerformanceResourceTiming> {
    return deps.makePromise(
        (
            resolve: (entry: PerformanceResourceTiming) => void,
            reject: (e: unknown) => void,
        ): void => {
            let entry: PerformanceResourceTiming | undefined
            const observer = deps.makePerformanceObserver(
                (
                    list: PerformanceObserverEntryList,
                    observer: PerformanceObserver,
                ) => {
                    if (!entry) {
                        const filteredEntries = list.getEntriesByName(name)
                        if (filteredEntries.length) {
                            deps.clearTimeout(timeoutId)
                            observer.disconnect()
                            entry = getValidEntry(
                                filteredEntries,
                                isValidEntryFunc,
                            )
                            entry
                                ? resolve(entry)
                                : reject(
                                      new NoValidEntryError(
                                          name,
                                          filteredEntries,
                                      ),
                                  )
                        }
                    }
                },
            )
            const timeoutId = deps.setTimeout(() => {
                if (!entry) {
                    observer.disconnect()
                    reject(
                        new PerformanceTimingObserverTimeoutError(
                            name,
                            timeout,
                        ),
                    )
                }
            }, timeout)
            try {
                observer.observe({
                    type: "resource",
                    // Allows the observer access to entries buffered before it was created
                    buffered: true,
                })
            } catch (e) {
                reject(e)
            }
        },
    )
}
