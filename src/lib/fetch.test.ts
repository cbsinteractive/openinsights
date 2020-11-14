import { SimpleObject } from "../@types"
import { BeaconHandler } from "../util/beaconHandler"
import { Fetch, FetchConfiguration, FetchTestResultBundle } from "./fetch"

describe("Fetch", () => {
    type SomeConfiguration = FetchConfiguration
    type SomeResultBundle = FetchTestResultBundle
    class UnitTestFetch extends Fetch<
        SomeConfiguration,
        SomeResultBundle,
        unknown,
        unknown
    > {
        get resourceURL(): string {
            throw new Error("Method not implemented.")
        }
        updateFetchTestResults(
            response: Response,
            entry: SimpleObject,
        ): Promise<void> {
            throw new Error("Method not implemented.")
        }
        onError(reason: unknown): Promise<void> {
            throw new Error("Method not implemented.")
        }
        get beaconData(): unknown {
            throw new Error("Method not implemented.")
        }
        get beaconURL(): string {
            throw new Error("Method not implemented.")
        }
        testSetup(): Promise<void> {
            throw new Error("Method not implemented.")
        }
        onSendBeaconResolved(result: unknown): void {
            throw new Error("Method not implemented.")
        }
        onSendBeaconRejected(reason: unknown): void {
            throw new Error("Method not implemented.")
        }
    }

    class UnitTestBeaconHandler extends BeaconHandler<number> {
        makeSendResult(r?: Response): number {
            throw new Error("Method not implemented.")
        }
    }

    interface TestConfig {
        description: string
        fetchConfig: FetchConfiguration
        testResultBundle: FetchTestResultBundle
        beaconHandler: UnitTestBeaconHandler
    }
    const DEFAULT_FETCH_CONFIG: FetchConfiguration = { type: "some type" }
    const tests: Array<TestConfig> = [
        {
            description: "Change me",
            fetchConfig: Object.assign({}, DEFAULT_FETCH_CONFIG),
            testResultBundle: {},
            beaconHandler: new UnitTestBeaconHandler(),
        },
    ]
    tests.forEach((i) => {
        test(i.description, () => {
            const sut = new UnitTestFetch(
                i.fetchConfig,
                i.testResultBundle,
                i.beaconHandler,
            )
        })
    })
})
