import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { expect, test } from "vite-plus/test"
import { join } from "node:path"

import $ from "dax"
import { execText } from "../src/exec.ts"

const appRoot = fileURLToPath(new URL("../", import.meta.url))
const env: Record<string, string> = {
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_CONFIG_GLOBAL: "/dev/null",
}
for (const key of ["PATH", "HOME", "XDG_CACHE_HOME"]) {
  const value = process.env[key]
  if (value) env[key] = value
}

const withRepo = async (
  run: (
    repo: string,
    git: (args: string[], dates?: Record<string, string>) => Promise<string>,
  ) => Promise<void>,
): Promise<void> => {
  await mkdir(join(appRoot, "dist"), { recursive: true })
  const repo = await mkdtemp(join(join(appRoot, "dist"), "changelog-"))
  const git = (args: string[], dates: Record<string, string> = {}): Promise<string> =>
    execText(
      "git",
      ["-C", repo, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.test", ...args],
      { ...env, ...dates },
      "git failed",
    )
  try {
    await git(["-c", "init.templateDir=", "init"])
    await run(repo, git)
  } finally {
    await $`gio trash ${repo}`
  }
}

test("weekly CLI selects and titles commits by local integration dates and skips excluded hashes but records them", async () => {
  const date = (day: number, hour = 0, minute = 0, second = 0): string =>
    new Date(2026, 0, day, hour, minute, second).toISOString()

  await withRepo(async (repo, git) => {
    for (const [subject, committed, authored] of [
      ["previous week", date(4, 23, 59, 59), date(5)],
      ["monday midnight", date(5), date(4)],
      ["monday morning", date(5, 8), date(5, 8)],
      ["sunday night", date(11, 23, 59, 59), date(12)],
      ["next week", date(12), date(11)],
    ]) {
      await git(["commit", "--allow-empty", "-m", `fix: ${subject}`], {
        GIT_AUTHOR_DATE: authored,
        GIT_COMMITTER_DATE: committed,
      })
    }
    // Exclude "monday morning" by its full hash.
    const exclude = join(repo, "exclude.txt")
    await writeFile(exclude, await git(["rev-parse", "HEAD~2"]))
    const text = await execText(
      process.execPath,
      [
        join(appRoot, "scripts/dc_changelog.ts"),
        "--repo",
        repo,
        "--since",
        "2026-01-05",
        "--until",
        "2026-01-12",
        "--mode",
        "draft",
        "--repo-slug",
        "fixture/repo",
        "--exclude-commits",
        exclude,
        "--commits-output",
        join(repo, "commits.txt"),
      ],
      env,
      "dc_changelog failed",
    )
    expect(text).toContain("밝밤) 1월 5일 ~ 1월 11일 패치")
    expect(text).toContain("## monday midnight")
    expect(text.includes("monday morning")).toEqual(false)
    // The next post must not add "monday morning" again.
    const recorded = await readFile(join(repo, "commits.txt"), "utf8")
    expect(recorded).toContain(await readFile(exclude, "utf8"))
    expect(text).toContain("## sunday night")
    expect(text.includes("previous week")).toEqual(false)
    expect(text.includes("next week")).toEqual(false)
  })
})

test("links a commit whose subject ends in an issue number to the PR that holds the commit", async () => {
  await withRepo(async (repo, git) => {
    await git(["commit", "--allow-empty", "-m", "fix: rebase-merged (#11005)"])
    const merged = (await git(["rev-parse", "--short", "HEAD"])).trim()
    await git(["commit", "--allow-empty", "-m", "fix: pushed directly (#11009)"])
    const bin = join(repo, "bin")
    await mkdir(bin)
    await writeFile(
      join(bin, "gh"),
      `#!/bin/sh
case "$*" in
  "pr view 1100"[59]" "*) echo "GraphQL: Could not resolve to a PullRequest with the number of $3." >&2; exit 1 ;;
  "pr view 11007 "*) echo '{"number":11007,"title":"real PR","url":"https://github.com/fixture/repo/pull/11007","body":null,"files":[]}' ;;
  "api repos/fixture/repo/commits/${merged}/pulls "*) echo 11007 ;;
  "api repos/fixture/repo/commits/"*) ;;
  *) echo "unexpected gh $*" >&2; exit 1 ;;
esac
`,
      { mode: 0o755 },
    )
    const text = await execText(
      process.execPath,
      [
        join(appRoot, "scripts/dc_changelog.ts"),
        "--repo",
        repo,
        "HEAD",
        "--repo-slug",
        "fixture/repo",
        "--skip-glossary",
      ],
      { ...env, PATH: `${bin}:${env["PATH"] ?? ""}` },
      "dc_changelog failed",
    )
    expect(text).toContain("PR: #11007 real PR")
    expect(text).toContain("PR evidence: none")
  })
})
