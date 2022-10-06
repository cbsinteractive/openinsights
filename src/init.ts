import { SessionResult, SessionStartupFuncs } from "./@types"
import { start, startLater } from "./lib/start"
import { loadWhenReady } from "./lib/whenDocumentReady"

/**
 * Called by tag owner code to initialize a RUM session, either immediately or
 * after some delay.
 *
 * @remarks
 * Waits for the page to load before processing.
 */
export function init(
    getDocumentReadyState: () => DocumentReadyState,
    addDocumentReadyStateChangeListener: (callback: () => void) => void,
    sessionConfigDelayInMilliseconds: number,
    sessionStartupFuncs: SessionStartupFuncs[],
): Promise<SessionResult> {
    return loadWhenReady(
        getDocumentReadyState,
        addDocumentReadyStateChangeListener,
    ).then(() => {
        if (sessionConfigDelayInMilliseconds > 0) {
            return startLater(
                sessionConfigDelayInMilliseconds,
                sessionStartupFuncs,
            )
        }
        return start(sessionStartupFuncs)
    })
}
