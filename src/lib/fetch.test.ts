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
        type SomeConfiguration = FetchConfiguration
        type SomeResultBundle = FetchTestResultBundle
        class UnitTestFetch extends Fetch<
            SomeConfiguration,
            SomeResultBundle,
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
        }
        const DEFAULT_FETCH_CONFIG: FetchConfiguration = { type: "some type" }
        const tests: Array<TestConfig> = [
            {
                description: "Successful fetch",
                fetchConfig: Object.assign({}, DEFAULT_FETCH_CONFIG),
                testResultBundle: {},
                beaconHandler: new UnitTestBeaconHandler({ a: 0 }),
                expectedResult: { a: 123 },
                asyncGetEntryResponse: { foo: "bar" },
                fetchObjectProperties: {
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
                },
            },
            {
                description: "Fail to find Resource Timing entry",
                fetchConfig: Object.assign({}, DEFAULT_FETCH_CONFIG),
                testResultBundle: {},
                beaconHandler: new UnitTestBeaconHandler({ a: 0 }),
                expectedResult: { a: 123 },
                fetchObjectProperties: {
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
                },
            },
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
                return sut.execute().then((result) => {
                    expect(result).toStrictEqual(i.expectedResult)
                })
            })
        })
    })
})
