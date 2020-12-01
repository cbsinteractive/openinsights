import { Executable } from "./@types"
import init from "./init"
import ProviderBase from "./lib/providerBase"
import { TestCaseConfig } from "./testUtil"
import ClientSettingsBuilder from "./util/clientSettingsBuilder"

/**
 * Module coverage:
 *  - init.ts
 *  - src/lib/providerBase.ts
 *  - src/util/defaultSessionProcessFunc.ts
 */
describe("init and ProviderBase", () => {
    interface UnitTestSessionConfig {
        foo: number
    }
    type FetchSessionConfigResult = string | UnitTestSessionConfig
    interface TestConfig extends TestCaseConfig {
        sessionConfigResult: FetchSessionConfigResult
        expectedResult: unknown
    }
    class UnitTestProvider extends ProviderBase<UnitTestSessionConfig> {
        constructor() {
            super("Unit Testing")
        }
        fetchSessionConfig(): Promise<UnitTestSessionConfig> {
            throw new Error("Method not implemented: fetchSessionConfig")
        }
        expandTasks(): Executable[] {
            throw new Error("Method not implemented: expandTasks")
        }
    }
    const tests: Array<TestConfig> = [
        {
            description: "fetchSessionConfig rejects",
            sessionConfigResult: "some error",
            expectedResult: { testResults: [] },
        },
    ]
    tests.forEach((i) => {
        test(i.description, () => {
            const provider = new UnitTestProvider()
            if (typeof i.sessionConfigResult == "string") {
                provider.fetchSessionConfig = jest
                    .fn()
                    .mockRejectedValueOnce(i.sessionConfigResult)
            } else {
                provider.fetchSessionConfig = jest
                    .fn()
                    .mockResolvedValueOnce(i.sessionConfigResult)
            }
            const settingsBuilder = new ClientSettingsBuilder()
            settingsBuilder.addProvider(provider)
            return init(settingsBuilder.toSettings())
                .then((result) => {
                    expect(result).toStrictEqual(i.expectedResult)
                })
                .catch((reason) => {
                    console.log(`Reason: ${reason}`)
                })
        })
    })
})
