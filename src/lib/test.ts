import { Executable } from "../@types"

/**
 * An abstract class representing a RUM test. Subclasses must implement
 * abstract methods in order to define a particular type of RUM test.
 *
 * @typeParam C The type to be used for the internal test configuration.
 * @typeParam R The type to be used for the test results.
 * @typeParam D The type to be used for beacon data.
 * @typeParam SBR The type to be used for the send beacon result.
 */
export //abstract
class Test implements Executable {
    // constructor(
    //     /**
    //      * The test configuration.
    //      */
    //     private _config: C,
    //     /**
    //      * A {@link TestResultBundle} initialized by the provider.
    //      */
    //     private _results: R,
    //     /**
    //      * TODO
    //      */
    //     private _beaconHandler?: BeaconHandler<SBR>,
    // ) {}

    // get config(): C {
    //     return this._config
    // }

    // get testResults(): R {
    //     return this._results
    // }

    // get beaconHandler() {
    //     return this._beaconHandler
    // }

    // /**
    //  * TODO
    //  */
    // get beaconData(): D {
    //     throw new Error("Method not implemented")
    // }

    // /**
    //  * TODO
    //  */
    // get beaconURL(): string {
    //     throw new Error("Method not implemented")
    // }

    // get beaconHeaders(): Record<string, string> | undefined {
    //     return
    // }

    execute(): Promise<unknown> {
        throw new Error("Method not implemented.")
    }

    // /**
    //  * This is the logic function for conducting an individual test.
    //  */
    // execute(): Promise<R> {
    //     console.log("Test.execute")
    //     return this.testSetup()
    //         .then(() => {
    //             console.log("Test.execute: calling test()")
    //             return this.test()
    //         })
    //         .then(() => {
    //             console.log("Test.execute: calling shouldSendBeacon()")
    //             if (this.shouldSendBeacon()) {
    //                 console.log("Test.execute: calling sendBeacon()")
    //                 this.sendBeacon()
    //                     .then((result) => {
    //                         this.onSendBeaconResolved(result)
    //                     })
    //                     .catch((reason) => {
    //                         this.onSendBeaconRejected(reason)
    //                     })
    //             } else {
    //                 console.log("Test.execute: shouldSendBeacon() return false")
    //             }
    //         })
    //         .then(() => this.testTearDown())
    //         .then(() => {
    //             return this._results
    //         })
    //         .catch((reason) => {
    //             console.log(`Test.execute: caught ${reason}`)
    //             return this._results
    //         })
    // }

    // /**
    //  * Give providers a final say as to whether a beacon should be sent.
    //  * The default implementation simply returns `true`.
    //  */
    // shouldSendBeacon(): boolean {
    //     return true
    // }

    // /**
    //  * TODO
    //  */
    // abstract testSetup(): Promise<void>

    // /**
    //  * A default implementation for providers than have no test tear down
    //  * logic to perform.
    //  */
    // testTearDown(): Promise<void> {
    //     return Promise.resolve()
    // }

    // /**
    //  * TODO
    //  */
    // onSendBeaconResolved(_result: SBR): void {
    //     // Do nothing
    // }

    // /**
    //  * TODO
    //  */
    // onSendBeaconRejected(_reason: unknown): void {
    //     // Do nothing
    // }

    // /**
    //  * TODO
    //  */
    // sendBeacon(): Promise<SBR> {
    //     if (!this._beaconHandler) {
    //         return Promise.reject("No beacon handler defined")
    //     }
    //     return this._beaconHandler.send(
    //         this.beaconURL,
    //         this.encodeBeaconData(this.beaconData),
    //         this.beaconHeaders,
    //     )
    // }

    // /**
    //  * A subclass implements this method in order to define its specialized
    //  * workflow.
    //  * @returns A Promise that resolves when the test data has been obtained.
    //  */
    // abstract test(): Promise<void>

    // encodeBeaconData(data: D): string {
    //     return JSON.stringify(data)
    // }
}
