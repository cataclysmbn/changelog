#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env
/**
 * @module
 *
 * Interactive DCInside changelog runner.
 *
 * Uses dax prompts to choose a contiguous set of weekly ranges, generates a prompt for each
 * week in a temp directory, then invokes isolated pi writer/reviewer passes. Final output is
 * a per-week folder with changelog.md and any PR images crawled from GitHub.
 */

import { Command } from "@cliffy/command"
import $ from "@david/dax"
import { ensureDir } from "@std/fs"
import { dirname, fromFileUrl, join, resolve } from "@std/path"

import { reviewPrompt } from "../src/dcinside.ts"
import { rangesBetween, weeklyRanges, type WeekRange } from "../src/weeks.ts"

const scriptDir = dirname(fromFileUrl(import.meta.url))
const appRoot = dirname(scriptDir)
const defaultRepo = resolve(appRoot, "../Cataclysm-BN")
const defaultOutputDir = join(appRoot, "out", "dcinside")
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
  model?: string
  pi: string
  piTools: string
  dryRun?: boolean
  yes?: boolean
  newest?: number
  oldest?: number
  noReview?: boolean
  allowMissingPrDetails?: boolean
  keepTemp?: boolean
}

type PiWorkspace = {
  root: string
  cwd: string
  agentDir: string
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
    "-o",
    promptFile,
  ]
  if (options.allowMissingPrDetails) {
    args.push("--allow-missing-pr-details")
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
- Prefer concrete words: 실험판, 안정판, 기본 포함 모드, 시작 지점, 스폰, 타일, 줍기, 자동운전.
- Do not run notify or any completion hook.
`

const reviewerAgents = `# Changelog Reviewer Subagent Rules

You are a hostile senior Korean editor for DCInside 밝밤 changelogs.

- Output only the corrected final post body.
- Treat the draft as guilty until proven useful to a Korean player.
- Remove every Korean sentence that sounds like machine translation or developer-only jargon.
- Compare the draft against PR evidence and restore concrete gameplay details.
- Delete low-utility internal Lua/CI/refactor/build entries unless the final player-facing effect matters.
- Collapse superseded entries into one final result.
- Do not run notify or any completion hook.
`

const makePiWorkspace = async (
  role: "writer" | "reviewer",
): Promise<PiWorkspace> => {
  const root = await Deno.makeTempDir({ prefix: `dc-changelog-pi-${role}-` })
  const cwd = join(root, "work")
  const agentDir = join(root, "agent")
  await ensureDir(cwd)
  await ensureDir(agentDir)
  await Deno.writeTextFile(
    join(cwd, "AGENTS.md"),
    role === "writer" ? writerAgents : reviewerAgents,
  )
  return { root, cwd, agentDir }
}

const piArgs = (options: Options, promptFile: string): string[] => {
  const args = [
    options.pi,
    "--no-session",
    "--approve",
    "--no-extensions",
    "--no-prompt-templates",
    "--no-themes",
    "--no-skills",
    "--skill",
    skillPath,
  ]
  if (options.model) {
    args.push("--model", options.model)
  }
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
  const args = piArgs(options, promptFile)
  const result = await new Deno.Command(args[0], {
    args: args.slice(1),
    cwd: workspace.cwd,
    env: { PI_CODING_AGENT_DIR: workspace.agentDir },
    stdout: "piped",
    stderr: "piped",
  }).output()
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
      $.logStep("dry-run", piArgs(options, promptFile).join(" "))
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

const reviewWithPi = async (
  range: WeekRange,
  options: Options,
  sourcePrompt: string,
  draft: string,
  reviewPromptFile: string,
): Promise<string> => {
  if (options.noReview) return draft

  await Deno.writeTextFile(
    reviewPromptFile,
    reviewPrompt({ draft, sourcePrompt, title: range.title }),
  )

  const workspace = await makePiWorkspace("reviewer")
  try {
    if (options.dryRun) {
      $.logStep(
        "dry-run",
        `${range.label} reviewer prompt: ${reviewPromptFile}`,
      )
      $.logStep("dry-run", `reviewer cwd: ${workspace.cwd}`)
      $.logStep("dry-run", piArgs(options, reviewPromptFile).join(" "))
      return draft
    }

    $.logStep("pi reviewer", range.label)
    return await runPiText(options, reviewPromptFile, workspace)
  } finally {
    if (!options.keepTemp && !options.dryRun) {
      await Deno.remove(workspace.root, { recursive: true })
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

  try {
    for (const range of selected) {
      const slug = rangeSlug(range)
      const weekDir = join(outputDir, slug)
      await ensureDir(weekDir)

      const promptFile = join(tempDir, `${slug}.prompt.md`)
      const reviewerPromptFile = join(tempDir, `${slug}.review.prompt.md`)
      const outputFile = join(weekDir, "changelog.md")
      await buildPrompt(range, runOptions, promptFile, weekDir)
      const sourcePrompt = await Deno.readTextFile(promptFile)
      const draft = await generateWithPi(range, runOptions, promptFile)
      const changelog = await reviewWithPi(
        range,
        runOptions,
        sourcePrompt,
        draft,
        reviewerPromptFile,
      )
      if (!runOptions.dryRun) {
        await Deno.writeTextFile(outputFile, `${changelog.trimEnd()}\n`)
        $.logStep("wrote", outputFile)
      }
    }
  } finally {
    if (!runOptions.keepTemp && !runOptions.dryRun) {
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
  .option("--model <model:string>", "Optional pi model argument")
  .option("--pi <command:string>", "pi executable", { default: "pi" })
  .option(
    "--pi-tools <tools:string>",
    "pi --tools value, 'all' to leave enabled, or 'none' for --no-tools",
    { default: "none" },
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
