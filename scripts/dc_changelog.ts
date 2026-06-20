#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run=git,gh --allow-net --allow-env=GH_TOKEN,GITHUB_TOKEN,PATH,HOME,XDG_CONFIG_HOME
/**
 * @module
 *
 * Generate a DCInside-style Cataclysm: Bright Nights changelog draft or rewrite prompt.
 *
 * The script reads a Cataclysm-BN git range, enriches commits with PR evidence and
 * downloadable PR images, then emits either a paste-ready skeleton or a prompt that asks
 * an editor/LLM to rewrite the entries in the compact Korean format used by DCInside
 * roguelike gallery patch posts.
 */

import { Command } from "@cliffy/command"
import { ensureDir } from "@std/fs"
import { dirname, extname, resolve } from "@std/path"
import * as v from "@valibot/valibot"

import {
  type Commit,
  draftPost,
  type PullRequestDetails,
  rewritePrompt,
} from "../src/dcinside.ts"

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
  assetDir: v.optional(v.string()),
  repoSlug: v.optional(v.string()),
  noPrDetails: v.optional(v.boolean()),
  allowMissingPrDetails: v.optional(v.boolean()),
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

const gitRangeArgs = (
  { range, since, until }: Options & { range?: string },
): string[] => range ? [range] : [`--since=${since}`, `--until=${until}`]

const decode = (bytes: Uint8Array): string => new TextDecoder().decode(bytes)

const inheritedGhEnv = (): Record<string, string> => {
  const env: Record<string, string> = {}
  for (
    const key of ["GH_TOKEN", "GITHUB_TOKEN", "PATH", "HOME", "XDG_CONFIG_HOME"]
  ) {
    const value = Deno.env.get(key)
    if (value) env[key] = value
  }
  return env
}

const commandText = async (
  command: string,
  args: string[],
  options: { clearEnv?: boolean } = {},
): Promise<string> => {
  const result = await new Deno.Command(command, {
    args,
    clearEnv: true,
    env: options.clearEnv ? {} : inheritedGhEnv(),
    stdout: "piped",
    stderr: "piped",
  }).output()
  if (!result.success) {
    throw new Error(
      `${command} ${args.join(" ")} failed: ${decode(result.stderr).trim()}`,
    )
  }
  return decode(result.stdout)
}

const inRequestedDateWindow = (
  commit: Commit,
  options: Options & { range?: string },
): boolean => {
  if (options.range) return true
  const hasIsoWindow = /^\d{4}-\d{2}-\d{2}$/u.test(options.since) &&
    /^\d{4}-\d{2}-\d{2}$/u.test(options.until)
  return !hasIsoWindow ||
    (commit.date >= options.since && commit.date < options.until)
}

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
    .filter((commit) => inRequestedDateWindow(commit, options))
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

const resolveRepoSlug = async (
  repo: string,
  override?: string,
): Promise<string> => {
  if (override) return override
  for (const remote of ["upstream", "origin"]) {
    try {
      const url = await commandText("git", [
        "-C",
        repo,
        "remote",
        "get-url",
        remote,
      ], {
        clearEnv: true,
      })
      const slug = githubSlugFromRemote(url)
      if (slug) return slug
    } catch {
      // Try the next conventional remote.
    }
  }
  throw new Error(
    "Could not infer GitHub owner/repo; pass --repo-slug owner/repo",
  )
}

const imageUrls = (markdown: string): string[] => {
  const urls = new Set<string>()
  for (
    const match of markdown.matchAll(
      /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/giu,
    )
  ) {
    urls.add(match[1])
  }
  for (
    const match of markdown.matchAll(/!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/giu)
  ) {
    urls.add(match[1])
  }
  for (const match of markdown.matchAll(/https?:\/\/[^\s)"']+/giu)) {
    const url = match[0]
    if (
      /\.(?:png|jpe?g|gif|webp)(?:\?|$)/iu.test(url) ||
      url.includes("/user-attachments/assets/")
    ) {
      urls.add(url)
    }
  }
  return [...urls]
}

const extensionFromContentType = (
  contentType: string | null,
): string | null => {
  const type = contentType?.split(";")[0]?.trim().toLowerCase()
  if (type === "image/png") return ".png"
  if (type === "image/jpeg") return ".jpg"
  if (type === "image/gif") return ".gif"
  if (type === "image/webp") return ".webp"
  return null
}

const extensionFromUrl = (
  url: string,
  contentType: string | null,
): string | null => {
  const parsed = new URL(url)
  const ext = extname(parsed.pathname).toLowerCase()
  return /^\.(?:png|jpe?g|gif|webp)$/u.test(ext)
    ? ext
    : extensionFromContentType(contentType)
}

const downloadPrImages = async (
  pr: number,
  body: string,
  assetDir?: string,
): Promise<PullRequestDetails["images"]> => {
  const urls = imageUrls(body)
  if (!assetDir || urls.length === 0) {
    return urls.map((sourceUrl) => ({ sourceUrl }))
  }

  await ensureDir(assetDir)
  const images: PullRequestDetails["images"] = []
  let saved = 0
  for (const sourceUrl of urls) {
    try {
      const response = await fetch(sourceUrl, {
        headers: { "User-Agent": "dc-changelog" },
      })
      if (!response.ok) {
        images.push({
          sourceUrl,
          error: `${response.status} ${response.statusText}`,
        })
        continue
      }
      const contentType = response.headers.get("content-type")
      const ext = extensionFromUrl(sourceUrl, contentType)
      if (!ext) {
        images.push({
          sourceUrl,
          error: `skipped non-image content-type: ${contentType ?? "unknown"}`,
        })
        continue
      }
      saved += 1
      const filename = `pr-${pr}-${saved}${ext}`
      await Deno.writeFile(
        resolve(assetDir, filename),
        new Uint8Array(await response.arrayBuffer()),
      )
      images.push({ sourceUrl, filename })
    } catch (error) {
      images.push({
        sourceUrl,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
  return images
}

const fetchPullRequest = async (
  pr: number,
  options: { repoSlug: string; assetDir?: string },
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
    images: await downloadPrImages(pr, body, options.assetDir),
  }
}

const withPullRequestDetails = async (
  commits: Commit[],
  options: Options,
): Promise<Commit[]> => {
  if (options.noPrDetails) return commits
  const repo = resolve(options.repo)
  const repoSlug = await resolveRepoSlug(repo, options.repoSlug)
  const cache = new Map<number, Promise<PullRequestDetails>>()

  return await Promise.all(commits.map(async (commit) => {
    const number = prNumber(commit.subject)
    if (!number) return commit

    const cached = cache.get(number) ?? fetchPullRequest(number, {
      repoSlug,
      assetDir: options.assetDir ? resolve(options.assetDir) : undefined,
    })
    cache.set(number, cached)

    try {
      return { ...commit, pullRequest: await cached }
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
  }))
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
  .option(
    "--asset-dir <dir:string>",
    "Download PR images into this output directory",
  )
  .option(
    "--repo-slug <owner/repo:string>",
    "GitHub repository slug for PR lookups",
  )
  .option("--no-pr-details", "Do not query GitHub PR bodies/files/images", {
    default: false,
  })
  .option(
    "--allow-missing-pr-details",
    "Keep going and mark missing PR evidence instead of failing",
    { default: false },
  )
  .option("-t, --title <title:string>", "Override post title")
  .option(
    "-o, --output <file:string>",
    "Write output to a file instead of stdout",
  )
  .example(
    "weekly prompt",
    "deno task dc --repo ../Cataclysm-BN --since 2026-01-01 --until 2026-01-07 --asset-dir dist/2026-01-01_to_2026-01-07 -o /tmp/prompt.md",
  )
  .example("tag range draft", "deno task dc v0.10.0..HEAD --mode draft")
  .action(async (rawOptions, range?: string) => {
    const options = {
      noPrDetails: false,
      allowMissingPrDetails: false,
      ...v.parse(OptionsSchema, rawOptions),
    }
    const commits = await withPullRequestDetails(
      await readCommits({ ...options, range }),
      options,
    )
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
