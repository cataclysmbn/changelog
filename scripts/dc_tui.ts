#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env
/**
 * @module
 *
 * Interactive DCInside changelog runner.
 *
 * Uses dax prompts to choose a contiguous set of weekly ranges, generates a prompt for each
 * week, then invokes pi in print mode with the local DCInside changelog skill.
 */

import { Command } from "@cliffy/command"
import $ from "@david/dax"
import { ensureDir } from "@std/fs"
import { dirname, fromFileUrl, join, resolve } from "@std/path"

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
): Promise<void> => {
  const args = [
    "deno",
    "run",
    "--allow-read",
    "--allow-write",
    "--allow-run=git",
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
    "-o",
    promptFile,
  ]
  await $`${args}`.cwd(appRoot)
}

const piArgs = (options: Options, promptFile: string): string[] => {
  const args = [options.pi, "--no-session", "--approve", "--skill", skillPath]
  if (options.model) {
    args.push("--model", options.model)
  }
  if (options.piTools !== "all") {
    args.push("--tools", options.piTools)
  }
  args.push("-p", `@${promptFile}`)
  return args
}

const generateWithPi = async (
  range: WeekRange,
  options: Options,
  promptFile: string,
  outputFile: string,
): Promise<void> => {
  if (options.dryRun) {
    $.logStep("dry-run", `${range.label} prompt: ${promptFile}`)
    $.logStep("dry-run", piArgs(options, promptFile).join(" "))
    return
  }

  $.logStep("pi", range.label)
  const changelog = await $`${piArgs(options, promptFile)}`.cwd(appRoot).text()
  await Deno.writeTextFile(outputFile, `${changelog.trimEnd()}\n`)
  $.logStep("wrote", outputFile)
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

  for (const range of selected) {
    const slug = rangeSlug(range)
    const promptFile = join(outputDir, `${slug}.prompt.md`)
    const outputFile = join(outputDir, `${slug}.md`)
    await buildPrompt(range, runOptions, promptFile)
    await generateWithPi(range, runOptions, promptFile, outputFile)
  }
}

const main = new Command()
  .name("dc-tui")
  .version("0.1.0")
  .description(
    "Choose weekly Cataclysm-BN ranges and generate DCInside changelogs with pi.",
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
    "Directory for prompts and generated posts",
    {
      default: defaultOutputDir,
    },
  )
  .option("--max-commits <count:string>", "Maximum commits per weekly prompt", {
    default: 180,
    value: parsePositiveInt,
  })
  .option("--model <model:string>", "Optional pi model argument")
  .option("--pi <command:string>", "pi executable", { default: "pi" })
  .option(
    "--pi-tools <tools:string>",
    "pi --tools value, or 'all' to leave all tools enabled",
    {
      default: "read,bash",
    },
  )
  .option(
    "--newest <index:string>",
    "Newest week index, where 0 is this week",
    {
      value: parseWeekIndex,
    },
  )
  .option(
    "--oldest <index:string>",
    "Oldest week index, where 0 is this week",
    {
      value: parseWeekIndex,
    },
  )
  .option(
    "--dry-run",
    "Generate prompts and print pi commands without running pi",
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
