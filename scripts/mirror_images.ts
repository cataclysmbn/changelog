/**
 * @module
 *
 * DCInside deletes GitHub image URLs from posts, so post images are copied to the `images` branch of this public
 * repository and served through jsDelivr. Files are named by content hash and URLs pin the commit, so they never change.
 * Each image is also converted to WebP (lossless for pixel art) and the smaller file is kept. Requires ImageMagick.
 *
 * Still images on one image line (before, after, ...) are joined into one side-by-side animated WebP. If one of them
 * is animated, each image is mirrored unchanged on its own line.
 * Images at least twice as wide as tall (side-by-side comparisons) get twice the normal width in the HTML.
 *
 * Usage: vp run html dist/<period>/changelog.txt (or changelog.en.txt) [AI model]; writes the .md and .html beside it.
 * The .md is the post for the mdBook site with CDN image URLs; the .html is the same post for the DCInside HTML editor.
 * With an AI model name, both end with a footer that names it.
 */

import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import $ from "dax"
import { join } from "node:path"
import { imageSize } from "image-size"

import {
  aiFooter,
  mapPostImages,
  postImageUrls,
  postMarkdown,
  renderPostHtml,
} from "../src/dcinside.ts"
import { beforeAfter } from "./before_after.ts"

const branch = "images"
const extensions: Record<string, string> = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

export type MirrorOptions = {
  remote: string
  cdn: string
}

const defaults: MirrorOptions = {
  remote: "https://github.com/cataclysmbn/changelog.git",
  cdn: "https://cdn.jsdelivr.net/gh/cataclysmbn/changelog",
}

export const webpQuality = 50
const wideRatio = 2
const pixelArtMaxSide = 128
const pixelArtMaxColors = 256

const fetchWithTimeout = (url: string): Promise<Response> =>
  fetch(url, { signal: AbortSignal.timeout(60_000) })

const fetchImage = async (url: string) => {
  if (url.startsWith("file:")) {
    return { bytes: await readFile(new URL(url)), extension: url.split(".").at(-1)! }
  }
  const response = await fetchWithTimeout(url)
  const type = response.headers.get("content-type")?.split(";")[0] ?? ""
  const extension = extensions[type]
  if (!response.ok || !extension) {
    await response.body?.cancel()
    throw new Error(`이미지 다운로드 실패: ${url} (${response.status} ${type})`)
  }
  return { bytes: new Uint8Array(await response.arrayBuffer()), extension }
}

/** Returns the files to mirror for one source. Still images of a before/after source are joined into one comparison image. */
const download = async (source: string) => {
  const images = await Promise.all(source.split(" ").map(fetchImage))
  if (
    images.length === 1 ||
    (await Promise.all(images.map(({ bytes }) => isAnimated(bytes)))).some(Boolean)
  ) {
    return Promise.all(images.map(({ bytes, extension }) => compress(bytes, extension)))
  }
  const dir = await mkdtemp(join(tmpdir(), "dc-changelog-pair-"))
  try {
    const sources = await Promise.all(
      images.map(async ({ bytes }, index) => {
        const file = join(dir, `${index}`)
        await writeFile(file, bytes)
        return file
      }),
    )
    const output = join(dir, "pair.webp")
    await beforeAfter({ sources, output })
    return [await compress(await readFile(output), "webp")]
  } finally {
    await rm(dir, { recursive: true })
  }
}

/**
 * Frame count in the acTL chunk of an APNG, or 0 for any other file. ImageMagick reads an APNG as one frame unless the
 * input names the APNG format, and then it needs ffmpeg.
 */
const apngFrames = (bytes: Uint8Array): number => {
  const buffer = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (buffer.toString("latin1", 1, 4) !== "PNG") return 0
  const chunk = buffer.indexOf("acTL")
  return chunk !== -1 && chunk < buffer.indexOf("IDAT") ? buffer.readUInt32BE(chunk + 4) : 0
}

export const isAnimated = async (bytes: Uint8Array<ArrayBuffer>): Promise<boolean> => {
  if (apngFrames(bytes) > 1) return true
  const result = await $`magick identify -format ${"%n\n"} -`
    .stdin(bytes)
    .stdout("piped")
    .stderr("null")
    .noThrow()
  return result.code === 0 && Number(result.stdout.split("\n")[0]) > 1
}

/** Pixel art is small or palette-sized, and lossy compression would blur it. Returns nothing when ImageMagick cannot read the image. */
export const isPixelArt = async (bytes: Uint8Array<ArrayBuffer>): Promise<boolean | undefined> => {
  const result = await $`magick identify -format ${"%w %h %k"} -[0]`
    .stdin(bytes)
    .stdout("piped")
    .stderr("null")
    .noThrow()
  if (result.code !== 0) return undefined
  const [width, height, colors] = result.stdout.split(" ").map(Number)
  return Math.max(width, height) <= pixelArtMaxSide || colors <= pixelArtMaxColors
}

/** Returns WebP bytes, or nothing when ImageMagick cannot encode the image (for example beyond the WebP size limit). */
const toWebp = async (bytes: Uint8Array<ArrayBuffer>) => {
  const pixelArt = await isPixelArt(bytes)
  if (pixelArt === undefined) return undefined
  const mode = pixelArt ? ["-define", "webp:lossless=true"] : ["-quality", `${webpQuality}`]
  const result = await $`magick ${apngFrames(bytes) > 0 ? "apng:-" : "-"} ${mode} webp:-`
    .stdin(bytes)
    .stdout("piped")
    .stderr("null")
    .noThrow()
  return result.code === 0 ? new Uint8Array(result.stdoutBytes) : undefined
}

/** Keeps whichever of the original and its WebP copy is smaller. */
const compress = async (bytes: Uint8Array<ArrayBuffer>, extension: string) => {
  const webp = extension === "webp" ? undefined : await toWebp(bytes)
  const smaller = webp && webp.length < bytes.length
  const output = smaller ? webp : bytes
  const digest = await crypto.subtle.digest("SHA-256", output)
  return {
    name: `${Buffer.from(digest).toString("hex")}.${smaller ? "webp" : extension}`,
    bytes: output,
  }
}

const assertServed = async (url: string): Promise<void> => {
  const response = await fetchWithTimeout(url)
  await response.body?.cancel()
  if (!response.ok) {
    throw new Error(`CDN 응답 실패: ${url} (${response.status})`)
  }
}

/** Bytes that are not an image (some old posts have MP4 files named .png) are not wide. */
const isWide = (bytes: Uint8Array): boolean => {
  try {
    const { width, height } = imageSize(bytes)
    return width >= wideRatio * height
  } catch {
    return false
  }
}

/** Images of a post that may grow to two normal widths in its HTML. */
export const wideImages = async (post: string): Promise<Set<string>> =>
  new Set(
    (
      await Promise.all(
        postImageUrls(post).map(async (url) => {
          if (url.startsWith("file:")) {
            return isWide(await readFile(new URL(url))) ? [url] : []
          }
          const response = await fetchWithTimeout(url)
          if (!response.ok) {
            await response.body?.cancel()
            throw new Error(`이미지 다운로드 실패: ${url} (${response.status})`)
          }
          return isWide(new Uint8Array(await response.arrayBuffer())) ? [url] : []
        }),
      )
    ).flat(),
  )

const mirror = async (
  post: string,
  { remote, cdn }: MirrorOptions,
): Promise<{ post: string; wide: Set<string> }> => {
  const urls = postImageUrls(post)
  if (urls.length === 0) return { post, wide: new Set() }

  const dir = await mkdtemp(join(tmpdir(), "dc-changelog-images-"))
  try {
    await $`git clone --quiet --depth 1 --branch ${branch} ${remote} ${dir}`
    const files = await Promise.all(
      urls.map(async (url) =>
        Promise.all(
          (await download(url)).map(async ({ name, bytes }) => {
            await writeFile(join(dir, name), bytes)
            return { name, wide: isWide(bytes) }
          }),
        ),
      ),
    )
    await $`git -C ${dir} add --all`
    const unchanged = await $`git -C ${dir} diff --cached --quiet`.noThrow()
    if (unchanged.code !== 0) {
      await $`git -C ${dir} commit --quiet -m ${"chore: add post images"}`
      await $`git -C ${dir} push --quiet origin HEAD:${branch}`
    }
    const commit = await $`git -C ${dir} rev-parse HEAD`.text()
    const mirrored = files.map((images) =>
      images.map(({ name, wide }) => ({ url: `${cdn}@${commit}/${name}`, wide })),
    )
    await Promise.all(mirrored.flat().map(({ url }) => assertServed(url)))
    return {
      post: mapPostImages(post, (url) => mirrored[urls.indexOf(url)].map((image) => image.url)),
      wide: new Set(
        mirrored
          .flat()
          .filter(({ wide }) => wide)
          .map(({ url }) => url),
      ),
    }
  } finally {
    await rm(dir, { recursive: true })
  }
}

/** Returns the post with its image URLs replaced by CDN URLs of copies pushed to the images branch. */
export const mirrorPostImages = async (
  post: string,
  options: MirrorOptions = defaults,
): Promise<string> => (await mirror(post, options)).post

/** Mirrors the post images and returns the post as Markdown with the AI footer, and the DCInside HTML rendered from it. */
export const mirrorPost = async (
  post: string,
  { footer, ...options }: Partial<MirrorOptions> & { footer?: string } = {},
): Promise<{ markdown: string; html: string }> => {
  const { post: mirrored, wide } = await mirror(post, {
    ...defaults,
    ...options,
  })
  const markdown = postMarkdown(mirrored, footer)
  return { markdown, html: renderPostHtml(markdown, { wide }) }
}

if (import.meta.main) {
  const [changelog, model] = process.argv.slice(2)
  if (!changelog?.endsWith(".txt")) {
    throw new Error("Usage: vp run html <changelog.txt|changelog.en.txt> [AI model]")
  }
  const { markdown, html } = await mirrorPost(await readFile(changelog, "utf8"), {
    footer: model && aiFooter(model, changelog.endsWith(".en.txt")),
  })
  await writeFile(changelog.replace(/\.txt$/u, ".md"), markdown)
  await writeFile(changelog.replace(/\.txt$/u, ".html"), html)
}
