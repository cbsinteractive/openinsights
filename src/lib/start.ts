import { Executable, SessionResult, SessionStartupFuncs } from "../@types"
import { defaultSessionProcessFunc } from "./defaultSessionProcessFunc"

/**
 * Called internally if a non-zero {@link ClientSettings.preConfigStartDelay}
 * setting has been specified. Calls {@link start} after the delay.
 *
 * @param sessionConfigDelay The approximate time to wait (in milliseconds).
 * @param settings The settings object passed to {@link init}.
 */
export function startLater(
    sessionConfigDelay: number,
    sessionStartupFuncs: SessionStartupFuncs[],
): Promise<SessionResult> {
    return new Promise((resolve) => {
        setTimeout(() => {
            start(sessionStartupFuncs).then((result) => resolve(result))
        }, sessionConfigDelay)
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
