import { BeaconHandler } from "../util/beaconHandler"
import { WindowUndefinedError } from "./errors"
import { asyncGetEntry } from "./resourceTiming"
import { Test } from "./test"

/**
 * Contains common fetch configuration attributes
 */
export interface FetchConfiguration {
    /**
     * Time to wait before aborting fetch, in milliseconds.
     */
    timeout?: number
    /**
     * PerformanceObserver timeout in milliseconds.
     */
    performanceTimingObserverTimeout?: number
}

export interface FetchTestResultBundle {
    timeoutTriggered?: boolean
}

export interface Dependencies {
    window: (Window & typeof globalThis) | undefined
    clearTimeout: (timeoutID: number) => void
    setTimeout: (fn: TimerHandler, timeout: number) => number
    Promise: PromiseConstructor
}

/**
 * Class representing a basic "fetch" test. It fetches a supplied resource from the
 * network and collects the corresponding entry from the Performance timeline.
 *
 * Along with its parent class {@link Test}, the class provides a number of hooks
 * enabling providers to control certain implementation details supporting their
 * use case.
 *
 * @typeParam C The type to be used for the internal test configuration.
 * @typeParam R The type to be used for fetch test results.
 * @typeParam D The type to be used for the fetch beacon data.
 * @typeParam SBR The type to be used for send beacon results.
 */
export abstract class Fetch<
    C extends FetchConfiguration,
    R extends FetchTestResultBundle,
    D,
    SBR,
> extends Test<C, R, D, SBR> {
    /**
     * An AbortController instance used to abort fetch requests that do not
     * complete in a timely manner.
     */
    private _abortController: AbortController = new AbortController()

    /**
     * Diagnostic timestamps to help grok issues related to the asynchronous
     * nature of this workflow.
     */
    private _fetchStartedAt?: Date
    private _abortTimeoutClearedAt?: Date
    private _errorCaughtAt?: Date
    private _fetchAbortedAt?: Date
    private _fetchCompletedAt?: Date
    private _blobBeganAt?: Date
    private _blobCompletedAt?: Date

    constructor(
        private _fetchDependencies: Dependencies,
        config: C,
        testResult: R,
        beaconHandler?: BeaconHandler<SBR>,
    ) {
        super(
            {
                clearTimeout: _fetchDependencies.clearTimeout,
            },
            config,
            testResult,
            beaconHandler,
        )
    }

    /**
     * A hook enabling providers to generate a test URL at runtime.
     * @remarks
     * A provider may cache the result of the first call to this method and
     * reuse the value on subsequent calls.
     */
    abstract get resourceURL(): string

    /**
     * A hook enabling providers to update the test results object.
     */
    abstract updateFetchTestResults(
        response: Response,
        entry: PerformanceResourceTiming,
    ): Promise<void>

    /**
     * TODO
     * @param reason
     */
    abstract onError(reason: unknown): Promise<void>

    /**
     * A hook enabling providers to specify a set of zero or more
     * HTTP request headers to be sent when peforming the fetch.
     * This is a default implementation that returns an empty set.
     */
    get resourceRequestHeaders(): Record<string, string> {
        return {}
    }

    /**
     * A provider may override the default logic used to determine a valid
     * Resource Timing entry using the optional isValidEntryFunc argument.
     */
    makeValidateResourceTimingEntryFunc(): (e: unknown) => boolean {
        interface LimitedResourceTimingEntry {
            requestStart: number
            connectStart: number
            connectEnd: number
        }

        function isPerformanceResourceTiming(
            u: unknown,
        ): u is LimitedResourceTimingEntry {
            return (
                typeof u === "object" &&
                u !== null &&
                "requestStart" in u &&
                "connectStart" in u &&
                "connectEnd" in u
            )
        }
        // By default, we require that the connection not be reused, presumably
        // to support use cases measuring connection setup time
        return (e) =>
            isPerformanceResourceTiming(e)
                ? e.requestStart !== 0 && e.connectStart !== e.connectEnd
                : false
    }

    /**
     * See {@link Test.test}.
     */
    test(): Promise<void> {
        const defaultTimeout = 5000
        if (!this._fetchDependencies.window) {
            return this.onError(new WindowUndefinedError("Fetch.test"))
        }
        return Promise.all([
            this.fetchObject(),
            asyncGetEntry(
                this._fetchDependencies.window,
                {
                    clearTimeout: this._fetchDependencies.clearTimeout,
                    setTimeout: this._fetchDependencies.setTimeout,
                    Promise: this._fetchDependencies.Promise,
                },
                this.resourceURL,
                this.config.performanceTimingObserverTimeout || defaultTimeout,
                this.makeValidateResourceTimingEntryFunc(),
            ),
        ])
            .then(([response, entry]): Promise<void> => {
                // WARNING: If we get here, then the fetch technically completed,
                // although the HTTP status may indicate an error condition.
                // Providers should be aware of this and check `response.status`
                // if it matters to them.
                this._fetchCompletedAt = new Date()
                Fetch.outputEventTimeElapsedMessage(
                    "Fetch completed",
                    this._fetchStartedAt,
                    this._fetchCompletedAt,
                )
                return this.updateFetchTestResults(response, entry)
            })
            .catch((reason) => {
                this._errorCaughtAt = new Date()
                Fetch.outputEventTimeElapsedMessage(
                    "Error caught",
                    this._fetchStartedAt,
                    this._errorCaughtAt,
                    reason,
                )
                return this.onError(reason)
            })
    }

    /**
     * Fetch the test object. This produces the network activity to be
     * measured.
     *
     * @remarks
     * The provider has an opportunity to specify zero or more HTTP request
     * headers to be sent.
     *
     * There's no catch handler here. Look for errors in the catch handler
     * found in @link{Test.execute}.
     *
     * Possible errors from the Fetch API under normal circumstances:
     *
     * * connection failure, e.g. firewall issue or misconfigured DNS.
     *
     *   Unfortunately by the time the browser registers this kind of problem,
     *   the client should generally have already reported some error and
     *   moved on. We will attempt to avoid this possibility by installing our
     *   own timeout handler and aborting the request if we can.
     *
     * * CORS issues.
     *
     *   If the request succeeds but the response is missing the necessary
     *   CORS headers, the request fails quickly and the Promise rejects.
     *
     * In general, don't base any logic on the reason given. Each user agent
     * provides its own set of error descriptions, which presumably can change
     * at any time.
     */
    fetchObject(): Promise<Response> {
        const init: RequestInit = {}
        if (Object.keys(this.resourceRequestHeaders).length) {
            init.headers = this.resourceRequestHeaders
        }
        const request = new Request(this.resourceURL, init)
        const args = this.config.timeout
            ? { signal: this._abortController.signal }
            : {}
        // Initiate a timeout to let us abort the request if it takes too long
        if (this.config.timeout) {
            this.setTimeoutId(
                this._fetchDependencies.setTimeout(() => {
                    console.log("Inside fetch timeout handler")
                    this._fetchAbortedAt = new Date()
                    Fetch.outputEventTimeElapsedMessage(
                        "Fetch aborted",
                        this._fetchStartedAt,
                        this._fetchAbortedAt,
                    )
                    this._abortController.abort()
                    this.testResults.timeoutTriggered = true
                }, this.config.timeout),
            )
        }
        this._fetchStartedAt = new Date()
        let savedResponse: Response
        return fetch(request, args)
            .then((resp) => {
                savedResponse = resp
                this._blobBeganAt = new Date()
                Fetch.outputEventTimeElapsedMessage(
                    "Blob began",
                    this._fetchStartedAt,
                    this._blobBeganAt,
                )
                if (!resp.ok) {
                    throw new Error(
                        `Network response status not okay: ${resp.status}`,
                    )
                }
                return resp.blob()
            })
            .then(() => {
                this.clearTimeout()
                this._blobCompletedAt = this._abortTimeoutClearedAt = new Date()
                Fetch.outputEventTimeElapsedMessage(
                    "Abort timeout cleared",
                    this._fetchStartedAt,
                    this._abortTimeoutClearedAt,
                )
                Fetch.outputEventTimeElapsedMessage(
                    "Blob duration",
                    this._blobBeganAt,
                    this._blobCompletedAt,
                )
                return savedResponse
            })
    }

    static outputEventTimeElapsedMessage(
        intervalName: string,
        startedAt?: Date,
        endedAt?: Date,
        addendum?: string,
    ): void {
        if (addendum) {
            addendum = `; ${addendum}`
        } else {
            addendum = ""
        }
        if (!startedAt) {
            // console.log("Start timestamp not provided")
            return
        }
        if (!endedAt) {
            // console.log("End timestamp not provided")
            return
        }
        // const diffInMs = endedAt.getTime() - startedAt.getTime()
        // console.log(`${intervalName} after ${diffInMs} ms${addendum}`)
    }
}
