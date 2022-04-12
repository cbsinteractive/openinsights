import { Executable } from "../@types"
import { BeaconHandler } from "../util/beaconHandler"

/**
 * An interface representing the required configuration of a RUM test.
 */
export interface TestConfiguration {
    /**
     * Indicates the test type.
     */
    type: string
}

/**
 * An abstract class representing a RUM test. Subclasses must implement
 * abstract methods in order to define a particular type of RUM test.
 *
 * @typeParam C The type to be used for the internal test configuration.
 * @typeParam R The type to be used for the test results.
 * @typeParam D The type to be used for beacon data.
 * @typeParam SBR The type to be used for the send beacon result.
 */
export abstract class Test<C extends TestConfiguration, R, D, SBR>
    implements Executable
{
    /**
     * Id of the fetch timeout. This is used to cancel the timeout if the
     * test succeeds or fails with an error before the timeout elapses.
     */
    private _timeoutId: number | undefined

    constructor(
        /**
         * The test configuration.
         */
        private _config: C,
        /**
         * A {@link TestResultBundle} initialized by the provider.
         */
        private _results: R,
        /**
         * TODO
         */
        private _beaconHandler?: BeaconHandler<SBR>,
    ) {}

    get config(): C {
        return this._config
    }

    get testResults(): R {
        return this._results
    }

    get beaconHandler() {
        return this._beaconHandler
    }

    /**
     * TODO
     */
    get beaconData(): D {
        throw new Error("Method not implemented")
    }

    /**
     * TODO
     */
    get beaconURL(): string {
        throw new Error("Method not implemented")
    }

    get beaconHeaders(): Record<string, string> | undefined {
        return
    }

    /**
     * Set the id of the timeout used to trigger test failure if it takes
     * too long.
     * @param timeoutId The id of a timeout created by window.setTimeout
     */
    setTimeoutId(timeoutId: number): void {
        if (this._timeoutId == undefined) {
            this._timeoutId = timeoutId
        }
    }

    /**
     * Clear an timeout when the test is considered to have succeeded or
     * failed in a normal way. Subsequent calls have no effect.
     */
    clearTimeout(): void {
        if (typeof this._timeoutId == "number") {
            window.clearTimeout(this._timeoutId)
        }
    }

    /**
     * This is the logic function for conducting an individual test.
     */
    execute(): Promise<R> {
        return this.testSetup()
            .then(() => {
                return this.test()
            })
            .then(() => {
                if (this.shouldSendBeacon()) {
                    this.sendBeacon()
                        .then((result) => {
                            this.onSendBeaconResolved(result)
                        })
                        .catch((reason) => {
                            this.onSendBeaconRejected(reason)
                        })
                }
            })
            .then(() => this.testTearDown())
            .then(() => {
                return this._results
            })
            .catch(() => {
                return this._results
            })
    }

    /**
     * Give providers a final say as to whether a beacon should be sent.
     * The default implementation simply returns `true`.
     */
    shouldSendBeacon(): boolean {
        return true
    }

    /**
     * TODO
     */
    abstract testSetup(): Promise<void>

    /**
     * A default implementation for providers than have no test tear down
     * logic to perform.
     */
    testTearDown(): Promise<void> {
        return Promise.resolve()
    }

    /**
     * TODO
     */
    onSendBeaconResolved(_result: SBR): void {
        // Do nothing
    }

    /**
     * TODO
     */
    onSendBeaconRejected(_reason: unknown): void {
        // Do nothin
    }

    /**
     * TODO
     */
    sendBeacon(): Promise<SBR> {
        if (!this._beaconHandler) {
            return Promise.reject("No beacon handler defined")
        }
        return this._beaconHandler.send(
            this.beaconURL,
            this.encodeBeaconData(this.beaconData),
            this.beaconHeaders,
        )
    }

    /**
     * A subclass implements this method in order to define its specialized
     * workflow.
     * @returns A Promise that resolves when the test data has been obtained.
     */
    abstract test(): Promise<void>

    encodeBeaconData(data: D): string {
        return JSON.stringify(data)
    }
}
