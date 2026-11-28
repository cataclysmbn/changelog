/**
 * @module
 *
 * Generate a DCInside-style Cataclysm: Bright Nights changelog draft or rewrite prompt.
 *
 * The script reads a Cataclysm-BN git range, enriches commits with PR evidence and
 * permanent GitHub image URLs, then emits either a paste-ready skeleton or a prompt that asks
 * an editor/LLM to rewrite the entries in the compact Korean format used by DCInside
 * roguelike gallery patch posts.
 */

import { Command } from "@cliffy/command"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import * as v from "valibot"

import {
  type Commit,
  draftPost,
  githubImageUrls,
  type PullRequestDetails,
  rewritePrompt,
} from "../src/dcinside.ts"

import { execText } from "../src/exec.ts"
import { parsePo, poGlossary } from "../src/translation.ts"

const scriptDir = dirname(fileURLToPath(import.meta.url))
const appRoot = dirname(scriptDir)
const defaultGlossaryPo = resolve(appRoot, "../translations/lang/po/ko.po")

const ModeSchema = v.picklist(["prompt", "draft"])
const OptionsSchema = v.object({
  repo: v.string(),
  since: v.string(),
  until: v.string(),
  mode: ModeSchema,
  maxCommits: v.pipe(v.number(), v.integer(), v.minValue(1)),
  includeBody: v.boolean(),
  output: v.optional(v.string()),
  commitsOutput: v.optional(v.string()),
  excludeCommits: v.optional(v.string()),
  title: v.optional(v.string()),
  repoSlug: v.optional(v.string()),
  rawUrl: v.string(),
  noPrDetails: v.optional(v.boolean()),
  allowMissingPrDetails: v.optional(v.boolean()),
  glossaryPo: v.string(),
  skipGlossary: v.optional(v.boolean()),
})
const CommitSchema = v.object({
  hash: v.string(),
  date: v.string(),
  subject: v.string(),
  author: v.string(),
  body: v.string(),
})
const GhFileSchema = v.object({ path: v.string() })
const GhPrSchema = v.object({
  number: v.number(),
  title: v.string(),
  url: v.string(),
  body: v.nullable(v.string()),
  files: v.array(GhFileSchema),
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

const gitDate = (value: string): string =>
  /^\d{4}-\d{2}-\d{2}$/u.test(value) ? `${value}T00:00:00` : value

const gitRangeArgs = ({ range, since, until }: Options & { range?: string }): string[] =>
  range ? [range] : [`--since=${gitDate(since)}`, `--until=${gitDate(until)}`]

const inheritedGhEnv = (): Record<string, string> => {
  const env: Record<string, string> = {}
  for (const key of ["GH_TOKEN", "GITHUB_TOKEN", "PATH", "HOME", "XDG_CONFIG_HOME"]) {
    const value = process.env[key]
    if (value) env[key] = value
  }
  return env
}

const commandText = (
  command: string,
  args: string[],
  options: { clearEnv?: boolean } = {},
): Promise<string> =>
  execText(
    command,
    args,
    options.clearEnv ? {} : inheritedGhEnv(),
    `${command} ${args.join(" ")} failed`,
  )

const inRequestedDateWindow = (commit: Commit, options: Options & { range?: string }): boolean => {
  if (options.range) return true
  const hasIsoWindow =
    /^\d{4}-\d{2}-\d{2}$/u.test(options.since) && /^\d{4}-\d{2}-\d{2}$/u.test(options.until)
  return !hasIsoWindow || (commit.date >= options.since && commit.date < options.until)
}

const readCommits = async (options: Options & { range?: string }): Promise<Commit[]> => {
  const repo = resolve(options.repo)
  const stdout = await execText(
    "git",
    [
      "-C",
      repo,
      "log",
      "--reverse",
      "--date=format-local:%Y-%m-%d",
      ...gitRangeArgs(options),
      "--pretty=format:%x1f%h%x1f%cd%x1f%s%x1f%an%x1f%b%x1e",
    ],
    {},
    `git log failed in ${repo}`,
  )
  const excluded = options.excludeCommits
    ? (await readFile(options.excludeCommits, "utf8")).split("\n").filter(Boolean)
    : []

  return stdout
    .split("\x1e")
    .filter((record) => record.trim().length > 0)
    .map((record) => {
      const [, hash = "", date = "", subject = "", author = "", ...body] = record.split("\x1f")
      return v.parse(CommitSchema, {
        hash,
        date,
        subject,
        author,
        body: body.join("\x1f").trim(),
      })
    })
    .filter(
      (commit) =>
        inRequestedDateWindow(commit, options) &&
        !excluded.some((hash) => hash.startsWith(commit.hash)),
    )
    .slice(0, options.maxCommits)
}

const prNumber = (subject: string): number | null => {
  const match = subject.match(/\(#(\d+)\)$/u)
  return match ? Number(match[1]) : null
}

const githubSlugFromRemote = (remote: string): string | null => {
  const normalized = remote.trim().replace(/\.git$/u, "")
  const https = normalized.match(/github\.com[:/]([^/]+\/[^/]+)$/u)
  return https?.[1] ?? null
}

const resolveRepoSlug = async (repo: string, override?: string): Promise<string> => {
  if (override) return override
  for (const remote of ["upstream", "origin"]) {
    try {
      const url = await commandText("git", ["-C", repo, "remote", "get-url", remote], {
        clearEnv: true,
      })
      const slug = githubSlugFromRemote(url)
      if (slug) return slug
    } catch {
      // Try the next conventional remote.
    }
  }
  throw new Error("Could not infer GitHub owner/repo; pass --repo-slug owner/repo")
}

// GET because the signed S3 redirect target answers HEAD with 403.
const isAnonymousImage = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "dc-changelog" },
    })
    await response.body?.cancel()
    return (
      response.ok &&
      /^image\/(?:png|jpeg|gif|webp)\b/iu.test(response.headers.get("content-type") ?? "")
    )
  } catch {
    return false
  }
}

const usableImages = async (urls: string[]): Promise<string[]> => {
  const usable = await Promise.all(urls.map(isAnonymousImage))
  return urls.filter((_, index) => usable[index])
}

/** A commit that adds more images than this is a sprite batch, too many to show one by one. */
const maxAddedImages = 10

/**
 * Raw GitHub URLs of the images a commit adds or changes, pinned to that commit. Tileset sheets (under `gfx/` or a
 * path with "tileset" in it) are left out. So are URLs that GitHub does not serve, such as for a local commit.
 */
const addedImages = async (
  commit: Commit,
  options: { repo: string; repoSlug: string; rawUrl: string },
): Promise<string[]> => {
  const [hash = "", ...files] = (
    await commandText(
      "git",
      [
        "-C",
        options.repo,
        "-c",
        "core.quotePath=false",
        "show",
        "--format=%H",
        "--name-only",
        "--diff-filter=AM",
        "--diff-merges=first-parent",
        "-z",
        commit.hash,
      ],
      { clearEnv: true },
    )
  )
    .split(/\0\n?/u)
    .filter(Boolean)
  const images = files.filter(
    (file) => !/^gfx\/|tileset/iu.test(file) && /\.(?:png|jpe?g|gif|webp)$/iu.test(file),
  )
  if (images.length > maxAddedImages) return []
  return await usableImages(
    images.map(
      (file) =>
        `${options.rawUrl}/${options.repoSlug}/${hash}/${file.split("/").map(encodeURIComponent).join("/")}`,
    ),
  )
}

const fetchPullRequest = async (
  pr: number,
  options: { repoSlug: string },
): Promise<PullRequestDetails> => {
  const json = await commandText("gh", [
    "pr",
    "view",
    pr.toString(),
    "--repo",
    options.repoSlug,
    "--json",
    "number,title,body,files,url",
  ])
  const parsed = v.parse(GhPrSchema, JSON.parse(json))
  const body = parsed.body ?? ""
  return {
    number: parsed.number,
    title: parsed.title,
    url: parsed.url,
    body,
    files: parsed.files.map((file) => file.path),
    images: await usableImages(githubImageUrls(body)),
  }
}

const withPullRequestDetails = async (commits: Commit[], options: Options): Promise<Commit[]> => {
  if (options.noPrDetails) return commits
  const repo = resolve(options.repo)
  const repoSlug = await resolveRepoSlug(repo, options.repoSlug)
  const cache = new Map<number, Promise<PullRequestDetails>>()
  const lookup = (number: number): Promise<PullRequestDetails> => {
    const cached = cache.get(number) ?? fetchPullRequest(number, { repoSlug })
    cache.set(number, cached)
    return cached
  }

  return await Promise.all(
    commits.map(async (commit) => {
      const number = prNumber(commit.subject)
      if (!number) return commit

      try {
        const pullRequest = await lookup(number).catch(async (error: unknown) => {
          if (!String(error).includes("Could not resolve to a PullRequest")) throw error
          // After a rebase merge, a commit subject can end in an issue number. Look up the PR that holds the commit.
          const merged = await commandText("gh", [
            "api",
            `repos/${repoSlug}/commits/${commit.hash}/pulls`,
            "--jq",
            ".[0].number // empty",
          ])
          return merged.trim() ? await lookup(Number(merged)) : undefined
        })
        if (!pullRequest) return commit
        const images = await addedImages(commit, { repo, repoSlug, rawUrl: options.rawUrl })
        return {
          ...commit,
          pullRequest: { ...pullRequest, images: [...pullRequest.images, ...images] },
        }
      } catch (error) {
        if (!options.allowMissingPrDetails) throw error
        return {
          ...commit,
          pullRequest: {
            number,
            title: commit.subject,
            url: `https://github.com/${repoSlug}/pull/${number}`,
            body: "",
            files: [],
            images: [],
            lookupError: error instanceof Error ? error.message : String(error),
          },
        }
      }
    }),
  )
}

const glossarySource = (commits: Commit[]): string =>
  commits
    .map((commit) =>
      [
        commit.subject,
        commit.body,
        commit.pullRequest?.title,
        commit.pullRequest?.body,
        commit.pullRequest?.files.join("\n"),
      ]
        .filter((text): text is string => typeof text === "string")
        .join("\n"),
    )
    .join("\n")

const buildPoGlossary = async (
  commits: Commit[],
  options: Options,
): Promise<string | undefined> => {
  if (options.skipGlossary) return undefined
  return (
    poGlossary(
      parsePo(await readFile(resolve(options.glossaryPo), "utf8")),
      glossarySource(commits),
    ) || undefined
  )
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
  .option("--repo-slug <owner/repo:string>", "GitHub repository slug for PR lookups")
  .option("--raw-url <url:string>", "Base URL of raw files in GitHub repositories", {
    default: "https://raw.githubusercontent.com",
    hidden: true,
  })
  .option("--no-pr-details", "Do not query GitHub PR bodies/files/images", {
    default: false,
  })
  .option(
    "--allow-missing-pr-details",
    "Keep going and mark missing PR evidence instead of failing",
    { default: false },
  )
  .option("--glossary-po <file:string>", "Korean gettext PO file for term snippets", {
    default: defaultGlossaryPo,
  })
  .option("--skip-glossary", "Do not include Korean PO term snippets", {
    default: false,
  })
  .option("-t, --title <title:string>", "Override post title")
  .option("-o, --output <file:string>", "Write output to a file instead of stdout")
  .option(
    "--commits-output <file:string>",
    "Write the included and excluded commit hashes to a file, one per line",
  )
  .option(
    "--exclude-commits <file:string>",
    "Skip commits whose full hashes are listed in a file, one per line",
  )
  .example(
    "weekly prompt",
    "vp run dc --repo ../Cataclysm-BN --since 2026-01-01 --until 2026-01-07 -o /tmp/prompt.md",
  )
  .example("tag range draft", "vp run dc v0.10.0..HEAD --mode draft")
  .action(async (rawOptions, range?: string) => {
    const options = {
      noPrDetails: false,
      allowMissingPrDetails: false,
      skipGlossary: false,
      ...v.parse(OptionsSchema, rawOptions),
    }
    const commits = await withPullRequestDetails(await readCommits({ ...options, range }), options)
    if (commits.length === 0) {
      throw new Error("No commits found for the requested range")
    }

    const output =
      options.mode === "draft"
        ? draftPost({
            commits,
            title: options.title,
            includeBody: options.includeBody,
          })
        : rewritePrompt({
            commits,
            title: options.title,
            includeBody: true,
            glossary: await buildPoGlossary(commits, options),
            glossaryPo: resolve(options.glossaryPo),
          })

    // Record excluded commits too, so the next post does not add them again.
    if (options.commitsOutput) {
      await writeFile(
        options.commitsOutput,
        commits.map((commit) => `${commit.hash}\n`).join("") +
          (options.excludeCommits ? await readFile(options.excludeCommits, "utf8") : ""),
      )
    }
    if (options.output) {
      const outputDir = dirname(options.output)
      if (outputDir !== ".") {
        await mkdir(outputDir, { recursive: true })
      }
      await writeFile(options.output, output)
      return
    }
    console.log(output)
  })

if (import.meta.main) {
  try {
    await main.parse(process.argv.slice(2))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`Error: ${message}`)
    process.exit(1)
  }
}
