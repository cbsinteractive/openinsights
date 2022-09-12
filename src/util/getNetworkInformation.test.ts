import { Navigator, NetworkInformation } from "../@types"
import { TestCaseConfig } from "../testUtil"
import getNetworkInformation from "./getNetworkInformation"

describe("getNetworkInformation", () => {
    interface TestConfig extends TestCaseConfig {
        expectedResult: NetworkInformation
        navigator?: Navigator
    }
    const DEFAULT_TEST_CONFIG: TestConfig = {
        description: "Navigator undefined",
        expectedResult: {},
    }
    const tests: Array<TestConfig> = [
        Object.assign({}, DEFAULT_TEST_CONFIG, {}),
        Object.assign({}, DEFAULT_TEST_CONFIG, {
            description: "Navigator lacks connection object",
            navigator: {},
        }),
        Object.assign({}, DEFAULT_TEST_CONFIG, {
            description: "Navigator has connection object",
            navigator: {
                connection: {
                    foo: "abc",
                    bar: 123,
                    baz: true,
                    qux: {},
                },
            },
            expectedResult: {
                foo: "abc",
                bar: 123,
                baz: true,
            },
        }),
    ]
    tests.forEach((i) => {
        test(i.description, () => {
            // Code under test
            expect(getNetworkInformation(i.navigator)).toStrictEqual(
                i.expectedResult,
            )
        })
    })
})
