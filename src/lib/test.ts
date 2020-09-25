import {
    Executable,
    Provider,
    TestResultBundle,
    TestSetupResult,
} from "../@types"

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
 * The possible states that a {@link Test} can be in.
 */

export enum TestState {
    /**
     * The test is not yet started.
     */
    NotStarted,
    /**
     * The test started, but reached an error condition. Once in this state,
     * a test should not be able to move to another state.
     */
    Error,
    /**
     * The test started, but has not finished or reached an error condition.
     */
    Running,
    /**
     * The test finished without reaching an error condition. Once reached, a
     * test should not be able to move to another state.
     */
    Finished,
    /**
     * The test took too long to run.
     */
    Timeout,
}

/**
 * An abstract class representing a RUM test. Subclasses must implement
 * abstract methods in order to define a particular type of RUM test.
 *
 * @typeParam TC The type to be used for the internal test configuration.
 */
export abstract class Test<TC extends TestConfiguration> implements Executable {
    /**
     * The current test state.
     */
    private _state: TestState = TestState.NotStarted

    /**
     * Id of the fetch timeout. This is used to cancel the timeout if the
     * test succeeds or fails with an error before the timeout elapses.
     */
    private _timeoutId: number | undefined

    /**
     * @param _provider The provider that owns the test
     * @param _config The provider-defined configuration for the test
     */
    constructor(
        /**
         * The provider that owns the test. Through this member variable,
         * the client is able to reach a number of provider "hooks",
         * enabling providers to define and customize behavior.
         */
        protected _provider: Provider,
        /**
         * The provider-defined configuration for the test.
         */
        protected _config: TC,
    ) {}

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
     * Indicates the current state of the test.
     */
    get state(): TestState {
        return this._state
    }

    /**
     * This is the logic function for conducting an individual test.
     */
    execute(): Promise<TestResultBundle> {
        this._state = TestState.Running
        let savedTestSetupResult: TestSetupResult
        return this._provider
            .testSetUp(this._config)
            .then((setupResult) => {
                savedTestSetupResult = setupResult
                return this.test(setupResult)
            })
            .then((bundle) => {
                // Set the provider name
                bundle.providerName = this._provider.name
                // Add beacon data to the result bundle
                bundle.beaconData = this._provider.makeBeaconData(
                    this._config,
                    bundle,
                )
                this._provider
                    .sendBeacon(
                        this._config,
                        this._provider.encodeBeaconData(
                            this._config,
                            bundle.beaconData,
                        ),
                    )
                    .then(
                        (result) => {
                            this._provider.onSendBeaconResolved(result)
                        },
                        (error) => {
                            this._provider.onSendBeaconRejected(error)
                        },
                    )
                this._state = TestState.Finished
                return bundle
            })
            .then((bundle) => this._provider.testTearDown(bundle))
            .catch(
                (errorReason): Promise<TestResultBundle> => {
                    this._state = TestState.Error
                    // Give provider an opportunity to report an error
                    this._provider.onTestFailure(
                        this._config,
                        savedTestSetupResult,
                        errorReason,
                    )
                    return Promise.resolve({
                        providerName: this._provider.name,
                        testType: this._config.type,
                        data: [],
                        setupResult: savedTestSetupResult,
                        errorReason,
                    })
                },
            )
    }

    /**
     * A subclass implements this method in order to define its specialized
     * mechanics.
     * @param setupResult Result of the previous {@link Provider.testSetUp} call
     * @returns A Promise resolving to a {@link ResultBundle} object, the
     * result of calling {@link Provider.createFetchTestResult} when the test
     * data has been obtained.
     */
    abstract test(setupResult: TestSetupResult): Promise<TestResultBundle>
}
