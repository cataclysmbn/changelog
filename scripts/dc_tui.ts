/**
 * @module
 *
 * Interactive DCInside changelog runner.
 *
 * Uses dax prompts to choose a contiguous set of weekly ranges, merges them into one period, generates its
 * prompt in a temp directory, then invokes isolated pi writer/reviewer/translator passes. Final output is
 * one folder with the Korean changelog.txt, changelog.md and changelog.html, and the English changelog.en.* files.
 * Both Markdown posts are then committed to the mdBook books in `book/`, and the GitHub Pages workflow publishes them.
 */

import { Command } from "@cliffy/command"
import $ from "dax"
import {
  access,
  copyFile,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import {
  aiFooter,
  assertPostFormat,
  assertSameLayout,
  reviewPrompt,
  translatePrompt,
  translationGuide,
} from "../src/dcinside.ts"
import { execText } from "../src/exec.ts"
import { mergeRanges, rangesBetween, weeklyRanges, type WeekRange } from "../src/weeks.ts"
import { parsePo, validateTranslationReview, type VerifiedTerm } from "../src/translation.ts"
import { mirrorPost } from "./mirror_images.ts"
import { publishPages } from "./pages.ts"

const scriptDir = dirname(fileURLToPath(import.meta.url))
const appRoot = dirname(scriptDir)
const defaultRepo = resolve(appRoot, "../Cataclysm-BN")
const defaultOutputDir = join(appRoot, "dist")
const defaultGlossaryPo = resolve(appRoot, "../translations/lang/po/ko.po")
const skillPath = join(appRoot, ".agents", "skills", "dcinside-changelog", "SKILL.md")

const parsePositiveInt = (value: string | number): number => {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`Expected a positive integer, got ${value}`)
  }
  return parsed
}

const parseWeekIndex = (value: string | number): number => {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`Expected a week index of 0 or greater, got ${value}`)
  }
  return parsed
}

type Options = {
  weeks: number
  repo: string
  outputDir: string
  maxCommits: number
  agent: "pi" | "claude"
  model?: string
  pi: string
  claude: string
  piTools: string
  dryRun?: boolean
  yes?: boolean
  newest?: number
  oldest?: number
  noReview?: boolean
  allowMissingPrDetails?: boolean
  keepTemp?: boolean
  glossaryPo: string
  skipGlossary?: boolean
}

type PiWorkspace = {
  root: string
  cwd: string
  instructions: string
}

const chooseRange = async (ranges: WeekRange[], options: Options): Promise<WeekRange[]> => {
  if (options.yes) {
    return rangesBetween(ranges, options.newest ?? 0, options.oldest ?? options.newest ?? 0)
  }

  const newest =
    options.newest ??
    (
      await $.select({
        message: "가장 최근 주를 고르세요",
        options: ranges.map((range) => range.label),
      })
    ).index

  const oldestOptions = ranges.filter((range) => range.index >= newest)
  const oldest =
    options.oldest ??
    oldestOptions[
      (
        await $.select({
          message: "어느 과거 주까지 생성할까요",
          options: oldestOptions.map((range) => range.label),
        })
      ).index
    ].index

  return rangesBetween(ranges, newest, oldest)
}

const promptForRunOptions = async (options: Options): Promise<Options> => {
  if (options.yes) return options

  const repo = await $.prompt({
    message: "Cataclysm-BN 저장소 경로",
    default: options.repo,
  })
  const outputDir = await $.prompt({
    message: "출력 디렉터리",
    default: options.outputDir,
  })
  return { ...options, repo, outputDir }
}

const rangeSlug = (range: WeekRange): string => `${range.start}_to_${range.endInclusive}`

/**
 * Commits dated from the newest earlier post (a folder with changelog.txt) up to `start` that it skipped.
 * Read the post's commits.txt. For posts without it, take every day before its last day as covered,
 * and on the last day only the commits whose PR the post links.
 */
export const missingCommits = async ({
  repo,
  outputDir,
  start,
}: {
  repo: string
  outputDir: string
  start: string
}): Promise<{ post: string; since: string; commits: string[]; covered: string[] } | undefined> => {
  const posts: { name: string; start: string; end: string }[] = []
  for (const entry of await readdir(outputDir, { withFileTypes: true })) {
    const match = entry.name.match(/^(\d{4}-\d{2}-\d{2})_to_(\d{4}-\d{2}-\d{2})$/u)
    if (
      entry.isDirectory() &&
      match &&
      match[1] < start &&
      (await access(join(outputDir, entry.name, "changelog.txt")).then(
        () => true,
        () => false,
      ))
    ) {
      posts.push({ name: entry.name, start: match[1], end: match[2] })
    }
  }
  const previous = posts
    .sort((a, b) => `${a.end}${a.start}`.localeCompare(`${b.end}${b.start}`))
    .at(-1)
  if (!previous) return undefined
  const readPost = (file: string) =>
    readFile(join(outputDir, previous.name, file), "utf8").catch(() => undefined)
  const recorded = (await readPost("commits.txt"))?.split("\n").filter(Boolean)
  const linked = new Set(
    [...((await readPost("changelog.txt")) ?? "").matchAll(/\/pull\/(\d+)\)/gu)].map(
      (match) => match[1],
    ),
  )
  const stdout = await execText(
    "git",
    [
      "-C",
      repo,
      "log",
      "--date=format-local:%Y-%m-%d",
      `--since=${previous.start}T00:00:00`,
      "--format=%H%x09%cd%x09%s",
    ],
    {},
    `git log failed in ${repo}`,
  )
  const window = stdout
    .split("\n")
    .filter(Boolean)
    .map((line) => line.split("\t"))
    .filter(([, date]) => date >= previous.start && date < start)
    .map(([hash, date, subject]) => ({
      hash,
      date,
      subject,
      covered: recorded
        ? recorded.some((short) => hash.startsWith(short))
        : date < previous.end ||
          (date === previous.end && linked.has(subject.match(/\(#(\d+)\)$/u)?.[1] ?? "")),
    }))
  const missing = window.filter((commit) => !commit.covered)
  if (missing.length === 0) return undefined
  const since = missing.map((commit) => commit.date).sort()[0]
  return {
    post: previous.name,
    since,
    commits: missing.map(({ hash, date, subject }) => `${hash.slice(0, 10)} ${date} ${subject}`),
    covered: window
      .filter((commit) => commit.covered && commit.date >= since)
      .map((commit) => commit.hash),
  }
}

const buildPrompt = async (
  range: WeekRange,
  options: Options,
  promptFile: string,
  excludeFile: string,
): Promise<void> => {
  const args = [
    process.execPath,
    "scripts/dc_changelog.ts",
    "--repo",
    options.repo,
    "--since",
    range.start,
    "--until",
    range.endExclusive,
    "--max-commits",
    options.maxCommits.toString(),
    "--title",
    range.title,
    "--glossary-po",
    options.glossaryPo,
    "-o",
    promptFile,
    "--commits-output",
    `${promptFile}.commits.txt`,
    "--exclude-commits",
    excludeFile,
  ]
  if (options.allowMissingPrDetails) {
    args.push("--allow-missing-pr-details")
  }
  if (options.skipGlossary) {
    args.push("--skip-glossary")
  }
  await $`${args}`.cwd(appRoot)
}

const writerAgents = `# Changelog Writer Rules

You are a Korean DCInside Cataclysm: Bright Nights changelog writer.

- Output only the final post body. Do not add explanations, prefaces, tool logs, or notifications.
- Write natural Korean for Korean players, not translated developer jargon.
- Use the supplied PR evidence. Never write from commit titles alone.
- Delete internal-only CI, build plumbing, Lua typecheck, refactor, and factory entries unless the player-visible result is clear.
- Merge follow-up/revert pairs into the final player-visible result.
- Follow the post template in the prompt line by line. If an "Image:" URL helps explain an entry, add it to that entry as "![caption](url)". For before/after images, choose per entry between one comparison image line "![](before after ...)" and an image table, as the prompt template describes.
- Prefer concrete words: 실험판, 안정판, 기본 포함 모드, 시작 지점, 스폰, 타일, 줍기, 자동운전.
- Use the supplied Korean PO snippets before choosing Korean game terms:
${translationGuide}
- Ban vague words such as 갱신/정리 unless the same bullet says exactly what changed.
- Match hand-written posts by adding concrete effects, numbers, examples, and conditions.
- Do not run notify or any completion hook.
`

const reviewerAgents = `# Changelog Reviewer Subagent Rules

You are a hostile senior Korean editor for DCInside 밝밤 changelogs.

- Return only the JSON review object requested in the prompt: changelog and terms. Keep the published text inside changelog; list every game name with its exact PO context and the expression used in terms.
- Treat the draft as guilty until proven useful to a Korean player.
- Remove every Korean sentence that sounds like machine translation or developer-only jargon.
- Compare the draft against PR evidence and restore concrete gameplay details.
- Enforce the supplied Korean PO snippets before accepting Korean game terms:
${translationGuide}
- Enforce the post template in the prompt line by line. Add "Image:" URLs that illustrate an entry as "![caption](url)". For before/after images, pick the comparison image line or the image table, whichever shows the change better.
- Delete low-utility internal Lua/CI/refactor/build entries unless the final player-facing effect matters.
- Collapse superseded entries into one final result.
- Reject vague wording such as 갱신/정리/개선 unless the same entry explains exactly what changed.
- Do not run notify or any completion hook.
`

const translatorAgents = `# Changelog Translator Rules

You translate a finished Korean Cataclysm: Bright Nights changelog into English.

- Output only the translated post. Do not add explanations, prefaces, tool logs, or notifications.
- Translate line by line. Do not add, drop, or reorder entries, and do not add facts the Korean post does not state.
- Do not run notify or any completion hook.
`

const roleAgents = {
  writer: writerAgents,
  reviewer: reviewerAgents,
  translator: translatorAgents,
}

const makePiWorkspace = async (role: keyof typeof roleAgents): Promise<PiWorkspace> => {
  const root = await mkdtemp(join(tmpdir(), `dc-changelog-pi-${role}-`))
  const cwd = join(root, "work")
  const instructions = roleAgents[role]
  await mkdir(cwd, { recursive: true })
  await writeFile(join(cwd, "AGENTS.md"), instructions)
  return { root, cwd, instructions }
}

const defaultPiModel = "openai-codex/gpt-6-luna:medium"

/** Claude Max 10x or more writes with Opus, Max 5x with Sonnet, any other plan with Codex through pi. */
export const planAgent = (tier: string | undefined): Pick<Options, "agent" | "model"> => {
  const times = Number(tier?.match(/max_(\d+)x/u)?.[1] ?? 0)
  return times >= 10
    ? { agent: "claude", model: "claude-opus-5-5" }
    : times >= 5
      ? { agent: "claude", model: "claude-sonnet-5-5" }
      : { agent: "pi" }
}

/**
 * Rate limit tier of the logged-in Claude subscription, or nothing without one.
 * `claude auth status` can print a null tier, so fall back to `oauthAccount` in `.claude.json`.
 */
const claudeTier = async (claude: string): Promise<string | undefined> => {
  try {
    const status = JSON.parse(await $`${claude} auth status --json`.stderr("null").text())
    if (!status.loggedIn) return undefined
    if (status.rateLimitTier) return status.rateLimitTier
    const config = join(
      process.env["CLAUDE_CONFIG_DIR"] || process.env["HOME"] || "/",
      ".claude.json",
    )
    const account = JSON.parse(await readFile(config, "utf8")).oauthAccount
    return account?.userRateLimitTier ?? account?.organizationRateLimitTier ?? undefined
  } catch {
    return undefined
  }
}

/** Model name for the post footer, without provider and thinking level. */
const aiModel = ({ agent, model }: Options): string =>
  agent === "claude"
    ? (model ?? "Claude")
    : (model ?? defaultPiModel).split("/").at(-1)!.split(":")[0]

const claudeArgs = (options: Options, workspace: PiWorkspace, skill: string): string[] => {
  const args = [
    options.claude,
    "-p",
    "--no-session-persistence",
    "--permission-mode",
    "dontAsk",
    "--setting-sources",
    "",
    "--strict-mcp-config",
    "--disable-slash-commands",
    "--append-system-prompt",
    `${workspace.instructions}\n\n${skill}`,
  ]
  if (options.model) {
    args.push("--model", options.model)
  }
  if (options.piTools === "none") {
    args.push("--tools", "")
  } else if (options.piTools !== "all") {
    const tools = options.piTools
      .split(",")
      .map((tool) => (tool === "grep" ? "Grep" : tool === "read" ? "Read" : tool))
      .join(",")
    args.push("--tools", tools, "--allowedTools", tools)
  }
  return args
}

const piArgs = (
  options: Options,
  promptFile: string,
  workspace: PiWorkspace,
  skill = "",
): string[] => {
  if (options.agent === "claude") return claudeArgs(options, workspace, skill)
  const args = [
    options.pi,
    "--no-session",
    "--approve",
    "--no-extensions",
    "--no-prompt-templates",
    "--no-themes",
    "--no-context-files",
    "--no-skills",
    "--skill",
    skillPath,
    "--append-system-prompt",
    workspace.instructions,
    "--model",
    options.model ?? defaultPiModel,
  ]
  if (options.piTools === "none") {
    args.push("--no-tools")
  } else if (options.piTools !== "all") {
    args.push("--tools", options.piTools)
  }
  args.push("-p", `@${promptFile}`)
  return args
}

const runPiText = async (
  options: Options,
  promptFile: string,
  workspace: PiWorkspace,
): Promise<string> => {
  const skill = options.agent === "claude" ? await readFile(skillPath, "utf8") : ""
  const args = piArgs(options, promptFile, workspace, skill)
  const command = $`${args}`.cwd(workspace.cwd).stdout("piped").stderr("piped").noThrow()
  const result = await (options.agent === "claude"
    ? command.stdinText(await readFile(promptFile, "utf8"))
    : command.stdin("null"))
  if (result.code !== 0) {
    throw new Error(`${args.join(" ")} failed: ${result.stderr.trim()}`)
  }
  return result.stdout
}

const generateWithPi = async (
  range: WeekRange,
  options: Options,
  promptFile: string,
): Promise<string> => {
  const workspace = await makePiWorkspace("writer")
  try {
    if (options.dryRun) {
      $.logStep("dry-run", `${range.label} prompt: ${promptFile}`)
      $.logStep("dry-run", `cwd: ${workspace.cwd}`)
      $.logStep("dry-run", piArgs(options, promptFile, workspace).join(" "))
      return ""
    }

    $.logStep("pi writer", range.label)
    return await runPiText(options, promptFile, workspace)
  } finally {
    if (!options.keepTemp && !options.dryRun) {
      await rm(workspace.root, { recursive: true })
    }
  }
}

export const reviewWithPi = async (
  range: WeekRange,
  options: Options,
  sourcePrompt: string,
  draft: string,
  reviewPromptFile: string,
): Promise<{
  changelog: string
  audit?: { poFile: string; poSha256: string; terms: VerifiedTerm[] }
}> => {
  if (options.noReview) return { changelog: draft }

  await writeFile(
    reviewPromptFile,
    reviewPrompt({
      draft,
      sourcePrompt,
      title: range.title,
      glossaryPo: resolve(options.glossaryPo),
    }),
  )

  const workspace = await makePiWorkspace("reviewer")
  try {
    if (options.dryRun) {
      $.logStep("dry-run", `${range.label} reviewer prompt: ${reviewPromptFile}`)
      $.logStep("dry-run", `reviewer cwd: ${workspace.cwd}`)
      $.logStep("dry-run", piArgs(options, reviewPromptFile, workspace).join(" "))
      return { changelog: draft }
    }

    $.logStep("pi reviewer", range.label)
    const poFile = resolve(options.glossaryPo)
    const poText = await readFile(poFile, "utf8")
    const entries = parsePo(poText)
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await runPiText(options, reviewPromptFile, workspace)
      await writeFile(`${reviewPromptFile}.response.json`, response)
      try {
        const { changelog, terms } = validateTranslationReview(response, entries)
        assertPostFormat(changelog, sourcePrompt)
        return {
          changelog,
          audit: { poFile, poSha256: await sha256(poText), terms },
        }
      } catch (error) {
        if (attempt === 1) throw error
        const reason = error instanceof Error ? error.message : String(error)
        $.logStep("review correction", reason)
        await writeFile(
          reviewPromptFile,
          `${await readFile(reviewPromptFile, "utf8")}\n\n# 프로그램 대조 실패\n${reason}\n이전 응답을 실제 PO와 다시 대조해 본문과 terms를 고치고, 완전한 JSON 객체를 반환하세요.\n\n# 이전 응답\n${response}\n`,
        )
      }
    }
    throw new Error("PO 검수를 완료하지 못했습니다")
  } finally {
    if (!options.keepTemp && !options.dryRun) {
      await rm(workspace.root, { recursive: true })
    }
  }
}

/** English copy of the reviewed Korean post, with the same lines, links and images. */
const translateWithPi = async (
  range: WeekRange,
  options: Options,
  { changelog, terms }: { changelog: string; terms: VerifiedTerm[] },
  promptFile: string,
): Promise<string> => {
  await writeFile(
    promptFile,
    translatePrompt({
      post: changelog,
      title: `Bright Nights changelog: ${range.start} ~ ${range.endInclusive}`,
      terms,
    }),
  )
  const workspace = await makePiWorkspace("translator")
  try {
    $.logStep("pi translator", range.label)
    for (let attempt = 0; attempt < 2; attempt++) {
      const english = `${(await runPiText(options, promptFile, workspace)).trim()}\n`
      try {
        assertSameLayout(changelog, english)
        return english
      } catch (error) {
        if (attempt === 1) throw error
        const reason = error instanceof Error ? error.message : String(error)
        $.logStep("translation correction", reason)
        await writeFile(
          promptFile,
          `${await readFile(promptFile, "utf8")}\n\n# Program check failed\n${reason}\nFix the previous translation and return the whole post.\n\n# Previous translation\n${english}`,
        )
      }
    }
    throw new Error("영문 번역을 완료하지 못했습니다")
  } finally {
    if (!options.keepTemp) {
      await rm(workspace.root, { recursive: true })
    }
  }
}

const sha256 = async (text: string): Promise<string> =>
  Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")

const run = async (options: Options): Promise<void> => {
  const ranges = weeklyRanges(new Date(), options.weeks)
  const selected = await chooseRange(ranges, options)
  if (selected.length === 0) {
    throw new Error("No weekly ranges selected")
  }
  const weeks = mergeRanges(selected)

  const runOptions = await promptForRunOptions(options)
  const missing = await missingCommits({
    repo: runOptions.repo,
    outputDir: resolve(runOptions.outputDir),
    start: weeks.start,
  }).catch((error) =>
    (error as NodeJS.ErrnoException).code === "ENOENT" ? undefined : Promise.reject(error),
  )
  const range = missing ? mergeRanges([weeks, { ...weeks, start: missing.since }]) : weeks
  if (missing) {
    $.logStep(
      "지난 글에서 빠진 커밋 포함",
      `${missing.post}: ${missing.commits.length}개\n${missing.commits.join("\n")}`,
    )
  }
  if (!runOptions.yes) {
    const confirmed = await $.confirm({
      message: `${range.label} 패치글을 pi로 생성할까요?`,
      default: true,
    })
    if (!confirmed) return
  }

  const outputDir = resolve(runOptions.outputDir)
  await mkdir(outputDir, { recursive: true })
  const tempDir = await mkdtemp(join(tmpdir(), "dc-changelog-prompts-"))
  let failed = false

  try {
    const slug = rangeSlug(range)
    const postDir = join(outputDir, slug)
    await mkdir(postDir, { recursive: true })

    const promptFile = join(tempDir, `${slug}.prompt.md`)
    const reviewerPromptFile = join(tempDir, `${slug}.review.prompt.md`)
    const outputFile = join(postDir, "changelog.txt")
    const excludeFile = `${promptFile}.exclude.txt`
    await writeFile(excludeFile, (missing?.covered ?? []).map((hash) => `${hash}\n`).join(""))
    await buildPrompt(
      range,
      {
        ...runOptions,
        maxCommits: runOptions.maxCommits * selected.length + (missing?.commits.length ?? 0),
      },
      promptFile,
      excludeFile,
    )
    const sourcePrompt = await readFile(promptFile, "utf8")
    const draft = await generateWithPi(range, runOptions, promptFile)
    const review = await reviewWithPi(range, runOptions, sourcePrompt, draft, reviewerPromptFile)
    const changelog = `${review.changelog.trimEnd()}\n`
    if (!runOptions.dryRun) {
      assertPostFormat(changelog, sourcePrompt)
      const korean = await mirrorPost(changelog, {
        footer: aiFooter(aiModel(runOptions)),
      })
      if (review.audit) {
        const reviewDir = join(outputDir, ".reviews")
        await mkdir(reviewDir, { recursive: true })
        await writeFile(
          join(reviewDir, `${slug}.json`),
          JSON.stringify(
            {
              ...review.audit,
              changelogSha256: await sha256(changelog),
            },
            null,
            2,
          ) + "\n",
        )
      }
      await writeFile(outputFile, changelog)
      await copyFile(`${promptFile}.commits.txt`, join(postDir, "commits.txt"))
      await writeFile(join(postDir, "changelog.md"), korean.markdown)
      await writeFile(join(postDir, "changelog.html"), korean.html)
      $.logStep("wrote", join(postDir, "changelog.html"))
      // The Korean post is saved first so a failed translation keeps it.
      const english = await translateWithPi(
        range,
        runOptions,
        { changelog, terms: review.audit?.terms ?? [] },
        join(tempDir, `${slug}.translate.prompt.md`),
      )
      await writeFile(join(postDir, "changelog.en.txt"), english)
      const translated = await mirrorPost(english, {
        footer: aiFooter(aiModel(runOptions), true),
      })
      await writeFile(join(postDir, "changelog.en.md"), translated.markdown)
      await writeFile(join(postDir, "changelog.en.html"), translated.html)
      $.logStep("wrote", join(postDir, "changelog.en.html"))
      $.logStep("published", (await publishPages([postDir]))[0])
    }
  } catch (error) {
    failed = true
    $.logStep("failed", `검수 입력과 응답 보존: ${tempDir}`)
    throw error
  } finally {
    if (!failed && !runOptions.keepTemp && !runOptions.dryRun) {
      await rm(tempDir, { recursive: true })
    }
  }
}

const main = new Command()
  .name("dc-tui")
  .version("0.1.0")
  .description(
    "Choose a range of Cataclysm-BN weeks and generate one DCInside changelog with isolated pi writer/reviewer passes.",
  )
  .option("--weeks <count:string>", "Number of weekly ranges to list", {
    default: 12,
    value: parsePositiveInt,
  })
  .option("-r, --repo <path:string>", "Cataclysm-BN repository path", {
    default: defaultRepo,
  })
  .option("-o, --output-dir <path:string>", "Directory for generated post folders", {
    default: defaultOutputDir,
  })
  .option("--max-commits <count:string>", "Maximum commits per selected week", {
    default: 180,
    value: parsePositiveInt,
  })
  .option(
    "--agent <agent:string>",
    "Agent CLI to run: pi or claude (default: picked from the Claude plan)",
    {
      value: (value: string) => {
        if (value !== "pi" && value !== "claude") {
          throw new Error(`Expected pi or claude, got ${value}`)
        }
        return value
      },
    },
  )
  .option("--model <model:string>", "Optional agent model argument")
  .option("--pi <command:string>", "pi executable", { default: "pi" })
  .option("--claude <command:string>", "claude executable", {
    default: "claude",
  })
  .option(
    "--pi-tools <tools:string>",
    "Agent tools (read,grep), 'all' to leave enabled, or 'none' to disable",
    { default: "read,grep" },
  )
  .option("--newest <index:string>", "Newest week index, where 0 is this week", {
    value: parseWeekIndex,
  })
  .option("--oldest <index:string>", "Oldest week index, where 0 is this week", {
    value: parseWeekIndex,
  })
  .option("--dry-run", "Generate prompts and print isolated pi commands without running pi")
  .option("--no-review", "Skip the separate senior-editor reviewer pi pass", {
    default: false,
  })
  .option(
    "--allow-missing-pr-details",
    "Keep going when gh PR lookup fails and mark missing evidence in the prompt",
    { default: false },
  )
  .option("--keep-temp", "Keep temp prompt and isolated pi workspaces for debugging", {
    default: false,
  })
  .option("--glossary-po <file:string>", "Korean gettext PO file for term snippets", {
    default: defaultGlossaryPo,
  })
  .option("--skip-glossary", "Do not include Korean PO term snippets", {
    default: false,
  })
  .option("-y, --yes", "Use provided/default options without prompts")
  .example("interactive", "vp run tui")
  .example("generate current week", "vp run tui --newest 0 --oldest 0")
  .example("dry-run current week", "vp run tui --yes --dry-run --newest 0 --oldest 0")
  .action(async (rawOptions) => {
    const plan =
      rawOptions.agent || rawOptions.model
        ? { agent: rawOptions.agent ?? "pi" }
        : planAgent(await claudeTier(rawOptions.claude))
    await run({ ...rawOptions, ...plan } as Options)
  })

if (import.meta.main) {
  try {
    const args = process.argv.slice(2)
    if (args[0] === "--") args.shift()
    await main.parse(args)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`Error: ${message}`)
    process.exit(1)
  }
}
