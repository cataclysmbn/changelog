#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env --allow-net
/**
 * @module
 *
 * Publishes post folders to the mdBook books in `book/` on the `main` branch of this repository.
 * The Korean post goes to `book/ko/src/<period>/index.md` and the English post to `book/en/src/<period>/index.md`.
 * Each book's sidebar (`SUMMARY.md`) and `archive/` list every post, newest first.
 * The push starts the GitHub Pages workflow, which builds the site with `deno task site`.
 *
 * Usage: deno task pages dist/<period>...
 */

import $ from "@david/dax"
import { basename, join } from "@std/path"

const branch = "main"
export const period = /^(\d{4}-\d{2}-\d{2})_to_(\d{4}-\d{2}-\d{2})$/u

export type PagesOptions = {
  remote: string
  site: string
}

export const defaults: PagesOptions = {
  remote: "https://github.com/cataclysmbn/changelog.git",
  site: "https://cataclysmbn.github.io/changelog",
}

export const langs = [
  { code: "ko", markdown: "changelog.md", archive: "전체 목록" },
  { code: "en", markdown: "changelog.en.md", archive: "All posts" },
] as const

/** Posts of a book source folder, newest first. */
export const bookPosts = async (src: string): Promise<string[]> =>
  (await Array.fromAsync(Deno.readDir(src)))
    .filter((entry) => entry.isDirectory && period.test(entry.name))
    .map((entry) => entry.name)
    .sort().reverse()

const label = (name: string) => name.replace("_to_", " ~ ")

/** Rewrites the sidebar and the archive page of a book source folder from its posts. */
export const writeIndex = async (src: string, archive: string) => {
  const names = await bookPosts(src)
  const links = names.map((name) => `- [${label(name)}](../${name}/index.md)`)
  await Deno.mkdir(join(src, "archive"), { recursive: true })
  await Deno.writeTextFile(
    join(src, "archive", "index.md"),
    `# ${archive}\n\n${links.join("\n")}\n`,
  )
  await Deno.writeTextFile(
    join(src, "SUMMARY.md"),
    `# Summary\n\n${
      names.map((name) => `- [${label(name)}](${name}/index.md)`).join("\n")
    }\n\n[${archive}](archive/index.md)\n`,
  )
}

/** Commits the Korean and English Markdown of the post folders to the books and pushes them. */
export const publishPages = async (
  postDirs: string[],
  { remote, site }: PagesOptions = defaults,
): Promise<string[]> => {
  const dir = await Deno.makeTempDir({ prefix: "changelog-pages-" })
  try {
    await $`git clone --quiet --depth 1 --branch ${branch} ${remote} ${dir}`
    for (const { code, markdown, archive } of langs) {
      const src = join(dir, "book", code, "src")
      for (const postDir of postDirs) {
        const target = join(src, basename(postDir))
        await Deno.mkdir(target, { recursive: true })
        await Deno.copyFile(join(postDir, markdown), join(target, "index.md"))
      }
      await writeIndex(src, archive)
    }
    await $`git -C ${dir} add book`
    const unchanged = await $`git -C ${dir} diff --cached --quiet`.noThrow()
    if (unchanged.code !== 0) {
      await $`git -C ${dir} commit --quiet -m ${`docs: publish ${
        postDirs.map((postDir) => basename(postDir)).join(", ")
      }`}`
      await $`git -C ${dir} push --quiet origin HEAD:${branch}`
    }
    return postDirs.map((postDir) => `${site}/${basename(postDir)}/`)
  } finally {
    await Deno.remove(dir, { recursive: true })
  }
}

if (import.meta.main) {
  const postDirs = Deno.args.map((arg) => arg.replace(/\/$/u, ""))
  if (
    postDirs.length === 0 ||
    !postDirs.every((postDir) => period.test(basename(postDir)))
  ) {
    throw new Error("Usage: deno task pages dist/<start>_to_<end>...")
  }
  console.log((await publishPages(postDirs)).join("\n"))
}
