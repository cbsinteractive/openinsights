import { Executable } from "./@types"
import init from "./init"
import ProviderBase from "./lib/providerBase"
import { makeDescription, TestCaseConfig } from "./testUtil"
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
    interface TestConfig extends TestCaseConfig {
        providers: Array<UnitTestProvider>
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
            description: makeDescription(
                "single provider",
                "fetchSessionConfig rejects",
            ),
            providers: [
                (() => {
                    const result = new UnitTestProvider()
                    result.fetchSessionConfig = jest
                        .fn()
                        .mockRejectedValueOnce("some error")
                    return result
                })(),
            ],
            expectedResult: { testResults: [] },
        },
    ]
    tests.forEach((i) => {
        test(i.description, () => {
            const settingsBuilder = new ClientSettingsBuilder()
            i.providers.forEach((i) => settingsBuilder.addProvider(i))
            return init(settingsBuilder.toSettings())
                .then((result) => {
                    expect(result).toStrictEqual(i.expectedResult)
                })
        })
    })
})
