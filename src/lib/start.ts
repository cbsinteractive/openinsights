import { Executable, SessionResult, SessionStartupFuncs } from "../@types"
import { defaultSessionProcessFunc } from "./defaultSessionProcessFunc"

/**
 * Called internally if a non-zero `sessionConfigDelayInMilliseconds` is passed
 * by the client setting has been specified.
 */
export function startLater(
    sessionConfigDelayInMilliseconds: number,
    sessionStartupFuncs: SessionStartupFuncs[],
): Promise<SessionResult> {
    return new Promise((resolve) => {
        setTimeout(() => {
            start(sessionStartupFuncs).then((result) => resolve(result))
        }, sessionConfigDelayInMilliseconds)
    })
}

export function start(
    sessionStartupFuncs: SessionStartupFuncs[],
): Promise<SessionResult> {
    return Promise.allSettled(
        sessionStartupFuncs.map((funcs) => funcs.fetchSessionConfiguration()),
    ).then((settled) => {
        const executables: Executable[] = []
        settled.forEach((result, idx) => {
            if (result.status === "fulfilled" && "value" in result) {
                executables.push(
                    ...sessionStartupFuncs[idx].produceExecutables(
                        result.value,
                    ),
                )
            }
        })
        const process = defaultSessionProcessFunc
        return process(executables)
    })
}
