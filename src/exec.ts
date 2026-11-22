import { execFile } from "node:child_process"
import { promisify } from "node:util"

/** Run a command with only `env` and return its stdout, or throw `failure` with its stderr. */
export const execText = async (
  command: string,
  args: string[],
  env: Record<string, string>,
  failure: string,
): Promise<string> => {
  try {
    return (
      await promisify(execFile)(command, args, {
        env,
        maxBuffer: Infinity,
      })
    ).stdout
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr ?? String(error)
    throw new Error(`${failure}: ${stderr.trim()}`)
  }
}
