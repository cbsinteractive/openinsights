import { ResourceTimingEntry } from "../@types"
import { BeaconHandler } from "../util/beaconHandler"
import { asyncGetEntry } from "./resourceTiming"
import { Test, TestConfiguration } from "./test"

/**
 * Contains common fetch configuration attributes
 */
export interface FetchConfiguration extends TestConfiguration {
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

/**
 * Class representing a basic "fetch" test. It fetches a supplied resource from the
 * network and collects the corresponding ResourceTimingEntry from the
 * Performance timeline.
 *
 * Along with its parent class {@link Test}, the class provides a number of hooks
 * enabling providers to control certain implementation details supporting their
 * use case.
 *
 * @typeParam C The type to be used for the internal test configuration.
 * @typeParam D The type to be used for fetch test results.
 * @typeParam SBR The type to be used for send beacon results.
 * @typeParam D The type to be used for the fetch beacon data.
 */
export abstract class Fetch<
    C extends FetchConfiguration,
    R extends FetchTestResultBundle,
    D,
    SBR
> extends Test<C, R, D, SBR> {
    /**
     * An AbortController instance used to abort fetch requests that do not
     * complete in a timely manner.
     */
    private _abortController: AbortController = new AbortController()

    constructor(config: C, testResult: R, beaconHandler: BeaconHandler<SBR>) {
        super(config, testResult, beaconHandler)
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
        entry: ResourceTimingEntry,
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
    makeValidateResourceTimingEntryFunc(): (e: ResourceTimingEntry) => boolean {
        return (e) => e.requestStart !== 0 && e.connectStart !== e.connectEnd
    }

    /**
     * See {@link Test.test}.
     */
    test(): Promise<void> {
        const defaultTimeout = 5000
        return Promise.all<Response, ResourceTimingEntry>([
            this.fetchObject(),
            asyncGetEntry(
                this.resourceURL,
                this.config.performanceTimingObserverTimeout || defaultTimeout,
                this.makeValidateResourceTimingEntryFunc(),
            ),
        ])
            .then(
                ([response, entry]): Promise<void> => {
                    // WARNING: If we get here, then the fetch technically completed,
                    // although the HTTP status may indicate an error condition.
                    // Providers should be aware of this and check `response.status`
                    // if it matters to them.
                    return this.updateFetchTestResults(response, entry)
                },
            )
            .catch((reason) => {
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
                window.setTimeout(() => {
                    this._abortController.abort()
                    this.testResults.timeoutTriggered = true
                }, this.config.timeout),
            )
        }
        return fetch(request, args).finally(() => {
            this.clearTimeout()
        })
    }
}
