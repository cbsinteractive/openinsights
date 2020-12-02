/**
 * An interface representing simple objects mapping strings to basic primative
 * types.
 */
export interface SimpleObject {
    [key: string]:
        | SimpleObject
        | SimpleObject[]
        | Array<string | number | boolean | null>
        | boolean
        | number
        | string
        | null
        | undefined
}

/**
 * An interface representing the result of a test's setup activity.
 */
export interface TestSetupResult {
    /**
     * A container for the test setup data
     */
    data?: unknown
}

/**
 * A type representing a Resource Timing API entry having _entryType_
 * "resource".
 *
 * Alias for {@link SimpleObject}
 */
export type ResourceTimingEntry = SimpleObject

/**
 * An alias for a boolean-returning function that evaluates whether a Resource
 * Timing entry is valid. Used by
 * {@link getValidEntry} to assess validity of an
 * entry. Providers may override the default predicate.
 */
export type ResourceTimingEntryValidationPredicate = (
    entry: ResourceTimingEntry,
) => boolean

/**
 * Represents the return value of a "client info request".
 * @remarks
 * This type of request is typically made in order to capture the client
 * resolver geo. See {@link getClientInfo}.
 */
export type ClientInfo = SimpleObject

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

/* eslint-disable @typescript-eslint/no-empty-interface */
/**
 * See W3C Spec Draft http://wicg.github.io/netinfo/
 * Edition: Draft Community Group Report 20 February 2019
 * See http://wicg.github.io/netinfo/#navigatornetworkinformation-interface
 */
export declare interface Navigator extends NavigatorNetworkInformation {}

/**
 * See W3C Spec Draft http://wicg.github.io/netinfo/
 * Edition: Draft Community Group Report 20 February 2019
 * See http://wicg.github.io/netinfo/#navigatornetworkinformation-interface
 */
declare interface WorkerNavigator extends NavigatorNetworkInformation {}
/* eslint-enable @typescript-eslint/no-empty-interface */

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

/**
 * An interface representing a provider.
 */
export interface Provider {
    /**
     * An attribute that can be used for logging purposes.
     */
    name: string

    /**
     * The provider specfic session configuration object obtained from calling
     * {@link Provider.fetchSessionConfig}.
     */
    sessionConfig?: unknown

    /**
     * Called within {@link start} to sets the provider's session configuration
     * object after calling {@link ProviderBase.fetchSessionConfig}.
     * @param value The provider-defined configuration object resulting from a
     * call to {@link Provider.fetchSessionConfig}
     */
    setSessionConfig(value: unknown): void

    /**
     * A hook called very early by the core module, enabling providers an
     * opportunity to determine if they should participate in the session,
     * e.g. based on user agent feature detection, random downsampling, etc.
     */
    shouldRun(): boolean

    /**
     * @remarks
     * A provider implements this in order to define its logic for producing
     * its specfic session configuration object at runtime.
     */
    fetchSessionConfig(): Promise<unknown>

    /**
     * A provider implements this in order to define its logic for converting
     * its session configuration object into one or more {@link Executable}
     * objects (usually {@link Fetch} or other classes inheriting from
     * {@link Test}).
     */
    expandTasks(): Executable[]
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

/**
 * Used by the tag owner to pass settings to the client at runtime. In general,
 * these settings affect core module behavior at the page level. For example,
 * the site might pass different settings to the client on one page than it
 * does on another.
 */
export interface ClientSettings {
    /**
     * The approximate delay (in milliseconds) after {@link init} is called
     * before the RUM session should begin.
     */
    preConfigStartDelay?: number
    /**
     * An array of objects implementing {@link Provider}. When {@link init} is
     * called, these providers will participate in the RUM session.
     */
    providers: Provider[]
    /**
     * At runtime, this function takes the list of {@link Executable}
     * objects supplied by providers participating in the RUM session
     * and executes any tests they contain.
     *
     * @remarks
     * Defaults to {@link defaultSequenceFunc}
     */
    sessionProcess?: SessionProcessFunc
}
