import { Executable, SessionResult } from "./@types"
import init from "./init"
import ProviderBase from "./lib/providerBase"
import { start, startLater } from "./lib/start"
import { makeDescription, TestCaseConfig } from "./testUtil"
import ClientSettingsBuilder from "./util/clientSettingsBuilder"

jest.mock("./lib/start")

const mockStart = start as jest.Mock<Promise<SessionResult>>
const mockStartLater = startLater as jest.Mock<Promise<SessionResult>>

describe("init and ProviderBase", () => {
    type UnitTestSessionConfig = number
    interface StartConfig {
        result: SessionResult
    }
    interface TestConfig extends TestCaseConfig {
        providers: Array<UnitTestProvider>
        preConfigStartDelay?: number
        startConfig?: StartConfig
        startLaterConfig?: StartConfig
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
            description: makeDescription("single provider"),
            startConfig: {
                result: { testResults: [] },
            },
            providers: [new UnitTestProvider()],
            expectedResult: { testResults: [] },
        },
        {
            description: makeDescription("single provider", "delayed start"),
            preConfigStartDelay: 10000,
            startLaterConfig: {
                result: { testResults: [] },
            },
            providers: [new UnitTestProvider()],
            expectedResult: { testResults: [] },
        },
    ]
    beforeEach(() => {
        mockStart.mockReset()
        mockStartLater.mockReset()
    })
    tests.forEach((i) => {
        test(i.description, () => {
            const settingsBuilder = new ClientSettingsBuilder()
            i.providers.forEach((i) => {
                expect(i.name).toBe("Unit Testing")
                settingsBuilder.addProvider(i)
            })
            if (typeof i.preConfigStartDelay == "number") {
                settingsBuilder.setPreConfigStartDelay(i.preConfigStartDelay)
            }
            if (i.startConfig) {
                mockStart.mockResolvedValueOnce(i.startConfig.result)
            } else if (i.startLaterConfig) {
                mockStartLater.mockResolvedValueOnce(i.startLaterConfig.result)
            }
            return init(settingsBuilder.toSettings()).then((result) => {
                expect(result).toStrictEqual(i.expectedResult)
            })
        })
    })
})
