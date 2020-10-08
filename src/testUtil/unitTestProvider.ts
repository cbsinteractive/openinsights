import { BeaconData, Executable, TestResultBundle } from "../@types"
import ProviderBase from "../lib/providerBase"

export type UnitTestSessionConfig = unknown
export type UnitTestTestConfig = unknown
export type UnitTestBeaconData = BeaconData
export type UnitTestTestResultBundle = TestResultBundle

export class UnitTestProvider extends ProviderBase<
    UnitTestSessionConfig,
    UnitTestTestConfig,
    UnitTestBeaconData,
    UnitTestTestResultBundle
> {
    fetchSessionConfig(): Promise<UnitTestSessionConfig> {
        throw new Error("Method not implemented.")
    }
    expandTasks(): Executable[] {
        throw new Error("Method not implemented.")
    }
    makeBeaconData(): BeaconData {
        throw new Error("Method not implemented.")
    }
    getResourceUrl(): string {
        throw new Error("Method not implemented.")
    }
    getResourceRequestHeaders(): Record<string, string> {
        throw new Error("Method not implemented.")
    }
    shouldRun(): boolean {
        throw new Error("Method not implemented.")
    }
    onTestFailure(): void {
        throw new Error("Method not implemented.")
    }
}
