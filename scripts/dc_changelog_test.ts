import { assertEquals, assertStringIncludes } from "@std/assert"
import { fromFileUrl, join } from "@std/path"

Deno.test("weekly CLI selects and titles commits by local integration dates", async () => {
  const appRoot = fromFileUrl(new URL("../", import.meta.url))
  await Deno.mkdir(join(appRoot, "dist"), { recursive: true })
  const repo = await Deno.makeTempDir({ dir: join(appRoot, "dist") })
  const env: Record<string, string> = {
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: "/dev/null",
  }
  for (const key of ["PATH", "HOME", "DENO_DIR", "XDG_CACHE_HOME"]) {
    const value = Deno.env.get(key)
    if (value) env[key] = value
  }
  const git = async (args: string[], dates: Record<string, string> = {}) => {
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
      env: { ...env, ...dates },
      stdout: "piped",
      stderr: "piped",
    }).output()
    assertEquals(result.success, true, new TextDecoder().decode(result.stderr))
  }
  const date = (day: number, hour = 0, minute = 0, second = 0): string =>
    new Date(2026, 0, day, hour, minute, second).toISOString()

  try {
    await git(["-c", "init.templateDir=", "init"])
    for (
      const [subject, committed, authored] of [
        ["previous week", date(4, 23, 59, 59), date(5)],
        ["monday midnight", date(5), date(4)],
        ["monday morning", date(5, 8), date(5, 8)],
        ["sunday night", date(11, 23, 59, 59), date(12)],
        ["next week", date(12), date(11)],
      ]
    ) {
      await git(["commit", "--allow-empty", "-m", `fix: ${subject}`], {
        GIT_AUTHOR_DATE: authored,
        GIT_COMMITTER_DATE: committed,
      })
    }
    const result = await new Deno.Command(Deno.execPath(), {
      args: [
        "run",
        "--allow-read",
        "--allow-run=git",
        "--allow-env=GH_TOKEN,GITHUB_TOKEN,PATH,HOME,XDG_CONFIG_HOME",
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
      ],
      cwd: appRoot,
      clearEnv: true,
      env,
      stdout: "piped",
      stderr: "piped",
    }).output()
    assertEquals(result.success, true, new TextDecoder().decode(result.stderr))
    const text = new TextDecoder().decode(result.stdout)
    assertStringIncludes(text, "밝밤) 1월 5일 ~ 1월 11일 패치")
    assertStringIncludes(text, "## monday midnight")
    assertStringIncludes(text, "## monday morning")
    assertStringIncludes(text, "## sunday night")
    assertEquals(text.includes("previous week"), false)
    assertEquals(text.includes("next week"), false)
  } finally {
    const result = await new Deno.Command("gio", {
      args: ["trash", repo],
      stdout: "null",
      stderr: "piped",
    }).output()
    assertEquals(result.success, true, new TextDecoder().decode(result.stderr))
  }
})
