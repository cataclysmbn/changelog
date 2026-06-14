#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run=git
/**
 * @module
 *
 * Generate a DCInside-style Cataclysm: Bright Nights changelog draft or rewrite prompt.
 *
 * The script reads a Cataclysm-BN git range, groups commits by day, and emits either a
 * paste-ready skeleton or a prompt that asks an editor/LLM to rewrite the entries in the
 * compact Korean format used by DCInside roguelike gallery patch posts.
 */

import { Command } from "@cliffy/command"
import { ensureDir } from "@std/fs"
import { dirname, resolve } from "@std/path"
import * as v from "@valibot/valibot"

import { type Commit, draftPost, rewritePrompt } from "../src/dcinside.ts"

const ModeSchema = v.picklist(["prompt", "draft"])
const OptionsSchema = v.object({
  repo: v.string(),
  since: v.string(),
  until: v.string(),
  mode: ModeSchema,
  maxCommits: v.pipe(v.number(), v.integer(), v.minValue(1)),
  includeBody: v.boolean(),
  output: v.optional(v.string()),
  title: v.optional(v.string()),
})
const CommitSchema = v.object({
  hash: v.string(),
  date: v.string(),
  subject: v.string(),
  author: v.string(),
  body: v.string(),
})

type Mode = v.InferOutput<typeof ModeSchema>
type Options = v.InferOutput<typeof OptionsSchema>

const parseMode = (mode: string): Mode => v.parse(ModeSchema, mode)

const parsePositiveInt = (value: string | number): number => {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`Expected a positive integer, got ${value}`)
  }
  return parsed
}

const gitRangeArgs = (
  { range, since, until }: Options & { range?: string },
): string[] => range ? [range] : [`--since=${since}`, `--until=${until}`]

const decode = (bytes: Uint8Array): string => new TextDecoder().decode(bytes)

const readCommits = async (
  options: Options & { range?: string },
): Promise<Commit[]> => {
  const repo = resolve(options.repo)
  const command = new Deno.Command("git", {
    clearEnv: true,
    args: [
      "-C",
      repo,
      "log",
      "--reverse",
      "--date=short",
      ...gitRangeArgs(options),
      "--pretty=format:%x1f%h%x1f%ad%x1f%s%x1f%an%x1f%b%x1e",
    ],
    stdout: "piped",
    stderr: "piped",
  })

  const { success, stdout, stderr } = await command.output()
  if (!success) {
    throw new Error(`git log failed in ${repo}: ${decode(stderr).trim()}`)
  }

  return decode(stdout)
    .split("\x1e")
    .filter((record) => record.trim().length > 0)
    .slice(0, options.maxCommits)
    .map((record) => {
      const [, hash = "", date = "", subject = "", author = "", ...body] =
        record.split("\x1f")
      return v.parse(CommitSchema, {
        hash,
        date,
        subject,
        author,
        body: body.join("\x1f").trim(),
      })
    })
}

const main = new Command()
  .name("dc-changelog")
  .version("0.1.0")
  .description(
    "Generate a DCInside-style Cataclysm: Bright Nights changelog draft or rewrite prompt.",
  )
  .arguments("[range:string]")
  .option("-r, --repo <path:string>", "Cataclysm-BN repository path", {
    default: "../Cataclysm-BN",
  })
  .option("--since <date:string>", "Start date/ref passed to git log --since", {
    default: "last monday 1 week ago",
  })
  .option("--until <date:string>", "End date/ref passed to git log --until", {
    default: "today",
  })
  .option("-m, --mode <mode:string>", "Output mode: prompt or draft", {
    default: "prompt" as Mode,
    value: parseMode,
  })
  .option("--max-commits <count:string>", "Maximum commits to include", {
    default: 120,
    value: parsePositiveInt,
  })
  .option(
    "--include-body",
    "Include first commit body lines in draft output; prompt mode always includes them",
    { default: false },
  )
  .option("-t, --title <title:string>", "Override post title")
  .option(
    "-o, --output <file:string>",
    "Write output to a file instead of stdout",
  )
  .example(
    "weekly prompt",
    "deno task dc --repo ../Cataclysm-BN --since 2026-01-01 --until 2026-01-07 -o out/prompt.md",
  )
  .example("tag range draft", "deno task dc v0.10.0..HEAD --mode draft")
  .action(async (rawOptions, range?: string) => {
    const options = v.parse(OptionsSchema, rawOptions)
    const commits = await readCommits({ ...options, range })
    if (commits.length === 0) {
      throw new Error("No commits found for the requested range")
    }

    const output = options.mode === "draft"
      ? draftPost({
        commits,
        title: options.title,
        includeBody: options.includeBody,
      })
      : rewritePrompt({ commits, title: options.title, includeBody: true })

    if (options.output) {
      const outputDir = dirname(options.output)
      if (outputDir !== ".") {
        await ensureDir(outputDir)
      }
      await Deno.writeTextFile(options.output, output)
      return
    }
    console.log(output)
  })

if (import.meta.main) {
  try {
    await main.parse(Deno.args)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`Error: ${message}`)
    Deno.exit(1)
  }
}
