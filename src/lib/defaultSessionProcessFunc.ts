import { Executable } from "../@types"
import sequence from "./promiseSequence"

/**
 * Default session processing function.
 *
 * @remarks
 * See {@link SessionProcessFunc}.
 *
 * @param sessionConfigs Array of {@link Executable} objects from which to
 * generate a Promise<{@link SessionResult}>
 */
export function defaultSessionProcessFunc(executables: Executable[]) {
    const makeTaskExecFunc = (task: Executable) => () => task.execute()
    return sequence(executables.map(makeTaskExecFunc)).then((testResults) => {
        return { testResults }
    })
}
