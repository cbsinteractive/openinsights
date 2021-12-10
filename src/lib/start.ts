import { ClientSettings, Executable, SessionResult } from "../@types"
import defaultSessionProcessFunc from "../util/defaultSessionProcessFunc"

/**
 * Called internally if a non-zero {@link ClientSettings.preConfigStartDelay}
 * setting has been specified. Calls {@link start} after the delay.
 *
 * @param delay The approximate time to wait (in milliseconds).
 * @param settings The settings object passed to {@link init}.
 */
export function startLater(
    delay: number,
    settings: ClientSettings,
): Promise<SessionResult> {
    return new Promise((resolve) => {
        setTimeout(() => {
            start(settings).then((result) => resolve(result))
        }, delay)
    })
}

/**
 * Called immediately by {@link init} if no
 * {@link ClientSettings.preConfigStartDelay} setting has been specified.
 *
 * @param settings The settings object passed to {@link init}.
 */
export function start(settings: ClientSettings): Promise<SessionResult> {
    const activeProviders = settings.providers.filter((p) => p.shouldRun())
    if (!activeProviders.length) {
        return Promise.resolve({ testResults: [] })
    }
    // We can't use Promise.allSettled() below due to browser support.
    // Therefore, we implement it manually via p.then().catch() to collect all
    // results regardless of their resolution status. I.e. we polyfill.
    return Promise.all(
        activeProviders
            .map((provider) => provider.fetchSessionConfig())
            .map((p) =>
                p
                    .then((value) => ({
                        status: "fulfilled",
                        value,
                    }))
                    .catch((reason) => ({
                        status: "rejected",
                        reason,
                    })),
            ),
    ).then((settled) => {
        const executables: Executable[] = []
        settled.forEach((result, idx) => {
            if (result.status === "fulfilled" && "value" in result) {
                const provider = activeProviders[idx]
                provider.setSessionConfig(result.value)
                executables.push(...provider.expandTasks())
            }
        })
        const process = settings.sessionProcess || defaultSessionProcessFunc
        return process(executables)
    })
}
