import { assertEquals } from "@std/assert"
import { fromFileUrl, join } from "@std/path"

import { missingCommits } from "./dc_tui.ts"

Deno.test("missingCommits lists commits the previous post skipped before the new range", async () => {
  const appRoot = fromFileUrl(new URL("../", import.meta.url))
  await Deno.mkdir(join(appRoot, "dist"), { recursive: true })
  const root = await Deno.makeTempDir({ dir: join(appRoot, "dist") })
  const repo = join(root, "repo")
  const outputDir = join(root, "out")
  const env: Record<string, string> = {
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: "/dev/null",
  }
  const path = Deno.env.get("PATH")
  if (path) env.PATH = path
  const git = async (args: string[], date?: string): Promise<string> => {
    const result = await new Deno.Command("git", {
      args: [
        "-C",
        repo,
        "-c",
        "user.name=Fixture",
        "-c",
        "user.email=fixture@example.test",
        ...args,
      ],
      clearEnv: true,
      env: date
        ? { ...env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date }
        : env,
      stdout: "piped",
      stderr: "piped",
    }).output()
    assertEquals(result.success, true, new TextDecoder().decode(result.stderr))
    return new TextDecoder().decode(result.stdout).trim()
  }
  const commit = async (subject: string, day: number, hour = 12) => {
    const date = new Date(2026, 0, day, hour).toISOString()
    await git(["commit", "--allow-empty", "-m", subject], date)
    return await git(["rev-parse", "--short", "HEAD"])
  }
  const missing = async () => {
    const result = await missingCommits({
      repo,
      outputDir,
      start: "2026-01-12",
    })
    return result && {
      since: result.since,
      subjects: result.commits.map((line) =>
        line.split(" ").slice(2).join(" ")
      ),
      covered: result.covered.map((hash) => hash.slice(0, 7)),
    }
  }

  try {
    await Deno.mkdir(repo)
    await git(["-c", "init.templateDir=", "init"])
    await commit("before previous post", 4)
    const earlier = await commit("earlier day", 6)
    const linked = await commit("in previous post (#1)", 8, 8)
    await commit("after previous post ran (#2)", 8, 20)
    await commit("between posts", 10)
    await commit("in new post", 12)
    const previous = join(outputDir, "2026-01-05_to_2026-01-08")
    await Deno.mkdir(previous, { recursive: true })
    await Deno.mkdir(join(outputDir, "2026-01-12_to_2026-01-13"))
    // A dry run leaves an empty post folder; it is not a post.
    await Deno.mkdir(join(outputDir, "2026-01-09_to_2026-01-11"))
    await Deno.writeTextFile(
      join(previous, "changelog.txt"),
      "## [a](https://github.com/o/r/pull/1)\n",
    )
    const expected = {
      since: "2026-01-08",
      subjects: ["between posts", "after previous post ran (#2)"],
      covered: [linked.slice(0, 7)],
    }

    // commits.txt skips the 20:00 commit on 2026-01-08, so it is missing.
    await Deno.writeTextFile(
      join(previous, "commits.txt"),
      `${earlier}\n${linked}\n`,
    )
    assertEquals(await missing(), expected)

    // Without commits.txt, earlier days count as covered, and on 2026-01-08 only the commit of linked PR #1.
    await Deno.remove(join(previous, "commits.txt"))
    assertEquals(await missing(), expected)
  } finally {
    const result = await new Deno.Command("gio", {
      args: ["trash", root],
      stdout: "null",
      stderr: "piped",
    }).output()
    assertEquals(result.success, true, new TextDecoder().decode(result.stderr))
  }
})
