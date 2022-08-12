import { Executable, Provider } from "../@types"

/**
 * A common base class for providers.
 *
 * @typeParam SC The type to be used for the internal session configuration.
 * @typeParam TC The type to be used for the test configuration.
 */
export abstract class ProviderBase<SC> implements Provider {
    /**
     * @remarks
     * This is saved at the beginning of a RUM session within {@link start}.
     */
    private _sessionConfig?: SC

    /**
     * See {@link Provider.fetchSessionConfig}.
     */
    abstract fetchSessionConfig(): Promise<SC>

    /**
     * See {@link Provider.expandTasks}.
     */
    abstract expandTasks(): Executable[]

    /**
     * See {@link Provider.shouldRun}.
     */
    abstract shouldRun(): boolean

    /**
     * See {@link Provider.setSessionConfig}.
     */
    setSessionConfig(value: SC): void {
        this._sessionConfig = value
    }

    /**
     * See {@link Provider.sessionConfig}.
     */
    get sessionConfig(): SC {
        if (!this._sessionConfig) {
            // Caller should have set this before
            throw new Error("Session config not set")
        }
        return this._sessionConfig
    }
}
