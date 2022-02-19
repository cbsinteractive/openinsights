import { Executable, Provider } from "../@types"

/**
 * A common base class for providers.
 *
 * @typeParam SC The type to be used for the internal session configuration.
 * @typeParam TC The type to be used for the test configuration.
 */
export abstract class ProviderBase<SC> implements Provider {
    /**
     * @param _name A provider-defined name.
     */
    constructor(
        /**
         * @remarks
         * This can be used for logging purposes.
         */
        private _name: string,
        private _window: Window & typeof globalThis,
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
        function isValidResourceTimingObject(
            obj: PerformanceEntry,
        ): obj is PerformanceResourceTiming {
            const temp = obj as PerformanceResourceTiming
            return (
                temp.fetchStart !== undefined &&
                temp.requestStart !== undefined &&
                temp.responseStart !== undefined &&
                temp.responseEnd !== undefined
            )
        }
        if (
            !this._window.performance ||
            typeof this._window.performance.getEntriesByType !== "function" ||
            !this._window.Promise ||
            !this._window.Promise.allSettled ||
            !this._window.fetch ||
            !this._window.AbortController ||
            !this._window.PerformanceObserver
        ) {
            return false
        }
        const entries = this._window.performance.getEntriesByType("resource")
        if (!entries.length) {
            // Can't make a safe determination
            return false
        }
        if (!isValidResourceTimingObject(entries[0])) {
            return false
        }
        return true
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
        return this._sessionConfig!
    }
}
