test("foo", () => {})

// import fetchMock from "jest-fetch-mock"
// import { makeDescription, TestCaseConfig } from "../testUtil"
// import { BeaconHandler } from "../util/beaconHandler"
// import { Fetch, FetchConfiguration, FetchTestResultBundle } from "./fetch"
// import { asyncGetEntry } from "./resourceTiming"

// jest.mock("./resourceTiming")

// const asyncGetEntryMock = asyncGetEntry as jest.Mock<
//     Promise<PerformanceResourceTiming>
// >

// beforeEach(() => {
//     fetchMock.resetMocks()
//     asyncGetEntryMock.mockReset()
//     jest.useFakeTimers()
// })

// describe("Fetch", () => {
//     class TestPerformanceServerTiming implements PerformanceServerTiming {
//         description = "foo"
//         duration = 0
//         name = "foo"
//         toJSON() {
//             throw new Error("Method not implemented.")
//         }
//     }
//     const DEFAULT_SERVER_TIMING_ENTRY = new TestPerformanceServerTiming()
//     class TestPerformanceResourceTiming implements PerformanceResourceTiming {
//         connectEnd = 0
//         connectStart = 0
//         decodedBodySize = 0
//         domainLookupEnd = 0
//         domainLookupStart = 0
//         encodedBodySize = 0
//         fetchStart = 0
//         initiatorType = "foo"
//         nextHopProtocol = "foo"
//         redirectEnd = 0
//         redirectStart = 0
//         requestStart = 0
//         responseEnd = 0
//         responseStart = 0
//         secureConnectionStart = 0
//         serverTiming = [Object.assign({}, DEFAULT_SERVER_TIMING_ENTRY)]
//         transferSize = 0
//         workerStart = 0
//         toJSON() {
//             throw new Error("Method not implemented.")
//         }
//         duration = 0
//         entryType = "foo"
//         name = "foo"
//         startTime = 0
//     }
//     const DEFAULT_RESOURCE_TIMING_ENTRY = new TestPerformanceResourceTiming()

//     class UnitTestFetch extends Fetch<
//         FetchConfiguration,
//         FetchTestResultBundle,
//         unknown,
//         unknown
//     > {
//         get resourceURL(): string {
//             throw new Error("Method not mocked.")
//         }
//         updateFetchTestResults(): Promise<void> {
//             throw new Error("Method not mocked.")
//         }
//         onError(): Promise<void> {
//             throw new Error("Method not mocked.")
//         }
//         get beaconData(): unknown {
//             throw new Error("Method not mocked.")
//         }
//         get beaconURL(): string {
//             throw new Error("Method not mocked.")
//         }
//         testSetup(): Promise<void> {
//             throw new Error("Method not mocked.")
//         }
//         onSendBeaconResolved(): void {
//             // Do nothing
//         }
//         onSendBeaconRejected(): void {
//             // Do nothing
//         }
//     }

//     class UnitTestBeaconHandler extends BeaconHandler<unknown> {
//         constructor(private _expectedResult: unknown) {
//             super()
//         }
//         makeSendResult(): unknown {
//             return this._expectedResult
//         }
//     }

//     interface FetchTestConfig extends TestCaseConfig {
//         fetchConfig: FetchConfiguration
//         testResultBundle: FetchTestResultBundle
//         beaconHandler: UnitTestBeaconHandler
//     }

//     const DEFAULT_FETCH_CONFIG: FetchConfiguration = {}

//     describe("execute", () => {
//         interface SetTimeoutOptions {
//             timeout: number
//         }

//         interface TestConfig extends FetchTestConfig {
//             expectedResult: Record<string, unknown>
//             /**
//              * If missing, then the asyncGetEntry Promise will be rejected
//              */
//             asyncGetEntryResponse?: PerformanceResourceTiming
//             fetchObjectProperties: PropertyDescriptorMap
//             setTimeoutOptions?: SetTimeoutOptions
//             preventClearTimeout: boolean
//             window: unknown
//         }

//         const DEFAULT_FETCH_OBJECT_PROPERTIES: PropertyDescriptorMap = {
//             resourceURL: {
//                 value: "some resource URL",
//             },
//             beaconURL: {
//                 value: "some beacon URL",
//             },
//             beaconData: {
//                 value: {
//                     foo: "bar",
//                 },
//             },
//             _results: {
//                 value: {
//                     a: 123,
//                 },
//             },
//         }

//         const DEFAULT_TEST_CONFIG: TestConfig = {
//             description: "Successful fetch",
//             fetchConfig: Object.assign({}, DEFAULT_FETCH_CONFIG),
//             testResultBundle: {},
//             beaconHandler: new UnitTestBeaconHandler({ a: 0 }),
//             expectedResult: { a: 123 },
//             fetchObjectProperties: Object.assign(
//                 {},
//                 DEFAULT_FETCH_OBJECT_PROPERTIES,
//             ),
//             preventClearTimeout: false,
//             window: {},
//         }

//         const tests: Array<TestConfig> = [
//             Object.assign({}, DEFAULT_TEST_CONFIG, {
//                 asyncGetEntryResponse: { foo: "bar" },
//             }),
//             Object.assign({}, DEFAULT_TEST_CONFIG, {
//                 description: "Fail to find Resource Timing entry",
//             }),
//             Object.assign({}, DEFAULT_TEST_CONFIG, {
//                 description: "Has custom request headers",
//                 asyncGetEntryResponse: { foo: "bar" },
//                 fetchObjectProperties: Object.assign(
//                     {},
//                     DEFAULT_FETCH_OBJECT_PROPERTIES,
//                     {
//                         resourceRequestHeaders: {
//                             value: {
//                                 a: "foo",
//                                 b: "bar",
//                             },
//                         },
//                     },
//                 ),
//             }),
//             Object.assign({}, DEFAULT_TEST_CONFIG, {
//                 description: makeDescription(
//                     "Config includes 10 second timeout",
//                     "prevent clearTimeout from running",
//                 ),
//                 fetchConfig: Object.assign({}, DEFAULT_FETCH_CONFIG, {
//                     timeout: 10000,
//                 }),
//                 setTimeoutOptions: {
//                     timeout: 10000,
//                 },
//                 preventClearTimeout: true,
//                 expectedResult: {
//                     a: 123,
//                     timeoutTriggered: true,
//                 },
//             }),
//         ]

//         tests.forEach((i) => {
//             test(i.description, async () => {
//                 const sut = new UnitTestFetch(
//                     {
//                         window: i.window as Window & typeof globalThis,
//                     },
//                     i.fetchConfig,
//                     i.testResultBundle,
//                     i.beaconHandler,
//                 )
//                 sut.testSetup = () => Promise.resolve()
//                 sut.testTearDown = () => {
//                     return Promise.resolve()
//                 }
//                 Object.defineProperties(sut, i.fetchObjectProperties)
//                 if (i.asyncGetEntryResponse) {
//                     asyncGetEntryMock.mockResolvedValueOnce(
//                         i.asyncGetEntryResponse,
//                     )
//                 } else {
//                     asyncGetEntryMock.mockRejectedValueOnce(new Error("Foo"))
//                 }
//                 sut.updateFetchTestResults = jest
//                     .fn()
//                     .mockResolvedValueOnce(undefined)
//                 sut.onError = () => {
//                     return Promise.resolve()
//                 }
//                 if (i.preventClearTimeout) {
//                     sut.clearTimeout = jest.fn()
//                 }

//                 // Spies used to verify parts of the fetch timeout mechanism
//                 const setTimeoutId = jest.spyOn(sut, "setTimeoutId")
//                 const setTimeout = jest.spyOn(window, "setTimeout")

//                 // Code under test
//                 const result = await sut.execute()
//                 jest.runAllTimers()

//                 // Verify
//                 expect(result).toStrictEqual(i.expectedResult)
//                 if (i.setTimeoutOptions) {
//                     expect(setTimeoutId).toHaveBeenCalled()
//                     expect(setTimeout).toHaveBeenLastCalledWith(
//                         expect.any(Function),
//                         i.setTimeoutOptions.timeout,
//                     )
//                 } else {
//                     expect(setTimeoutId).not.toHaveBeenCalled()
//                 }
//             })
//         })
//     })
//     describe("makeValidateResourceTimingEntryFunc", () => {
//         interface TestConfig extends FetchTestConfig {
//             entry: PerformanceResourceTiming
//             expectedResult: boolean
//             window: unknown
//         }
//         const tests: Array<TestConfig> = [
//             {
//                 description: "Default",
//                 fetchConfig: Object.assign({}, DEFAULT_FETCH_CONFIG),
//                 testResultBundle: {},
//                 beaconHandler: new UnitTestBeaconHandler({ a: 0 }),
//                 entry: Object.assign({}, DEFAULT_RESOURCE_TIMING_ENTRY, {
//                     connectStart: 1,
//                     connectEnd: 2,
//                     requestStart: 3,
//                 }),
//                 window: {},
//                 expectedResult: true,
//             },
//             {
//                 description: "connect time must be non-zero",
//                 fetchConfig: Object.assign({}, DEFAULT_FETCH_CONFIG),
//                 testResultBundle: {},
//                 beaconHandler: new UnitTestBeaconHandler({ a: 0 }),
//                 entry: Object.assign({}, DEFAULT_RESOURCE_TIMING_ENTRY, {
//                     connectStart: 2,
//                     connectEnd: 2,
//                     requestStart: 3,
//                 }),
//                 window: {},
//                 expectedResult: false,
//             },
//             {
//                 description: "request start must be non-zero",
//                 fetchConfig: Object.assign({}, DEFAULT_FETCH_CONFIG),
//                 testResultBundle: {},
//                 beaconHandler: new UnitTestBeaconHandler({ a: 0 }),
//                 entry: Object.assign({}, DEFAULT_RESOURCE_TIMING_ENTRY, {
//                     connectStart: 1,
//                     connectEnd: 2,
//                     requestStart: 0,
//                 }),
//                 window: {},
//                 expectedResult: false,
//             },
//         ]
//         tests.forEach((i) => {
//             test(i.description, () => {
//                 const sut = new UnitTestFetch(
//                     {
//                         window: i.window as Window & typeof globalThis,
//                     },
//                     i.fetchConfig,
//                     i.testResultBundle,
//                     i.beaconHandler,
//                 )
//                 const callback = sut.makeValidateResourceTimingEntryFunc()
//                 expect(callback(i.entry)).toBe(i.expectedResult)
//             })
//         })
//     })
// })
