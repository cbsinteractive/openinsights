import { Executable, SessionStartupFuncs } from "../@types"
import { start, startLater } from "./start"

test("start", async () => {
    const sessionStartupFuncs: SessionStartupFuncs = {
        fetchSessionConfiguration: function (): Promise<unknown> {
            return Promise.resolve("some session config")
        },
        produceExecutables: function (
            sessionConfiguration: unknown,
        ): Executable[] {
            return []
        },
    }
    await start([sessionStartupFuncs])
})

test("start later", async () => {
    const sessionStartupFuncs: SessionStartupFuncs = {
        fetchSessionConfiguration: function (): Promise<unknown> {
            return Promise.resolve("some session config")
        },
        produceExecutables: function (
            sessionConfiguration: unknown,
        ): Executable[] {
            return []
        },
    }
    await startLater(100, [sessionStartupFuncs])
})
