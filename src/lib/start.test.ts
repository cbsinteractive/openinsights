import { ClientSettings, Executable, SessionResult } from "../@types"
import { makeDescription, TestCaseConfig } from "../testUtil"
import ProviderBase from "./providerBase"
import { start, startLater } from "./start"

type UnitTestConfig = number

class UnitTestProvider extends ProviderBase<UnitTestConfig> {
    fetchSessionConfig(): Promise<UnitTestConfig> {
        throw new Error("Method not implemented.")
    }
    expandTasks(): Executable[] {
        throw new Error("Method not implemented.")
    }
    constructor() {
        super("Unit Testing")
    }
}

interface TestConfig extends TestCaseConfig {
    settings: ClientSettings
    result: SessionResult
}

describe("start", () => {
    const tests: Array<TestConfig> = [
        {
            description: makeDescription("no valid providers"),
            settings: {
                providers: [
                    (() => {
                        const provider = new UnitTestProvider()
                        provider.shouldRun = jest.fn().mockReturnValue(false)
                        return provider
                    })(),
                ],
            },
            result: { testResults: [] },
        },
        {
            description: makeDescription(
                "single provider",
                "fetch session config promise rejects",
            ),
            settings: {
                providers: [
                    (() => {
                        const provider = new UnitTestProvider()
                        provider.fetchSessionConfig = jest
                            .fn()
                            .mockRejectedValueOnce(
                                "some fetch session config error",
                            )
                        return provider
                    })(),
                ],
            },
            result: { testResults: [] },
        },
        {
            description: makeDescription(
                "single provider",
                "error expanding tasks",
            ),
            settings: {
                providers: [
                    (() => {
                        const provider = new UnitTestProvider()
                        provider.fetchSessionConfig = jest
                            .fn()
                            .mockReturnValueOnce("some session config")
                        provider.expandTasks = jest
                            .fn()
                            .mockImplementationOnce(() => {
                                throw new Error("some error")
                            })
                        return provider
                    })(),
                ],
            },
            result: { initError: new Error("some error"), testResults: [] },
        },
    ]
    tests.forEach((i) => {
        test(i.description, () => {
            return start(i.settings).then((result) => {
                expect(result).toStrictEqual(i.result)
            })
        })
    })
})

describe("startLater", () => {
    interface TestConfigWithDelay extends TestConfig {
        delay: number
    }
    const tests: Array<TestConfigWithDelay> = [
        {
            description: makeDescription("single provider"),
            delay: 10000,
            settings: {
                providers: [
                    (() => {
                        const provider = new UnitTestProvider()
                        provider.fetchSessionConfig = jest
                            .fn()
                            .mockResolvedValue(123)
                        provider.expandTasks = jest.fn().mockReturnValueOnce([])
                        return provider
                    })(),
                ],
            },
            result: { testResults: [] },
        },
    ]
    beforeEach(() => {
        jest.useFakeTimers()
    })
    tests.forEach((i) => {
        test(i.description, () => {
            const promise = startLater(i.delay, i.settings).then((result) => {
                expect(result).toStrictEqual(i.result)
            })
            jest.runAllTimers()
            return promise
        })
    })
})
