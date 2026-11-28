/**
 * @module
 *
 * Publishes post folders to the mdBook books in `book/` on the `main` branch of this repository.
 * The Korean post goes to `book/ko/src/<period>/index.md` and the English post to `book/en/src/<period>/index.md`.
 * `description.txt` and `description.en.txt` go beside them, both named `description.txt`.
 * Each book's sidebar (`SUMMARY.md`) and `archive/` list every post, newest first.
 * The push starts the GitHub Pages workflow, which builds the site with `vp run site`.
 *
 * Usage: vp run pages dist/<period>...
 */

import { copyFile, mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import $ from "dax"
import { basename, join } from "node:path"

const branch = "main"
export const period = /^(\d{4}-\d{2}-\d{2})_to_(\d{4}-\d{2}-\d{2})$/u

export type PagesOptions = {
  remote: string
  site: string
}

export const defaults: PagesOptions = {
  remote: "https://github.com/cataclysmbn/changelog.git",
  site: "https://changes.cataclysmbn.org",
}

export const langs = [
  { code: "ko", markdown: "changelog.md", description: "description.txt", archive: "전체 목록" },
  {
    code: "en",
    markdown: "changelog.en.md",
    description: "description.en.txt",
    archive: "All posts",
  },
] as const

/** Posts of a book source folder, newest first. */
export const bookPosts = async (src: string): Promise<string[]> =>
  (await readdir(src, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && period.test(entry.name))
    .map((entry) => entry.name)
    .sort()
    .reverse()

const label = (name: string) => name.replace("_to_", " ~ ")

/** Rewrites the sidebar and the archive page of a book source folder from its posts. */
export const writeIndex = async (src: string, archive: string) => {
  const names = await bookPosts(src)
  const links = names.map((name) => `- [${label(name)}](../${name}/index.md)`)
  await mkdir(join(src, "archive"), { recursive: true })
  await writeFile(join(src, "archive", "index.md"), `# ${archive}\n\n${links.join("\n")}\n`)
  await writeFile(
    join(src, "SUMMARY.md"),
    `# Summary\n\n${names
      .map((name) => `- [${label(name)}](${name}/index.md)`)
      .join("\n")}\n\n[${archive}](archive/index.md)\n`,
  )
}

/** Commits the Korean and English Markdown of the post folders to the books and pushes them. */
export const publishPages = async (
  postDirs: string[],
  { remote, site }: PagesOptions = defaults,
): Promise<string[]> => {
  const dir = await mkdtemp(join(tmpdir(), "changelog-pages-"))
  try {
    await $`git clone --quiet --depth 1 --branch ${branch} ${remote} ${dir}`
    for (const { code, markdown, description, archive } of langs) {
      const src = join(dir, "book", code, "src")
      for (const postDir of postDirs) {
        const target = join(src, basename(postDir))
        await mkdir(target, { recursive: true })
        await copyFile(join(postDir, markdown), join(target, "index.md"))
        // Skip a post folder without a description file, so the book keeps its description.
        await copyFile(join(postDir, description), join(target, "description.txt")).catch((error) =>
          error.code === "ENOENT" ? undefined : Promise.reject(error),
        )
      }
      await writeIndex(src, archive)
    }
    await $`git -C ${dir} add book`
    const unchanged = await $`git -C ${dir} diff --cached --quiet`.noThrow()
    if (unchanged.code !== 0) {
      await $`git -C ${dir} commit --quiet -m ${`docs: publish ${postDirs
        .map((postDir) => basename(postDir))
        .join(", ")}`}`
      await $`git -C ${dir} push --quiet origin HEAD:${branch}`
    }
    return postDirs.map((postDir) => `${site}/${basename(postDir)}/`)
  } finally {
    await rm(dir, { recursive: true })
  }
}

if (import.meta.main) {
  const postDirs = process.argv.slice(2).map((arg) => arg.replace(/\/$/u, ""))
  if (postDirs.length === 0 || !postDirs.every((postDir) => period.test(basename(postDir)))) {
    throw new Error("Usage: vp run pages dist/<start>_to_<end>...")
  }
  console.log((await publishPages(postDirs)).join("\n"))
}
