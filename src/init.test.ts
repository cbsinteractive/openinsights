import { init } from "./init"
import { start, startLater } from "./lib/start"
import { loadWhenReady } from "./lib/whenDocumentReady"

jest.mock("./lib/whenDocumentReady")
jest.mock("./lib/start")

const tests = [
    {
        description: "run now",
        sessionConfigDelay: 0,
        callsStart: true,
        callsStartLater: false,
    },
    {
        description: "run later",
        sessionConfigDelay: 1,
        callsStart: false,
        callsStartLater: true,
    },
]

beforeEach(() => {
    jest.resetAllMocks()
})

tests.forEach((t) => {
    test(t.description, async () => {
        const mockLoadWhenReady = loadWhenReady as jest.Mock
        mockLoadWhenReady.mockResolvedValue(undefined)
        await init(t.sessionConfigDelay, [])
        if (t.callsStart) {
            expect(start).toHaveBeenCalled()
        } else {
            expect(start).not.toHaveBeenCalled()
        }
        if (t.callsStartLater) {
            expect(startLater).toHaveBeenCalled()
        } else {
            expect(startLater).not.toHaveBeenCalled()
        }
    })
})
