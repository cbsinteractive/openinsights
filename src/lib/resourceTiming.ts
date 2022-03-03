import { ResourceTimingEntryValidationPredicate } from "../@types"

export class PerformanceTimingObserverTimeoutError extends Error {
    constructor(name: string, timeout: number) {
        super(
            `Timeout waiting for timing data to appear for ${name} (timeout: ${timeout})`,
        )
    }
}

export class NoValidEntryError extends Error {
    constructor(name: string) {
        super(
            `At least one Resource Timing entry was found for ${name} but none passed validation`,
        )
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
    window: Window & typeof globalThis,
    list: PerformanceEntryList,
    isValidEntryFunc: ResourceTimingEntryValidationPredicate,
): PerformanceResourceTiming | undefined {
    let k = 0
    while (k < list.length) {
        const e = list[k]
        if (
            e instanceof window.PerformanceResourceTiming &&
            isValidEntryFunc(e)
        ) {
            return e
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
    window: Window & typeof globalThis,
    name: string,
    timeout: number,
    isValidEntryFunc: ResourceTimingEntryValidationPredicate,
): Promise<PerformanceResourceTiming> {
    return new window.Promise((resolve, reject): void => {
        let entry: PerformanceResourceTiming | undefined
        const observer = new window.PerformanceObserver(
            (
                list: PerformanceObserverEntryList,
                observer: PerformanceObserver,
            ) => {
                const namedEntries = list.getEntriesByName(name)
                if (namedEntries.length) {
                    window.clearTimeout(timeoutId)
                    console.log(`Timeout cleared (${timeoutId})`)
                    observer.disconnect()
                    console.log("Observer disconnected")
                    entry = getValidEntry(
                        window,
                        namedEntries,
                        isValidEntryFunc,
                    )
                    if (entry) {
                        resolve(entry)
                    } else {
                        reject(new NoValidEntryError(name))
                    }
                }
            },
        )
        const timeoutId = window.setTimeout(() => {
            console.log("Observer timeout reached")
            console.log(entry)
            if (!entry) {
                observer.disconnect()
                reject(new PerformanceTimingObserverTimeoutError(name, timeout))
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
    })
}
