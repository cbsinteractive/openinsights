import { ClientSettings, SessionResult } from "./@types"
import { start, startLater } from "./lib/start"
import whenReady from "./util/loadWhenDocumentReady"

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
export default function init(settings: ClientSettings): Promise<SessionResult> {
    return whenReady().then(() => {
        if (settings.preConfigStartDelay) {
            return startLater(settings.preConfigStartDelay, settings)
        }
        return start(settings)
    })
}
