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
        {
            description: makeDescription(
                "single provider",
                "expandTasks encounters a problem",
            ),
            providers: [
                (() => {
                    const result = new UnitTestProvider()
                    const config: UnitTestSessionConfig = {
                        foo: 123,
                    }
                    result.fetchSessionConfig = jest
                        .fn()
                        .mockResolvedValueOnce(config)
                    result.expandTasks = jest.fn(() => {
                        throw new Error("some error")
                    })
                    return result
                })(),
            ],
            expectedResult: {
                initError: new Error("some error"),
                testResults: [],
            },
        },
    ]
    tests.forEach((i) => {
        test(i.description, () => {
            const settingsBuilder = new ClientSettingsBuilder()
            i.providers.forEach((i) => {
                expect(i.name).toBe("Unit Testing")
                settingsBuilder.addProvider(i)
            })
            return init(settingsBuilder.toSettings()).then((result) => {
                expect(result).toStrictEqual(i.expectedResult)
            })
        })
    })
})
