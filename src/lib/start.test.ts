import { Executable, Provider, SessionResult } from "../@types"
import { TestCaseConfig } from "../testUtil"
import {
    UnitTestProvider,
    UnitTestSessionConfig,
} from "../testUtil/unitTestProvider"
import { startLater } from "./start"

describe("startLater", () => {
    interface TestConfig extends TestCaseConfig {
        providers: Array<Provider>
        expectedResult: SessionResult
    }
    const tests: Array<TestConfig> = [
        {
            description: "no providers should run",
            providers: [
                new UnitTestProvider({
                    shouldRun: jest.fn().mockReturnValue(false),
                }),
            ],
            expectedResult: {
                testResults: [],
            },
        },
        {
            description: "fetch session config promise rejects",
            providers: [
                new UnitTestProvider({
                    shouldRun: jest.fn().mockReturnValue(true),
                    fetchSessionConfig: jest.fn().mockRejectedValueOnce("foo"),
                }),
            ],
            expectedResult: {
                testResults: [],
            },
        },
        {
            description: "happy path",
            providers: [
                new UnitTestProvider({
                    shouldRun: jest.fn().mockReturnValue(true),
                    fetchSessionConfig: jest.fn<
                        Promise<UnitTestSessionConfig>,
                        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                        any
                    >(() => Promise.resolve({})),
                    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                    expandTasks: jest.fn<Array<Executable>, any>(() => {
                        return [
                            {
                                execute: jest.fn().mockResolvedValueOnce("foo"),
                            },
                            {
                                execute: jest.fn().mockResolvedValueOnce("bar"),
                            },
                            {
                                execute: jest.fn().mockResolvedValueOnce("baz"),
                            },
                        ]
                    }),
                }),
            ],
            expectedResult: {
                testResults: ["foo", "bar", "baz"],
            },
        },
    ]
    tests.forEach((testConfig) => {
        test(testConfig.description, async () => {
            const result = await startLater(0, {
                providers: testConfig.providers,
            })
            expect(result).toStrictEqual(testConfig.expectedResult)
        })
    })
})
