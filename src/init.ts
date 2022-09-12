import { SessionResult, SessionStartupFuncs } from "./@types"
import { start, startLater } from "./lib/start"
import { loadWhenReady } from "./lib/whenDocumentReady"

/**
 * Called by tag owner code to initialize a RUM session, either immediately or
 * after some delay.
 *
 * @remarks
 * Waits for the page to load before processing.
 *
 * @param settings Specifies settings affecting client behavior. These are
 * determined by the tag owner at runtime, so may be used to specify page-level
 * overrides to general defaults.
 */
export function init(
    document: Document,
    sessionConfigDelay: number,
    sessionStartupFuncs: SessionStartupFuncs[],
): Promise<SessionResult> {
    return loadWhenReady(document).then(() => {
        if (sessionConfigDelay) {
            return startLater(sessionConfigDelay, sessionStartupFuncs)
        }
        return start(sessionStartupFuncs)
    })
}
