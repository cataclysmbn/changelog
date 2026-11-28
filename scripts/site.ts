/**
 * @module
 *
 * Builds the GitHub Pages site from the mdBook books in `book/` (requires `mdbook`).
 * The Korean book is at the site root and the English book is at `en/`; each site root shows the newest post.
 * Beside each post page `<period>/` is `<period>.html`, the same post as HTML for the DCInside HTML editor.
 *
 * Usage: vp run site <output folder>
 */

import { readFile, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import $ from "dax"
import { join, resolve } from "node:path"

import { escapeHtml, renderPostHtml } from "../src/dcinside.ts"
import { ogDescription } from "../src/description.ts"
import { wideImages } from "./mirror_images.ts"
import { bookPosts, defaults, langs } from "./pages.ts"

/**
 * Adds Open Graph tags to a built page: its first heading, its URL, the first image of its content, and the
 * changes in `description`. For a page of `post`, also adds the address of its DCInside page for the share button.
 * Also removes the heading anchor around a linked heading: the browser splits the nested links and leaves the
 * anchor empty, and the sidebar then lists the heading by that empty anchor.
 */
const finishPage = async (
  file: string,
  { url, post, description }: { url: string; post?: string; description?: string },
) => {
  const html = (await readFile(file, "utf8")).replace(
    /<a class="header" href="#[^"]*">(<a href="[^"]*">(?:(?!<\/?a[ >])[\s\S])*<\/a>)<\/a>/gu,
    "$1",
  )
  const title =
    html.match(/<main>\s*<h1[^>]*><a[^>]*>([^<]*)<\/a><\/h1>/u)?.[1] ??
    html.match(/<title>([^<]*)<\/title>/u)?.[1] ??
    ""
  const image = html.match(/<main>[\s\S]*?<img src="([^"]+)"/u)?.[1]
  const tags = [
    `<meta property="og:type" content="article">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:url" content="${url}">`,
    ...(description
      ? [`<meta property="og:description" content="${escapeHtml(ogDescription(description))}">`]
      : []),
    ...(image ? [`<meta property="og:image" content="${image}">`] : []),
    ...(post ? [`<meta name="changelog-dcinside" content="${post}.html">`] : []),
    `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}">`,
  ]
  await writeFile(file, html.replace("</head>", `${tags.join("\n")}\n</head>`))
}

/** Builds both books of `root` into `out` for the site at `site`. */
export const buildSite = async ({
  root,
  out,
  site = defaults.site,
}: {
  root: string
  out: string
  site?: string
}) => {
  const sitePath = `${new URL(site).pathname.replace(/\/$/u, "")}/`
  for (const { code } of langs) {
    const book = join(root, "book", code)
    const dest = code === "ko" ? out : join(out, "en")
    const base = code === "ko" ? `${site}/` : `${site}/en/`
    await $`mdbook build ${book} --dest-dir ${dest}`
      .env({
        MDBOOK_OUTPUT__HTML__SITE_URL: code === "ko" ? sitePath : `${sitePath}en/`,
      })
      .quiet()
    await finishPage(join(dest, "archive", "index.html"), { url: `${base}archive/` })
    const names = await bookPosts(join(book, "src"))
    for (const name of names) {
      const description = await readFile(join(book, "src", name, "description.txt"), "utf8").catch(
        (error) => (error.code === "ENOENT" ? undefined : Promise.reject(error)),
      )
      await finishPage(join(dest, name, "index.html"), {
        url: `${base}${name}/`,
        post: name,
        description,
      })
      // mdBook shows the newest post at the site root.
      if (name === names[0]) {
        await finishPage(join(dest, "index.html"), { url: base, post: name, description })
      }
      const post = await readFile(join(book, "src", name, "index.md"), "utf8")
      await writeFile(
        join(dest, `${name}.html`),
        renderPostHtml(post, { wide: await wideImages(post) }),
      )
    }
  }
}

if (import.meta.main) {
  const [out] = process.argv.slice(2)
  if (!out) throw new Error("Usage: vp run site <output folder>")
  await buildSite({
    root: fileURLToPath(new URL("..", import.meta.url)),
    out: resolve(out),
  })
}
