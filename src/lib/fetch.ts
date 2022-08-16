import { FetchOptions } from "../@types"
import { asyncGetEntry } from "./resourceTiming"

/**
 * Contains common fetch configuration attributes
 */
export interface FetchConfiguration {
    /**
     * Time to wait before aborting fetch, in milliseconds.
     */
    timeout: number
    /**
     * PerformanceObserver timeout in milliseconds.
     */
    performanceTimingObserverTimeout: number
}

export interface FetchTestResultBundle {
    timeoutTriggered: boolean
}

export class ResponseError extends Error {
    constructor(private _url: string, private _status: number) {
        super(`Error downloading ${_url} (HTTP status ${_status})`)
        Object.setPrototypeOf(this, new.target.prototype)
    }

    get status() {
        return this._status
    }

    get url() {
        return this._url
    }
}

interface Dependencies {
    clearTimeout: (timeoutID: number) => void
    fetch: (url: string, options?: FetchOptions) => Promise<Response>
    setTimeout: (fn: () => void, timeout: number) => number
}

// export const Fetch: Executable = {
//     execute: () => {}
// }

export type TestSetupFunc<T> = () => Promise<T>

export function fetch<T extends FetchTestResultBundle>(
    dependencies: Dependencies,
    url: string,
    fetchTimeout: number,
    requestHeaders: Record<string, string> | null,
    testSetup: TestSetupFunc<T>,
): Promise<T> {
    const result = testSetup()
        .then((testResult) =>
            fetchObject(
                dependencies,
                url,
                fetchTimeout,
                requestHeaders,
                testResult,
            ),
        )
        .then((response) => {
            console.log(`Ok: ${response.ok}`)
            console.log(`Status: ${response.status}`)
            if (!response.ok) {
                // Use structured error
                throw new ResponseError(url, response.status)
            }
        })
        .then(() => asyncGetEntry(url))
        .catch((reason) => {
            console.log(reason)
        })
    throw new Error("fetch not implemented")
}

function fetchObject<T extends FetchTestResultBundle>(
    dependencies: Dependencies,
    url: string,
    fetchTimeout: number,
    requestHeaders: Record<string, string> | null,
    testResults: T,
): Promise<Response> {
    const abortController = new AbortController()
    const timeoutID = dependencies.setTimeout(() => {
        abortController.abort()
        console.log("Fetch aborted")
        testResults.timeoutTriggered = true
    }, fetchTimeout)
    console.log(`Abort timeout ID: ${timeoutID}`)
    const options: FetchOptions = {
        method: "GET",
        // explicitly prevent request from outliving the page
        keepalive: false,
        signal: abortController.signal,
    }
    if (requestHeaders) {
        options.headers = { ...requestHeaders }
    }
    return dependencies
        .fetch(url, options)
        .then((response) => {
            console.log("Response received. Beginning blob download")
            return Promise.all([Promise.resolve(response), response.blob()])
        })
        .then(([response, _blob]) => {
            dependencies.clearTimeout(timeoutID)
            console.log("Blob received. Returning response")
            return response
        })

    // const abortController = new AbortController()
    // const timeoutID = this._fetchDependencies.setTimeout(() => {
    //     abortController.abort()
    //     console.log("Fetch aborted")
    //     this.testResults.timeoutTriggered = true
    // }, this.config.timeout)
    // let savedResponse: Response
    // console.log(`Fetching: ${this.resourceURL}`)
    // return fetch(this.resourceURL, {
    //     method: "GET",
    //     // explicitly prevent request from outliving the page
    //     keepalive: false,
    //     signal: abortController.signal,
    //     headers: { ...this.resourceRequestHeaders },
    // })
    //     .then((response) => {
    //         console.log("Response received. Beginning blob download")
    //         savedResponse = response
    //         return response.blob()
    //     })
    //     .then((_value) => {
    //         this._fetchDependencies.clearTimeout(timeoutID)
    //         console.log("Blob received. Returning response")
    //         return savedResponse
    //     })

    // // const init: RequestInit = {}
    // // if (Object.keys(this.resourceRequestHeaders).length) {
    // //     init.headers = this.resourceRequestHeaders
    // // }
    // // const request = new Request(this.resourceURL, init)
    // // const args = this.config.timeout
    // //     ? { signal: this._abortController.signal }
    // //     : {}
    // // // Initiate a timeout to let us abort the request if it takes too long
    // // const timeoutID = this._fetchDependencies.setTimeout(() => {
    // //     // this._fetchAbortedAt = new Date()
    // //     // Fetch.outputEventTimeElapsedMessage(
    // //     //     "Fetch aborted",
    // //     //     this._fetchStartedAt,
    // //     //     this._fetchAbortedAt,
    // //     // )
    // //     this._abortController.abort()
    // //     this.testResults.timeoutTriggered = true
    // // }, this.config.timeout)
    // // this._fetchStartedAt = new Date()
    // // let savedResponse: Response
    // // return fetch(request, args)
    // //     .then((resp) => {
    // //         savedResponse = resp
    // //         this._blobBeganAt = new Date()
    // //         Fetch.outputEventTimeElapsedMessage(
    // //             "Blob began",
    // //             this._fetchStartedAt,
    // //             this._blobBeganAt,
    // //         )
    // //         if (!resp.ok) {
    // //             throw new Error(
    // //                 `Network response status not okay: ${resp.status}`,
    // //             )
    // //         }
    // //         return resp.blob()
    // //     })
    // //     .then(() => {
    // //         this._fetchDependencies.clearTimeout(timeoutID)
    // //         this._blobCompletedAt = this._abortTimeoutClearedAt = new Date()
    // //         Fetch.outputEventTimeElapsedMessage(
    // //             "Abort timeout cleared",
    // //             this._fetchStartedAt,
    // //             this._abortTimeoutClearedAt,
    // //         )
    // //         Fetch.outputEventTimeElapsedMessage(
    // //             "Blob duration",
    // //             this._blobBeganAt,
    // //             this._blobCompletedAt,
    // //         )
    // //         return savedResponse
    // //     })
}

// export class Fetch<T> {
//     execute(): Promise<T> {
//         debugger
//         // return Promise.resolve({} as T)
//     }
// }

// /**
//  * Class representing a basic "fetch" test. It fetches a supplied resource from the
//  * network and collects the corresponding entry from the Performance timeline.
//  *
//  * Along with its parent class {@link Test}, the class provides a number of hooks
//  * enabling providers to control certain implementation details supporting their
//  * use case.
//  *
//  * @typeParam C The type to be used for the internal test configuration.
//  * @typeParam R The type to be used for fetch test results.
//  * @typeParam D The type to be used for the fetch beacon data.
//  * @typeParam SBR The type to be used for send beacon results.
//  */
// export abstract class Fetch<
//     C extends FetchConfiguration,
//     R extends FetchTestResultBundle,
//     D,
//     SBR,
// > extends Test {
//     /**
//      * Diagnostic timestamps to help grok issues related to the asynchronous
//      * nature of this workflow.
//      */
//     // private _fetchStartedAt?: Date
//     // private _abortTimeoutClearedAt?: Date
//     // private _errorCaughtAt?: Date
//     // private _fetchAbortedAt?: Date
//     // private _fetchCompletedAt?: Date
//     // private _blobBeganAt?: Date
//     // private _blobCompletedAt?: Date

//     constructor(
//         private _fetchDependencies: Dependencies,
//         config: C,
//         testResult: R,
//         beaconHandler?: BeaconHandler<SBR>,
//     ) {
//         super()
//         // super(config, testResult, beaconHandler)
//     }

//     /**
//      * A hook enabling providers to generate a test URL at runtime.
//      * @remarks
//      * A provider may cache the result of the first call to this method and
//      * reuse the value on subsequent calls.
//      */
//     abstract get resourceURL(): string

//     /**
//      * A hook enabling providers to update the test results object.
//      */
//     abstract updateFetchTestResults(
//         response: Response,
//         entry: PerformanceResourceTiming,
//     ): Promise<void>

//     /**
//      * TODO
//      * @param reason
//      */
//     abstract onError(reason: unknown): Promise<void>

//     /**
//      * A hook enabling providers to specify a set of zero or more
//      * HTTP request headers to be sent when peforming the fetch.
//      * This is a default implementation that returns an empty set.
//      */
//     get resourceRequestHeaders(): Record<string, string> {
//         return {}
//     }

//     /**
//      * Used by implementers to supply logic for determining if a Resource Timing
//      * entry is valid.
//      */
//     abstract makeValidateResourceTimingEntryFunc(): (
//         e: PerformanceEntry,
//     ) => boolean

//     /**
//      * See {@link Test.test}.
//      */
//     test(): Promise<void> {
//         const defaultTimeout = 5000
//         return Promise.all([
//             this.fetchObject(),
//             asyncGetEntry(
//                 this.resourceURL,
//                 this.config.performanceTimingObserverTimeout || defaultTimeout,
//                 this.makeValidateResourceTimingEntryFunc(),
//             ),
//         ])
//             .then(([response, entry]): Promise<void> => {
//                 // WARNING: If we get here, then the fetch technically completed,
//                 // although the HTTP status may indicate an error condition.
//                 // Providers should be aware of this and check `response.status`
//                 // if it matters to them.
//                 return this.updateFetchTestResults(response, entry)
//             })
//             .catch((reason) => {
//                 console.error(reason)
//                 return this.onError(reason)
//             })
//     }

//     /**
//      * Fetch the test object. This produces the network activity to be
//      * measured.
//      *
//      * @remarks
//      * The provider has an opportunity to specify zero or more HTTP request
//      * headers to be sent.
//      *
//      * There's no catch handler here. Look for errors in the catch handler
//      * found in @link{Test.execute}.
//      *
//      * Possible errors from the Fetch API under normal circumstances:
//      *
//      * * connection failure, e.g. firewall issue or misconfigured DNS.
//      *
//      *   Unfortunately by the time the browser registers this kind of problem,
//      *   the client should generally have already reported some error and
//      *   moved on. We will attempt to avoid this possibility by installing our
//      *   own timeout handler and aborting the request if we can.
//      *
//      * * CORS issues.
//      *
//      *   If the request succeeds but the response is missing the necessary
//      *   CORS headers, the request fails quickly and the Promise rejects.
//      *
//      * In general, don't base any logic on the reason given. Each user agent
//      * provides its own set of error descriptions, which presumably can change
//      * at any time.
//      */
//     fetchObject(): Promise<Response> {
//         const abortController = new AbortController()
//         const timeoutID = this._fetchDependencies.setTimeout(() => {
//             abortController.abort()
//             console.log("Fetch aborted")
//             this.testResults.timeoutTriggered = true
//         }, this.config.timeout)
//         let savedResponse: Response
//         console.log(`Fetching: ${this.resourceURL}`)
//         return fetch(this.resourceURL, {
//             method: "GET",
//             // explicitly prevent request from outliving the page
//             keepalive: false,
//             signal: abortController.signal,
//             headers: { ...this.resourceRequestHeaders },
//         })
//             .then((response) => {
//                 console.log("Response received. Beginning blob download")
//                 savedResponse = response
//                 return response.blob()
//             })
//             .then((_value) => {
//                 this._fetchDependencies.clearTimeout(timeoutID)
//                 console.log("Blob received. Returning response")
//                 return savedResponse
//             })

//         // const init: RequestInit = {}
//         // if (Object.keys(this.resourceRequestHeaders).length) {
//         //     init.headers = this.resourceRequestHeaders
//         // }
//         // const request = new Request(this.resourceURL, init)
//         // const args = this.config.timeout
//         //     ? { signal: this._abortController.signal }
//         //     : {}
//         // // Initiate a timeout to let us abort the request if it takes too long
//         // const timeoutID = this._fetchDependencies.setTimeout(() => {
//         //     // this._fetchAbortedAt = new Date()
//         //     // Fetch.outputEventTimeElapsedMessage(
//         //     //     "Fetch aborted",
//         //     //     this._fetchStartedAt,
//         //     //     this._fetchAbortedAt,
//         //     // )
//         //     this._abortController.abort()
//         //     this.testResults.timeoutTriggered = true
//         // }, this.config.timeout)
//         // this._fetchStartedAt = new Date()
//         // let savedResponse: Response
//         // return fetch(request, args)
//         //     .then((resp) => {
//         //         savedResponse = resp
//         //         this._blobBeganAt = new Date()
//         //         Fetch.outputEventTimeElapsedMessage(
//         //             "Blob began",
//         //             this._fetchStartedAt,
//         //             this._blobBeganAt,
//         //         )
//         //         if (!resp.ok) {
//         //             throw new Error(
//         //                 `Network response status not okay: ${resp.status}`,
//         //             )
//         //         }
//         //         return resp.blob()
//         //     })
//         //     .then(() => {
//         //         this._fetchDependencies.clearTimeout(timeoutID)
//         //         this._blobCompletedAt = this._abortTimeoutClearedAt = new Date()
//         //         Fetch.outputEventTimeElapsedMessage(
//         //             "Abort timeout cleared",
//         //             this._fetchStartedAt,
//         //             this._abortTimeoutClearedAt,
//         //         )
//         //         Fetch.outputEventTimeElapsedMessage(
//         //             "Blob duration",
//         //             this._blobBeganAt,
//         //             this._blobCompletedAt,
//         //         )
//         //         return savedResponse
//         //     })
//     }
// }
