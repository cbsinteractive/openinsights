/**
 * Open Insights is a library for building browser-based RUM clients.
 *
 * @packageDocumentation
 */

export type { Executable, SessionResult, SessionStartupFuncs } from "./@types"
export { init } from "./init"
export { defaultSessionProcessFunc } from "./lib/defaultSessionProcessFunc"
export { fetch } from "./lib/fetch"
export type {
    Dependencies as FetchDependencies,
    FetchTestResult,
} from "./lib/fetch"
export {
    createPerformanceEntryManager,
    PerformanceEntryAwaitTimeout,
    RegisteredCallbackNotConsumedError,
} from "./lib/resourceTiming"
export type { PerformanceEntryManager } from "./lib/resourceTiming"
