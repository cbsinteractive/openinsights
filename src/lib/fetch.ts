import {
    Provider,
    ResourceTimingEntry,
    ResourceTimingEntryValidationPredicate,
    TestResultBundle,
    TestSetupResult,
} from "../@types"
import { asyncGetEntry } from "./resourceTiming"
import { Test } from "./test"

export interface FetchConfiguration {
    /**
     * Indicates the test type.
     */
    type: string
    /**
     * Time to wait before aborting fetch, in milliseconds.
     */
    timeout?: number
    /**
     * PerformanceObserver timeout in milliseconds.
     */
    performanceTimingObserverTimeout?: number
}

/**
 * The default function used to validate Resource Timing entries.
 * @param e The entry to validate.
 */
const defaultIsValidEntryFunc: ResourceTimingEntryValidationPredicate = (e) =>
    e.requestStart !== 0 && e.connectStart !== e.connectEnd

/**
 * Class representing a basic "fetch" test. It fetches a supplied resource from the
 * network and collects the corresponding ResourceTimingEntry from the
 * Performance timeline.
 *
 * Along with its parent class {@link Test}, the class provides a number of hooks
 * enabling providers to control certain implementation details supporting their
 * use case.
 *
 * @typeParam TC The type to be used for the internal test configuration.
 */
export default class Fetch<TC extends FetchConfiguration> extends Test<TC> {
    /**
     * The predicate function used to determine the validity of a Resource
     * Timing entry.
     */
    private _isValidEntryFunc: ResourceTimingEntryValidationPredicate = defaultIsValidEntryFunc

    /**
     * An AbortController instance used to abort fetch requests that do not
     * complete in a timely manner.
     */
    private _abortController: AbortController = new AbortController()

    /**
     * @remarks
     * A provider may override the default logic used to determine a valid
     * Resource Timing entry using the optional isValidEntryFunc argument.
     * @param provider The provider that owns the test.
     * @param config The test configuration.
     * @param validEntryFunc An optional provider-defined function used to
     * validate Resource Timing entries.
     */
    constructor(
        provider: Provider,
        config: TC,
        validEntryFunc?: ResourceTimingEntryValidationPredicate,
    ) {
        super(provider, config)
        if (validEntryFunc) {
            this._isValidEntryFunc = validEntryFunc
        }
    }

    /**
     * Fetch test implementation
     * @param setupResult Result of the previous {@link Provider.testSetUp} call
     * @returns A Promise resolving to a {@link ResultBundle} object, the
     * result of calling {@link Provider.createFetchTestResult} when the test
     * data has been obtained.
     */
    test(setupResult: TestSetupResult): Promise<TestResultBundle> {
        const defaultTimeout = 5000
        return Promise.all<Response, ResourceTimingEntry>([
            this.fetchObject(),
            asyncGetEntry(
                this.getResourceUrl(),
                this._config.performanceTimingObserverTimeout || defaultTimeout,
                this._isValidEntryFunc,
            ),
        ]).then(
            ([response, entry]): Promise<TestResultBundle> => {
                // This is the earliest opportunity to check the HTTP status
                if (
                    !this._provider.validateResponseStatus(
                        this._config,
                        response.status,
                    )
                ) {
                    return Promise.reject(
                        `Fetch response status code: ${response.status}`,
                    )
                }
                return this._provider.createFetchTestResult(
                    entry,
                    response,
                    this._config,
                    setupResult,
                )
            },
        )
    }

    /**
     * Calls {@link Provider.getResourceUrl} to generate the URL to be fetched.
     */
    getResourceUrl(): string {
        return this._provider.getResourceUrl(this._config)
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
        const requestHeaders = this._provider.getResourceRequestHeaders(
            this._config,
        )
        if (Object.keys(requestHeaders).length) {
            init.headers = requestHeaders
        }
        const request = new Request(this.getResourceUrl(), init)
        const args = this._config.timeout
            ? { signal: this._abortController.signal }
            : {}
        const result = fetch(request, args).finally(() => {
            this.clearTimeout()
        })
        // Initiate a timeout to let us abort the request if it takes too long
        if (this._config.timeout) {
            this.setTimeoutId(
                window.setTimeout(() => {
                    this._abortController.abort()
                }, this._config.timeout),
            )
        }
        return result
    }
}
