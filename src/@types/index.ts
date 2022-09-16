/**
 * An alias for a boolean-returning function that evaluates whether a Resource
 * Timing entry is valid. Used by
 * {@link getValidEntry} to assess validity of an
 * entry. Providers may override the default predicate.
 */
export type ResourceTimingEntryValidationPredicate = (
    entry: PerformanceEntry,
) => boolean

/**
 * Encapsulates the result of one provider's RUM session.
 */
export interface SessionResult {
    /**
     * An optional Error object describing a problem that occurred during
     * session initialization.
     */
    initError?: Error
    /**
     * An array containing the test result bundles for each individual test
     * performed.
     */
    testResults: unknown[]
}

/**
 * See W3C Spec Draft http://wicg.github.io/netinfo/
 * Edition: Draft Community Group Report 20 February 2019
 * See http://wicg.github.io/netinfo/#navigatornetworkinformation-interface
 */
export type Navigator = NavigatorNetworkInformation

/**
 * See http://wicg.github.io/netinfo/#navigatornetworkinformation-interface
 */
declare interface NavigatorNetworkInformation {
    readonly connection?: NetworkInformation
}

/**
 * See http://wicg.github.io/netinfo/#connection-types
 */
type NetworkConnectionType =
    | "bluetooth"
    | "cellular"
    | "ethernet"
    | "mixed"
    | "none"
    | "other"
    | "unknown"
    | "wifi"
    | "wimax"

/**
 * See http://wicg.github.io/netinfo/#effectiveconnectiontype-enum
 */
type EffectiveConnectionType = "2g" | "3g" | "4g" | "slow-2g"

/**
 * See http://wicg.github.io/netinfo/#dom-megabit
 */
type Megabit = number

/**
 * See http://wicg.github.io/netinfo/#dom-millisecond
 */
type Millisecond = number

/**
 * The primative type attributes from the navigator.connection object,
 * if present.
 * @remarks
 * See https://developer.mozilla.org/en-US/docs/Web/API/Navigator/connection
 */
export interface NetworkInformation {
    [key: string]:
        | NetworkConnectionType
        | EffectiveConnectionType
        | Megabit
        | Millisecond
        | boolean
}

/**
 * An interface representing an object with an execute method, generally a
 * {@link Test}.
 */
export interface Executable {
    /**
     * Execute a test and return a Promise that resolves to a provider-defined
     * test result object.
     */
    execute(): Promise<unknown>
}

export type ProduceExecutablesFunc = (
    sessionConfiguration: unknown,
) => Executable[]
export type FetchSessionConfigurationFunc = () => Promise<unknown>
export type SessionStartupFuncs = {
    fetchSessionConfiguration: FetchSessionConfigurationFunc
    produceExecutables: ProduceExecutablesFunc
}

/**
 * A function that takes an array of {@link Executable} test objects and returns
 * a Promise<{@link SessionResult}>.
 *
 * @remarks
 * In general, the list of {@link Executable} test objects passed into this
 * function would be the result of previous calls to
 * {@link Provider.fetchSessionConfig} and @link Provider.expandTasks} for each
 * provider used by the client.
 *
 * The tag owner may override the default sequencing function in order to
 * control the order in which tests run.
 *
 * @param executables List of {@link Executable} tests for which to run and
 * generate a list of Promise<{@link SessionResult}> objects.
 */
export type SessionProcessFunc = (
    executables: Executable[],
) => Promise<SessionResult>
