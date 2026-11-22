import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { expect, test } from "vite-plus/test"
import { join } from "node:path"

import $ from "dax"
import { execText } from "../src/exec.ts"

import { missingCommits, planAgent } from "./dc_tui.ts"

test("missingCommits lists commits the previous post skipped before the new range", async () => {
  const appRoot = fileURLToPath(new URL("../", import.meta.url))
  await mkdir(join(appRoot, "dist"), { recursive: true })
  const root = await mkdtemp(join(join(appRoot, "dist"), "changelog-"))
  const repo = join(root, "repo")
  const outputDir = join(root, "out")
  const env: Record<string, string> = {
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: "/dev/null",
  }
  const path = process.env["PATH"]
  if (path) env.PATH = path
  const git = async (args: string[], date?: string): Promise<string> =>
    (
      await execText(
        "git",
        ["-C", repo, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.test", ...args],
        date ? { ...env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } : env,
        "git failed",
      )
    ).trim()
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
    return (
      result && {
        since: result.since,
        subjects: result.commits.map((line) => line.split(" ").slice(2).join(" ")),
        covered: result.covered.map((hash) => hash.slice(0, 7)),
      }
    )
  }

  try {
    await mkdir(repo)
    await git(["-c", "init.templateDir=", "init"])
    await commit("before previous post", 4)
    const earlier = await commit("earlier day", 6)
    const linked = await commit("in previous post (#1)", 8, 8)
    await commit("after previous post ran (#2)", 8, 20)
    await commit("between posts", 10)
    await commit("in new post", 12)
    const previous = join(outputDir, "2026-01-05_to_2026-01-08")
    await mkdir(previous, { recursive: true })
    await mkdir(join(outputDir, "2026-01-12_to_2026-01-13"))
    // A dry run leaves an empty post folder; it is not a post.
    await mkdir(join(outputDir, "2026-01-09_to_2026-01-11"))
    await writeFile(join(previous, "changelog.txt"), "## [a](https://github.com/o/r/pull/1)\n")
    const expected = {
      since: "2026-01-08",
      subjects: ["between posts", "after previous post ran (#2)"],
      covered: [linked.slice(0, 7)],
    }

    // commits.txt skips the 20:00 commit on 2026-01-08, so it is missing.
    await writeFile(join(previous, "commits.txt"), `${earlier}\n${linked}\n`)
    expect(await missing()).toEqual(expected)

    // Without commits.txt, earlier days count as covered, and on 2026-01-08 only the commit of linked PR #1.
    await rm(join(previous, "commits.txt"))
    expect(await missing()).toEqual(expected)
  } finally {
    await $`gio trash ${root}`
  }
})

test("planAgent picks Opus for Claude Max 10x and up, Sonnet for Max 5x, Codex otherwise", () => {
  expect(planAgent("default_claude_max_20x")).toEqual({
    agent: "claude",
    model: "claude-opus-5-5",
  })
  expect(planAgent("default_claude_max_10x").model).toEqual("claude-opus-5-5")
  expect(planAgent("default_claude_max_5x")).toEqual({
    agent: "claude",
    model: "claude-sonnet-5-5",
  })
  for (const tier of ["default_claude_pro", "default_claude_ai", undefined]) {
    expect(planAgent(tier)).toEqual({ agent: "pi" })
  }
})
