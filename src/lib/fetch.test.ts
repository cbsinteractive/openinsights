import {
    Dependencies,
    Fetch,
    FetchConfiguration,
    FetchTestResultBundle,
} from "./fetch"

import { deepClone, TestPerformanceResourceTiming } from "../testUtil"

const DEFAULT_FETCH_CONFIG: FetchConfiguration = {
    type: "sometype",
}

class UnitTestFetchTestResultBundle implements FetchTestResultBundle {}

type Foo = {}

type Bar = {}

class UnitTestFetch extends Fetch<
    FetchConfiguration,
    UnitTestFetchTestResultBundle,
    Foo,
    Bar
> {
    constructor(
        deps: Dependencies,
        config: FetchConfiguration,
        testResults: UnitTestFetchTestResultBundle,
        private _resourceURL?: string,
    ) {
        super(deps, config, testResults)
    }

    get resourceURL(): string {
        return this._resourceURL || "foo"
    }
    updateFetchTestResults(
        _response: Response,
        _entry: PerformanceResourceTiming,
    ): Promise<void> {
        throw new Error("Method not implemented.")
    }
    onError(_reason: unknown): Promise<void> {
        throw new Error("Method not implemented.")
    }
    testSetup(): Promise<void> {
        throw new Error("Method not implemented.")
    }
}

const dependencies: Dependencies = {
    clearTimeout: jest.fn(),
    window: {} as Window & typeof globalThis,
}

beforeEach(() => {
    jest.resetAllMocks()
})

describe("test", () => {
    test("Starting small", async () => {
        const config: FetchConfiguration = deepClone(DEFAULT_FETCH_CONFIG)
        const testResults: UnitTestFetchTestResultBundle = {}
        const sut = new UnitTestFetch(dependencies, config, testResults)
        // Code under test
        await sut.test()
    })
})

test("resourceRequestHeaders", () => {
    const config: FetchConfiguration = deepClone(DEFAULT_FETCH_CONFIG)
    const testResults: UnitTestFetchTestResultBundle = {}
    const sut = new UnitTestFetch(dependencies, config, testResults)
    expect(sut.resourceRequestHeaders).toStrictEqual({})
})

describe("makeValidateResourceTimingEntryFunc", () => {
    test("Standard path", () => {
        const config: FetchConfiguration = deepClone(DEFAULT_FETCH_CONFIG)
        const testResults: UnitTestFetchTestResultBundle = {}
        const sut = new UnitTestFetch(
            dependencies,
            config,
            testResults,
        ).makeValidateResourceTimingEntryFunc()
        expect(
            sut(
                new TestPerformanceResourceTiming("foo", {
                    connectStart: 1,
                    connectEnd: 2,
                    requestStart: 3,
                }),
            ),
        ).toBe(true)
    })

    test("connectStart and connectEnd must differ", () => {
        const config: FetchConfiguration = deepClone(DEFAULT_FETCH_CONFIG)
        const testResults: UnitTestFetchTestResultBundle = {}
        const sut = new UnitTestFetch(
            dependencies,
            config,
            testResults,
        ).makeValidateResourceTimingEntryFunc()
        expect(
            sut(
                new TestPerformanceResourceTiming("foo", {
                    connectStart: 1,
                    connectEnd: 1,
                    requestStart: 2,
                }),
            ),
        ).toBe(false)
    })

    test("requestStart must be non-zero", () => {
        const config: FetchConfiguration = deepClone(DEFAULT_FETCH_CONFIG)
        const testResults: UnitTestFetchTestResultBundle = {}
        const sut = new UnitTestFetch(
            dependencies,
            config,
            testResults,
        ).makeValidateResourceTimingEntryFunc()
        expect(
            sut(
                new TestPerformanceResourceTiming("foo", {
                    connectStart: 1,
                    connectEnd: 2,
                    requestStart: 0,
                }),
            ),
        ).toBe(false)
    })
})

describe("outputEventTimeElapsedMessage", () => {
    test("Standard path", () => {
        Fetch.outputEventTimeElapsedMessage(
            "someintervalname",
            new Date("2021-01-01T00:00:00.000Z"),
            new Date("2021-01-01T00:00:01.000Z"),
        )
    })

    test("Has addendum", () => {
        Fetch.outputEventTimeElapsedMessage(
            "someintervalname",
            new Date("2021-01-01T00:00:00.000Z"),
            new Date("2021-01-01T00:00:01.000Z"),
            "someaddendum",
        )
    })

    test("No end timestamp", () => {
        Fetch.outputEventTimeElapsedMessage(
            "someintervalname",
            new Date("2021-01-01T00:00:00.000Z"),
        )
    })

    test("No start timestamp", () => {
        Fetch.outputEventTimeElapsedMessage(
            "someintervalname",
            undefined,
            new Date("2021-01-01T00:00:01.000Z"),
        )
    })
})
