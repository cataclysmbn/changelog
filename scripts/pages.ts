#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env --allow-net
/**
 * @module
 *
 * Publishes one post folder to GitHub Pages on the `gh-pages` branch of this repository.
 * `changelog.html` becomes `<period>/index.html` (Korean) and `changelog.en.html` becomes `<period>/en.html`.
 * The Korean page opens the English page unless the browser prefers Korean or the link asks for Korean (`./?ko`).
 * The site root opens the newest period, and `archive/` links every published period, newest first.
 *
 * Usage: deno task pages dist/<period>...
 */

import $ from "@david/dax"
import { basename, join } from "@std/path"

import { escapeHtml } from "../src/dcinside.ts"

const branch = "gh-pages"
const period = /^(\d{4}-\d{2}-\d{2})_to_(\d{4}-\d{2}-\d{2})$/u

export type PagesOptions = {
  remote: string
  site: string
}

const defaults: PagesOptions = {
  remote: "https://github.com/cataclysmbn/changelog.git",
  site: "https://cataclysmbn.github.io/changelog",
}

const page = (
  { lang, title, url, image, other, script, refresh, body }: {
    lang: string
    title: string
    url: string
    image?: string
    other?: { href: string; lang: string; label: string }
    script?: string
    refresh?: string
    body: string
  },
) =>
  `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(title)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(title)}">
<meta property="og:url" content="${url}">
${
    image
      ? `<meta property="og:image" content="${image}">\n`
      : ""
  }<meta name="twitter:card" content="${
    image ? "summary_large_image" : "summary"
  }">
${
    other
      ? `<link rel="alternate" hreflang="${other.lang}" href="${other.href}">\n`
      : ""
  }${script ? `<script>${script}</script>\n` : ""}${
    refresh ? `<meta http-equiv="refresh" content="0; url=${refresh}">\n` : ""
  }<style>
body { max-width: 850px; margin: 0 auto; padding: 0 16px; font-family: sans-serif; line-height: 1.5; background: #fff; color: #111; }
img { max-width: 100% !important; }
table { max-width: 100%; }
</style>
</head>
<body>
${
    other
      ? `<p><a href="${other.href}" hreflang="${other.lang}">${other.label}</a></p>\n`
      : ""
  }<h1>${escapeHtml(title)}</h1>
${body}</body>
</html>
`

const englishFirst =
  `if (!/^ko\\b/iu.test(navigator.languages?.[0] ?? navigator.language) && !new URLSearchParams(location.search).has("ko")) location.replace("en.html")`

const postTitle = async (file: string) =>
  (await Deno.readTextFile(file)).split("\n")[0].replace(/^# /u, "")

const firstImage = (html: string) => html.match(/<img src="([^"]+)"/u)?.[1]

/** Copies the Korean and English pages of one post into a site checkout. */
const writePost = async (site: string, postDir: string, dir: string) => {
  const name = basename(postDir)
  await Deno.mkdir(join(dir, name), { recursive: true })
  const korean = await Deno.readTextFile(join(postDir, "changelog.html"))
  const english = await Deno.readTextFile(join(postDir, "changelog.en.html"))
  const url = `${site}/${name}/`
  await Deno.writeTextFile(
    join(dir, name, "index.html"),
    page({
      lang: "ko",
      title: await postTitle(join(postDir, "changelog.txt")),
      url,
      image: firstImage(korean),
      other: { href: "en.html", lang: "en", label: "English" },
      script: englishFirst,
      body: korean,
    }),
  )
  await Deno.writeTextFile(
    join(dir, name, "en.html"),
    page({
      lang: "en",
      title: await postTitle(join(postDir, "changelog.en.txt")),
      url: `${url}en.html`,
      image: firstImage(english),
      other: { href: "./?ko", lang: "ko", label: "한국어" },
      body: english,
    }),
  )
}

/** Points the site root at the newest period and rewrites the archive from the period folders in a site checkout. */
const writeIndex = async (site: string, dir: string) => {
  const names = (await Array.fromAsync(Deno.readDir(dir)))
    .filter((entry) => entry.isDirectory && period.test(entry.name))
    .map((entry) => entry.name)
    .sort().reverse()
  const items = names.map((name) => {
    const [, start, end] = name.match(period)!
    return `<li>${start} ~ ${end}: <a href="../${name}/">한국어</a> · <a href="../${name}/en.html">English</a></li>`
  })
  await Deno.mkdir(join(dir, "archive"), { recursive: true })
  await Deno.writeTextFile(
    join(dir, "archive", "index.html"),
    page({
      lang: "ko",
      title: "Cataclysm: Bright Nights changelog archive",
      url: `${site}/archive/`,
      body: `<ul>\n${items.join("\n")}\n</ul>\n`,
    }),
  )
  await Deno.writeTextFile(
    join(dir, "index.html"),
    page({
      lang: "ko",
      title: "Cataclysm: Bright Nights changelog",
      url: `${site}/`,
      refresh: `${names[0]}/`,
      body: `<p><a href="${names[0]}/">${
        names[0]
      }</a> · <a href="archive/">archive</a></p>\n`,
    }),
  )
  await Deno.writeTextFile(join(dir, ".nojekyll"), "")
}

/** Publishes the Korean and English pages of the post folders and updates the site root and archive. */
export const publishPages = async (
  postDirs: string[],
  { remote, site }: PagesOptions = defaults,
): Promise<string[]> => {
  const dir = await Deno.makeTempDir({ prefix: "changelog-pages-" })
  try {
    const exists =
      await $`git ls-remote --exit-code --heads ${remote} ${branch}`
        .quiet().noThrow()
    if (exists.code === 0) {
      await $`git clone --quiet --depth 1 --branch ${branch} ${remote} ${dir}`
    } else {
      await $`git -C ${dir} init --quiet --initial-branch=${branch}`
      await $`git -C ${dir} remote add origin ${remote}`
    }
    for (const postDir of postDirs) await writePost(site, postDir, dir)
    await writeIndex(site, dir)
    await $`git -C ${dir} add --all`
    const unchanged = await $`git -C ${dir} diff --cached --quiet`.noThrow()
    if (unchanged.code !== 0) {
      await $`git -C ${dir} commit --quiet -m ${`chore: publish ${
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
