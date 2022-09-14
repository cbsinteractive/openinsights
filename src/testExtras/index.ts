export type PerformanceTimingProperties = {
    transferSize?: number
    encodedBodySize?: number
    decodedBodySize?: number
    startTime?: number
    duration?: number
    redirectStart?: number
    redirectEnd?: number
    fetchStart?: number
    domainLookupStart?: number
    domainLookupEnd?: number
    connectStart?: number
    connectEnd?: number
    secureConnectionStart?: number
    requestStart?: number
    responseStart?: number
    responseEnd?: number
}

export class TestPerformanceResourceTiming
    implements PerformanceResourceTiming
{
    constructor(name: string, props: PerformanceTimingProperties) {
        const getNumericProperty = (
            setting: number | undefined,
            defaultValue: number,
        ) => {
            return typeof setting === "number" ? setting : defaultValue
        }

        this.name = name
        this.transferSize = getNumericProperty(props.transferSize, 1000000)
        this.encodedBodySize = getNumericProperty(props.encodedBodySize, 900000)
        this.decodedBodySize = getNumericProperty(props.decodedBodySize, 800000)
        this.startTime = getNumericProperty(props.startTime, 1000.123)
        // Default redirect time is 0s
        this.redirectStart = getNumericProperty(props.redirectStart, 0)
        this.redirectEnd = getNumericProperty(props.redirectEnd, 0)
        // `fetchStart` is basically the "post-redirect" start time. It's usually a
        // tiny bit later than `startTime`
        this.fetchStart = getNumericProperty(props.fetchStart, 1000.456)
        this.domainLookupStart = getNumericProperty(
            props.domainLookupStart,
            1001.123,
        )
        this.domainLookupEnd = getNumericProperty(
            props.domainLookupEnd,
            1002.123,
        )
        this.connectStart = getNumericProperty(props.connectStart, 2010.123)
        this.secureConnectionStart = getNumericProperty(
            props.secureConnectionStart,
            2012.123,
        )
        // Connect end encompasses TLS handshake
        this.connectEnd = getNumericProperty(props.connectEnd, 2013.123)
        // Usually a tiny bit later than connect end
        this.requestStart = getNumericProperty(props.requestStart, 2013.456)
        this.responseStart = getNumericProperty(props.responseStart, 2014.123)
        this.responseEnd = getNumericProperty(props.responseEnd, 3010.123)

        // Calculate the default
        this.duration = getNumericProperty(
            props.duration,
            this.responseEnd - this.startTime,
        )
    }

    entryType = "resource"
    name: string
    transferSize: number
    encodedBodySize: number
    decodedBodySize: number
    initiatorType = "unused"
    nextHopProtocol = "unused"
    startTime: number
    duration: number
    workerStart = 0 // unused
    redirectStart: number
    redirectEnd: number
    fetchStart: number
    domainLookupStart: number
    domainLookupEnd: number
    connectStart: number
    secureConnectionStart: number
    connectEnd: number
    requestStart: number
    responseStart: number
    responseEnd: number
    serverTiming: readonly PerformanceServerTiming[] = []
    toJSON() {
        return {
            startTime: this.startTime,
            duration: this.duration,
            redirectStart: this.redirectStart,
            redirectEnd: this.redirectEnd,
            fetchStart: this.fetchStart,
            domainLookupStart: this.domainLookupStart,
            domainLookupEnd: this.domainLookupEnd,
            connectStart: this.connectStart,
            connectEnd: this.connectEnd,
            secureConnectionStart: this.secureConnectionStart,
            requestStart: this.requestStart,
            responseStart: this.responseStart,
            responseEnd: this.responseEnd,
            transferSize: this.transferSize,
            encodedBodySize: this.encodedBodySize,
            decodedBodySize: this.decodedBodySize,
        }
    }
}

export class TestAbortSignal implements AbortSignal {
    aborted = false
    onabort = null
    reason: any
    throwIfAborted(): void {
        throw new Error("Method not implemented.")
    }
    addEventListener<K extends "abort">(
        type: K,
        listener: (this: AbortSignal, ev: AbortSignalEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions | undefined,
    ): void
    addEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions | undefined,
    ): void
    addEventListener(
        _type: unknown,
        _listener: unknown,
        _options?: unknown,
    ): void {
        throw new Error("Method not implemented.")
    }
    removeEventListener<K extends "abort">(
        type: K,
        listener: (this: AbortSignal, ev: AbortSignalEventMap[K]) => any,
        options?: boolean | EventListenerOptions | undefined,
    ): void
    removeEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | EventListenerOptions | undefined,
    ): void
    removeEventListener(
        _type: unknown,
        _listener: unknown,
        _options?: unknown,
    ): void {
        throw new Error("Method not implemented.")
    }
    dispatchEvent(_event: Event): boolean {
        throw new Error("Method not implemented.")
    }
}

export class TestAbortController implements AbortController {
    signal: AbortSignal = new TestAbortSignal()
    abort(reason?: any): void
    abort(): void
    abort(_reason?: unknown): void {
        // Do nothing. Calling this function manifests at an error thrown by
        // the fetch sequence (e.g. fetch() or response.blob())
    }
}
