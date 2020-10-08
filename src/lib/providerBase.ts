/* eslint-disable @typescript-eslint/no-unused-vars */
import { Executable, Provider } from "../@types"
import { getWindow } from "../util/getWindow"
import { hasProperties } from "../util/object"
import { KnownErrors } from "./errors"

/**
 * A common base class for providers.
 *
 * @typeParam SC The type to be used for the internal session configuration.
 * @typeParam TC The type to be used for the test configuration.
 */
export default abstract class ProviderBase<SC> implements Provider {
    /**
     * @param _name A provider-defined name.
     */
    constructor(
        /**
         * @remarks
         * This can be used for logging purposes.
         */
        private _name: string,
    ) {}

    /**
     * @remarks
     * This is saved at the beginning of a RUM session within {@link start}.
     */
    private _sessionConfig?: SC

    /**
     * See {@link Provider.name}.
     */
    get name(): string {
        return this._name
    }

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
     * @remarks Providers that override `shouldRun` to perform additional
     * validation should call this implementation as well,
     * e.g. `super.shouldRun()`.
     */
    shouldRun(): boolean {
        // List of required features browser features
        const requiredFeatures = [
            "Promise.allSettled",
            "fetch",
            "AbortController",
        ]
        // Test whether browser has required feature support
        return hasProperties(getWindow(), requiredFeatures)
    }

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
        /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
        return this._sessionConfig!
    }
}
