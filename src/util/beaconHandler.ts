/**
 * A module-level variable caching the result of `sendBeacon` feature
 * detection.
 */
const hasBeaconSupport = "sendBeacon" in navigator

/**
 * @typeParam R The type used for the send result.
 */
export abstract class BeaconHandler<R> {
    /**
     * Sends beacon data.
     * @remarks Uses the Beacon API if available. Otherwise, sends a POST
     * message using the Fetch API.
     *
     * ### References
     *
     * On MDN:
     * * [Beacon API](https://developer.mozilla.org/en-US/docs/Web/API/Beacon_API)
     * * [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
     *
     * @param url URL to send beacon data to
     * @param data Beacon data to send
     */
    send(
        url: string,
        data?: string,
        headers?: Record<string, string>,
    ): Promise<R> {
        if (hasBeaconSupport && !headers) {
            if (navigator.sendBeacon(url, data)) {
                return Promise.resolve(this.makeSendResult())
            }
            // TODO: should we attempt to use fetch in this case, or does that risk
            // duplicate reporting?
            return Promise.reject(new Error("navigator.sendBeacon failed"))
        }
        const init: RequestInit = {
            method: "POST",
            body: data,
            // keepalive causes problems in some browsers
            // keepalive: true,
        }
        if (headers) {
            init.headers = new Headers(headers)
        }
        return fetch(url, init).then((r) => this.makeSendResult(r))
    }

    abstract makeSendResult(r?: Response): R
}
