#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env
/**
 * @module
 *
 * Interactive DCInside changelog runner.
 *
 * Uses dax prompts to choose a contiguous set of weekly ranges, generates a prompt for each
 * week in a temp directory, then invokes isolated pi writer/reviewer passes. Final output is
 * a per-week folder with changelog.txt and any PR images referenced by the text.
 */

import { Command } from "@cliffy/command"
import $ from "@david/dax"
import { ensureDir } from "@std/fs"
import { dirname, fromFileUrl, join, resolve } from "@std/path"

import { reviewPrompt, translationGuide } from "../src/dcinside.ts"
import { rangesBetween, weeklyRanges, type WeekRange } from "../src/weeks.ts"
import {
  parsePo,
  validateTranslationReview,
  type VerifiedTerm,
} from "../src/translation.ts"

const scriptDir = dirname(fromFileUrl(import.meta.url))
const appRoot = dirname(scriptDir)
const defaultRepo = resolve(appRoot, "../Cataclysm-BN")
const defaultOutputDir = join(appRoot, "dist")
const defaultGlossaryPo = resolve(appRoot, "../translations/lang/po/ko.po")
const skillPath = join(
  appRoot,
  ".agents",
  "skills",
  "dcinside-changelog",
  "SKILL.md",
)

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

const chooseRange = async (
  ranges: WeekRange[],
  options: Options,
): Promise<WeekRange[]> => {
  if (options.yes) {
    return rangesBetween(
      ranges,
      options.newest ?? 0,
      options.oldest ?? options.newest ?? 0,
    )
  }

  const newest = options.newest ?? (await $.select({
    message: "가장 최근 주를 고르세요",
    options: ranges.map((range) => range.label),
  })).index

  const oldestOptions = ranges.filter((range) => range.index >= newest)
  const oldest = options.oldest ?? oldestOptions[
    (await $.select({
      message: "어느 과거 주까지 생성할까요",
      options: oldestOptions.map((range) => range.label),
    })).index
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

const rangeSlug = (range: WeekRange): string =>
  `${range.start}_to_${range.endInclusive}`

const buildPrompt = async (
  range: WeekRange,
  options: Options,
  promptFile: string,
  assetDir: string,
): Promise<void> => {
  const args = [
    "deno",
    "run",
    "--allow-read",
    "--allow-write",
    "--allow-run=git,gh",
    "--allow-net",
    "--allow-env=GH_TOKEN,GITHUB_TOKEN,PATH,HOME,XDG_CONFIG_HOME",
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
    "--asset-dir",
    assetDir,
    "--glossary-po",
    options.glossaryPo,
    "-o",
    promptFile,
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
- If a downloaded image helps explain an entry, add the filename alone immediately before that bullet, e.g. "pr-8621-1.png".
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
- Add the filename alone immediately before bullets illustrated by downloaded images, e.g. "pr-8621-1.png".
- Delete low-utility internal Lua/CI/refactor/build entries unless the final player-facing effect matters.
- Collapse superseded entries into one final result.
- Reject vague wording such as 갱신/정리/개선 unless the same entry explains exactly what changed.
- Do not run notify or any completion hook.
`

const makePiWorkspace = async (
  role: "writer" | "reviewer",
): Promise<PiWorkspace> => {
  const root = await Deno.makeTempDir({ prefix: `dc-changelog-pi-${role}-` })
  const cwd = join(root, "work")
  const instructions = role === "writer" ? writerAgents : reviewerAgents
  await ensureDir(cwd)
  await Deno.writeTextFile(join(cwd, "AGENTS.md"), instructions)
  return { root, cwd, instructions }
}

const defaultPiModel = "openai-codex/gpt-5.6-terra:medium"

const claudeArgs = (
  options: Options,
  workspace: PiWorkspace,
  skill: string,
): string[] => {
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
    const tools = options.piTools.split(",").map((tool) =>
      tool === "grep" ? "Grep" : tool === "read" ? "Read" : tool
    ).join(",")
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

const decode = (bytes: Uint8Array): string => new TextDecoder().decode(bytes)

const runPiText = async (
  options: Options,
  promptFile: string,
  workspace: PiWorkspace,
): Promise<string> => {
  const skill = options.agent === "claude"
    ? await Deno.readTextFile(skillPath)
    : ""
  const args = piArgs(options, promptFile, workspace, skill)
  const child = new Deno.Command(args[0], {
    args: args.slice(1),
    cwd: workspace.cwd,
    stdin: options.agent === "claude" ? "piped" : "null",
    stdout: "piped",
    stderr: "piped",
  }).spawn()
  if (options.agent === "claude") {
    const writer = child.stdin.getWriter()
    await writer.write(
      new TextEncoder().encode(await Deno.readTextFile(promptFile)),
    )
    await writer.close()
  }
  const result = await child.output()
  if (!result.success) {
    throw new Error(`${args.join(" ")} failed: ${decode(result.stderr).trim()}`)
  }
  return decode(result.stdout)
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
      await Deno.remove(workspace.root, { recursive: true })
    }
  }
}

export const reviewWithPi = async (
  range: WeekRange,
  options: Options,
  sourcePrompt: string,
  draft: string,
  reviewPromptFile: string,
): Promise<
  {
    changelog: string
    audit?: { poFile: string; poSha256: string; terms: VerifiedTerm[] }
  }
> => {
  if (options.noReview) return { changelog: draft }

  await Deno.writeTextFile(
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
      $.logStep(
        "dry-run",
        `${range.label} reviewer prompt: ${reviewPromptFile}`,
      )
      $.logStep("dry-run", `reviewer cwd: ${workspace.cwd}`)
      $.logStep(
        "dry-run",
        piArgs(options, reviewPromptFile, workspace).join(" "),
      )
      return { changelog: draft }
    }

    $.logStep("pi reviewer", range.label)
    const poFile = resolve(options.glossaryPo)
    const poText = await Deno.readTextFile(poFile)
    const entries = parsePo(poText)
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await runPiText(options, reviewPromptFile, workspace)
      await Deno.writeTextFile(`${reviewPromptFile}.response.json`, response)
      try {
        const { changelog, terms } = validateTranslationReview(
          response,
          entries,
        )
        return {
          changelog,
          audit: { poFile, poSha256: await sha256(poText), terms },
        }
      } catch (error) {
        if (attempt === 1) throw error
        const reason = error instanceof Error ? error.message : String(error)
        $.logStep("review correction", reason)
        await Deno.writeTextFile(
          reviewPromptFile,
          `${await Deno.readTextFile(
            reviewPromptFile,
          )}\n\n# 프로그램 대조 실패\n${reason}\n이전 응답을 실제 PO와 다시 대조해 본문과 terms를 고치고, 완전한 JSON 객체를 반환하세요.\n\n# 이전 응답\n${response}\n`,
        )
      }
    }
    throw new Error("PO 검수를 완료하지 못했습니다")
  } finally {
    if (!options.keepTemp && !options.dryRun) {
      await Deno.remove(workspace.root, { recursive: true })
    }
  }
}

const sha256 = async (text: string): Promise<string> =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)),
    ),
  )
    .map((byte) => byte.toString(16).padStart(2, "0")).join("")

const normalizeImageReferences = (text: string): string =>
  text.replace(/^!\[\]\((pr-\d+-\d+\.(?:png|jpe?g|gif|webp))\)$/gimu, "$1")

const referencedImages = (text: string): Set<string> =>
  new Set(
    [...text.matchAll(
      /(?:^|\s)(pr-\d+-\d+\.(?:png|jpe?g|gif|webp))(?=\s|$)/gimu,
    )]
      .map((match) => match[1]),
  )

const removeUnreferencedImages = async (
  weekDir: string,
  changelog: string,
): Promise<void> => {
  const keep = referencedImages(changelog)
  for await (const entry of Deno.readDir(weekDir)) {
    if (
      !entry.isFile ||
      !/^pr-\d+-\d+\.(?:png|jpe?g|gif|webp)$/iu.test(entry.name)
    ) {
      continue
    }
    if (!keep.has(entry.name)) {
      await Deno.remove(join(weekDir, entry.name))
    }
  }
}

const run = async (options: Options): Promise<void> => {
  const ranges = weeklyRanges(new Date(), options.weeks)
  const selected = await chooseRange(ranges, options)
  if (selected.length === 0) {
    throw new Error("No weekly ranges selected")
  }

  const runOptions = await promptForRunOptions(options)
  if (!runOptions.yes) {
    const confirmed = await $.confirm({
      message: `${selected.length}개 주간 패치글을 pi로 생성할까요?`,
      default: true,
    })
    if (!confirmed) return
  }

  const outputDir = resolve(runOptions.outputDir)
  await ensureDir(outputDir)
  const tempDir = await Deno.makeTempDir({ prefix: "dc-changelog-prompts-" })
  let failed = false

  try {
    for (const range of selected) {
      const slug = rangeSlug(range)
      const weekDir = join(outputDir, slug)
      await ensureDir(weekDir)

      const promptFile = join(tempDir, `${slug}.prompt.md`)
      const reviewerPromptFile = join(tempDir, `${slug}.review.prompt.md`)
      const outputFile = join(weekDir, "changelog.txt")
      await buildPrompt(range, runOptions, promptFile, weekDir)
      const sourcePrompt = await Deno.readTextFile(promptFile)
      const draft = await generateWithPi(range, runOptions, promptFile)
      const review = await reviewWithPi(
        range,
        runOptions,
        sourcePrompt,
        draft,
        reviewerPromptFile,
      )
      const changelog = `${
        normalizeImageReferences(review.changelog).trimEnd()
      }\n`
      if (!runOptions.dryRun) {
        if (review.audit) {
          const reviewDir = join(outputDir, ".reviews")
          await ensureDir(reviewDir)
          await Deno.writeTextFile(
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
        await removeUnreferencedImages(weekDir, changelog)
        await Deno.writeTextFile(outputFile, changelog)
        $.logStep("wrote", outputFile)
      }
    }
  } catch (error) {
    failed = true
    $.logStep("failed", `검수 입력과 응답 보존: ${tempDir}`)
    throw error
  } finally {
    if (!failed && !runOptions.keepTemp && !runOptions.dryRun) {
      await Deno.remove(tempDir, { recursive: true })
    }
  }
}

const main = new Command()
  .name("dc-tui")
  .version("0.1.0")
  .description(
    "Choose weekly Cataclysm-BN ranges and generate DCInside changelogs with isolated pi writer/reviewer passes.",
  )
  .option("--weeks <count:string>", "Number of weekly ranges to list", {
    default: 12,
    value: parsePositiveInt,
  })
  .option("-r, --repo <path:string>", "Cataclysm-BN repository path", {
    default: defaultRepo,
  })
  .option(
    "-o, --output-dir <path:string>",
    "Directory for generated weekly folders",
    { default: defaultOutputDir },
  )
  .option("--max-commits <count:string>", "Maximum commits per weekly prompt", {
    default: 180,
    value: parsePositiveInt,
  })
  .option("--agent <agent:string>", "Agent CLI to run: pi or claude", {
    default: "pi",
    value: (value: string) => {
      if (value !== "pi" && value !== "claude") {
        throw new Error(`Expected pi or claude, got ${value}`)
      }
      return value
    },
  })
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
  .option(
    "--newest <index:string>",
    "Newest week index, where 0 is this week",
    { value: parseWeekIndex },
  )
  .option(
    "--oldest <index:string>",
    "Oldest week index, where 0 is this week",
    { value: parseWeekIndex },
  )
  .option(
    "--dry-run",
    "Generate prompts and print isolated pi commands without running pi",
  )
  .option("--no-review", "Skip the separate senior-editor reviewer pi pass", {
    default: false,
  })
  .option(
    "--allow-missing-pr-details",
    "Keep going when gh PR lookup fails and mark missing evidence in the prompt",
    { default: false },
  )
  .option(
    "--keep-temp",
    "Keep temp prompt and isolated pi workspaces for debugging",
    {
      default: false,
    },
  )
  .option(
    "--glossary-po <file:string>",
    "Korean gettext PO file for term snippets",
    {
      default: defaultGlossaryPo,
    },
  )
  .option("--skip-glossary", "Do not include Korean PO term snippets", {
    default: false,
  })
  .option("-y, --yes", "Use provided/default options without prompts")
  .example("interactive", "deno task tui")
  .example("generate current week", "deno task tui --newest 0 --oldest 0")
  .example(
    "dry-run current week",
    "deno task tui --yes --dry-run --newest 0 --oldest 0",
  )
  .action(async (rawOptions) => {
    await run(rawOptions as Options)
  })

if (import.meta.main) {
  try {
    const args = Deno.args[0] === "--" ? Deno.args.slice(1) : Deno.args
    await main.parse(args)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`Error: ${message}`)
    Deno.exit(1)
  }
}
