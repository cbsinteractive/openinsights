import { Executable } from "../@types"
import { ProviderBase } from "../lib/providerBase"

export type UnitTestSessionConfig = {}

export type UnitTestProviderMocks = {
    shouldRun?: () => boolean
    fetchSessionConfig?: () => Promise<UnitTestSessionConfig>
    expandTasks?: () => Array<Executable>
}

export class UnitTestProvider extends ProviderBase<UnitTestSessionConfig> {
    constructor(mocks: UnitTestProviderMocks = {}) {
        super("Unit Testing", {} as Window & typeof globalThis)
        if (mocks.shouldRun) {
            this.shouldRun = mocks.shouldRun
        }
        if (mocks.fetchSessionConfig) {
            this.fetchSessionConfig = mocks.fetchSessionConfig
        }
        if (mocks.expandTasks) {
            this.expandTasks = mocks.expandTasks
        }
    }
    fetchSessionConfig(): Promise<UnitTestSessionConfig> {
        throw new Error("Method not implemented.")
    }
    expandTasks(): Executable[] {
        throw new Error("Method not implemented.")
    }
}
