#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env --allow-net
/**
 * @module
 *
 * Builds the GitHub Pages site from the mdBook books in `book/` (requires `mdbook`).
 * The Korean book is at the site root and the English book is at `en/`; each site root shows the newest post.
 * Beside each post page `<period>/` is `<period>.html`, the same post as HTML for the DCInside HTML editor.
 *
 * Usage: deno task site <output folder>
 */

import $ from "@david/dax"
import { fromFileUrl, join, resolve } from "@std/path"

import { renderPostHtml } from "../src/dcinside.ts"
import { wideImages } from "./mirror_images.ts"
import { bookPosts, defaults, langs } from "./pages.ts"

/** Adds Open Graph tags to a built page: its first heading, its URL, and the first image of its content. */
const addOpenGraph = async (file: string, url: string) => {
  const html = await Deno.readTextFile(file)
  const title =
    html.match(/<main>\s*<h1[^>]*><a[^>]*>([^<]*)<\/a><\/h1>/u)?.[1] ??
      html.match(/<title>([^<]*)<\/title>/u)?.[1] ?? ""
  const image = html.match(/<main>[\s\S]*?<img src="([^"]+)"/u)?.[1]
  const tags = [
    `<meta property="og:type" content="article">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:url" content="${url}">`,
    ...(image ? [`<meta property="og:image" content="${image}">`] : []),
    `<meta name="twitter:card" content="${
      image ? "summary_large_image" : "summary"
    }">`,
  ]
  await Deno.writeTextFile(
    file,
    html.replace("</head>", `${tags.join("\n")}\n</head>`),
  )
}

/** Builds both books of `root` into `out` for the site at `site`. */
export const buildSite = async (
  { root, out, site = defaults.site }: {
    root: string
    out: string
    site?: string
  },
) => {
  const sitePath = `${new URL(site).pathname.replace(/\/$/u, "")}/`
  for (const { code } of langs) {
    const book = join(root, "book", code)
    const dest = code === "ko" ? out : join(out, "en")
    const base = code === "ko" ? `${site}/` : `${site}/en/`
    await $`mdbook build ${book} --dest-dir ${dest}`.env({
      MDBOOK_OUTPUT__HTML__SITE_URL: code === "ko"
        ? sitePath
        : `${sitePath}en/`,
    }).quiet()
    await addOpenGraph(join(dest, "index.html"), base)
    await addOpenGraph(join(dest, "archive", "index.html"), `${base}archive/`)
    for (const name of await bookPosts(join(book, "src"))) {
      await addOpenGraph(join(dest, name, "index.html"), `${base}${name}/`)
      const post = await Deno.readTextFile(
        join(book, "src", name, "index.md"),
      )
      await Deno.writeTextFile(
        join(dest, `${name}.html`),
        renderPostHtml(post, { wide: await wideImages(post) }),
      )
    }
  }
}

if (import.meta.main) {
  const [out] = Deno.args
  if (!out) throw new Error("Usage: deno task site <output folder>")
  await buildSite({
    root: fromFileUrl(new URL("..", import.meta.url)),
    out: resolve(out),
  })
}
