import fetchMock from "jest-fetch-mock"
import { ResourceTimingEntry, SimpleObject } from "../@types"
import { BeaconHandler } from "../util/beaconHandler"
import { Fetch, FetchConfiguration, FetchTestResultBundle } from "./fetch"
import { asyncGetEntry } from "./resourceTiming"

jest.mock("./resourceTiming")

const asyncGetEntryMock = asyncGetEntry as jest.Mock<
    Promise<ResourceTimingEntry>
>

beforeEach(() => {
    fetchMock.resetMocks()
    asyncGetEntryMock.mockReset()
})

describe("Fetch", () => {
    describe("execute", () => {
        class UnitTestFetch extends Fetch<
            FetchConfiguration,
            FetchTestResultBundle,
            unknown,
            unknown
        > {
            get resourceURL(): string {
                throw new Error("Method not mocked.")
            }
            updateFetchTestResults(): Promise<void> {
                throw new Error("Method not mocked.")
            }
            onError(): Promise<void> {
                throw new Error("Method not mocked.")
            }
            get beaconData(): unknown {
                throw new Error("Method not mocked.")
            }
            get beaconURL(): string {
                throw new Error("Method not mocked.")
            }
            testSetup(): Promise<void> {
                throw new Error("Method not mocked.")
            }
            onSendBeaconResolved(): void {
                // Do nothing
            }
            onSendBeaconRejected(): void {
                // Do nothing
            }
        }

        class UnitTestBeaconHandler extends BeaconHandler<unknown> {
            constructor(private _expectedResult: unknown) {
                super()
            }
            makeSendResult(): unknown {
                return this._expectedResult
            }
        }

        interface TestConfig {
            description: string
            fetchConfig: FetchConfiguration
            testResultBundle: FetchTestResultBundle
            beaconHandler: UnitTestBeaconHandler
            expectedResult: Record<string, unknown>
            /**
             * If missing, then the asyncGetEntry Promise will be rejected
             */
            asyncGetEntryResponse?: SimpleObject
            fetchObjectProperties: PropertyDescriptorMap
            expectSetTimeoutId: boolean
        }

        const DEFAULT_FETCH_CONFIG: FetchConfiguration = { type: "some type" }

        const DEFAULT_FETCH_OBJECT_PROPERTIES: PropertyDescriptorMap = {
            resourceURL: {
                value: "some resource URL",
            },
            beaconURL: {
                value: "some beacon URL",
            },
            beaconData: {
                value: {
                    foo: "bar",
                },
            },
            _results: {
                value: {
                    a: 123,
                },
            },
        }

        const DEFAULT_TEST_CONFIG: TestConfig = {
            description: "Successful fetch",
            fetchConfig: Object.assign({}, DEFAULT_FETCH_CONFIG),
            testResultBundle: {},
            beaconHandler: new UnitTestBeaconHandler({ a: 0 }),
            expectedResult: { a: 123 },
            fetchObjectProperties: Object.assign(
                {},
                DEFAULT_FETCH_OBJECT_PROPERTIES,
            ),
            expectSetTimeoutId: false,
        }

        const tests: Array<TestConfig> = [
            Object.assign({}, DEFAULT_TEST_CONFIG, {
                asyncGetEntryResponse: { foo: "bar" },
            }),
            Object.assign({}, DEFAULT_TEST_CONFIG, {
                description: "Fail to find Resource Timing entry",
            }),
            Object.assign({}, DEFAULT_TEST_CONFIG, {
                description: "Has custom request headers",
                asyncGetEntryResponse: { foo: "bar" },
                fetchObjectProperties: Object.assign(
                    {},
                    DEFAULT_FETCH_OBJECT_PROPERTIES,
                    {
                        resourceRequestHeaders: {
                            value: {
                                a: "foo",
                                b: "bar",
                            },
                        },
                    },
                ),
            }),
            Object.assign({}, DEFAULT_TEST_CONFIG, {
                description: "Config includes 10 second timeout",
                fetchConfig: Object.assign({}, DEFAULT_FETCH_CONFIG, {
                    timeout: 10000,
                }),
                expectSetTimeoutId: true,
            }),
        ]

        tests.forEach((i) => {
            test(i.description, () => {
                const sut = new UnitTestFetch(
                    i.fetchConfig,
                    i.testResultBundle,
                    i.beaconHandler,
                )
                sut.testSetup = () => Promise.resolve()
                sut.testTearDown = () => {
                    return Promise.resolve()
                }
                Object.defineProperties(sut, i.fetchObjectProperties)
                if (i.asyncGetEntryResponse) {
                    asyncGetEntryMock.mockResolvedValueOnce(
                        i.asyncGetEntryResponse,
                    )
                } else {
                    asyncGetEntryMock.mockRejectedValueOnce(new Error("Foo"))
                }
                sut.updateFetchTestResults = jest
                    .fn()
                    .mockResolvedValueOnce(undefined)
                sut.onError = () => {
                    return Promise.resolve()
                }
                const setTimeoutId = jest.spyOn(sut, "setTimeoutId") //sut.setTimeoutId
                return sut.execute().then((result) => {
                    expect(result).toStrictEqual(i.expectedResult)
                    if (i.expectSetTimeoutId) {
                        expect(setTimeoutId).toHaveBeenCalled()
                    } else {
                        expect(setTimeoutId).not.toHaveBeenCalled()
                    }
                })
            })
        })
    })
})
