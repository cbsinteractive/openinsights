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
    return Promise.allSettled(
        activeProviders.map((provider) => provider.fetchSessionConfig()),
    )
        .then((settled) => {
            // TODO: Note that if any provider's fetchSessionConfig Promise
            // rejects, the reason is silently ignored. We may want to
            // consider preserving this and including it in the final resolved
            // value.
            const executables: Executable[] = []
            settled.forEach((result, idx) => {
                if (result.status === "fulfilled") {
                    const provider = activeProviders[idx]
                    provider.setSessionConfig(result.value)
                    executables.push(...provider.expandTasks())
                }
            })
            const process = settings.sessionProcess || defaultSessionProcessFunc
            return process(executables)
        })
        .catch((reason) => {
            return Promise.resolve({
                initError: reason,
                testResults: [],
            })
        })
}
