#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env --allow-net
/**
 * @module
 *
 * DCInside deletes GitHub image URLs from posts, so post images are copied to the `images` branch of this public
 * repository and served through jsDelivr. Files are named by content hash and URLs pin the commit, so they never change.
 * Each image is also converted to WebP (lossless for pixel art) and the smaller file is kept. Requires ImageMagick.
 *
 * An image line with several URLs (before, after, ...) becomes one side-by-side animated WebP.
 * Images at least twice as wide as tall (side-by-side comparisons) get twice the normal width in the HTML.
 *
 * Usage: deno task html dist/<period>/changelog.txt (or changelog.en.txt); writes the .html beside it.
 */

import $ from "@david/dax"
import { encodeHex } from "@std/encoding/hex"
import { join } from "@std/path"

import {
  mapPostImages,
  postImageUrls,
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

/** A source of several URLs becomes one before/after comparison image. */
const download = async (url: string) => {
  if (url.includes(" ")) {
    const output = await Deno.makeTempFile({ suffix: ".webp" })
    try {
      await beforeAfter({ sources: url.split(" "), output })
      return compress(await Deno.readFile(output), "webp")
    } finally {
      await Deno.remove(output)
    }
  }
  if (url.startsWith("file:")) {
    return compress(await Deno.readFile(new URL(url)), url.split(".").at(-1)!)
  }
  const response = await fetchWithTimeout(url)
  const type = response.headers.get("content-type")?.split(";")[0] ?? ""
  const extension = extensions[type]
  if (!response.ok || !extension) {
    await response.body?.cancel()
    throw new Error(`이미지 다운로드 실패: ${url} (${response.status} ${type})`)
  }
  return compress(new Uint8Array(await response.arrayBuffer()), extension)
}

/** Pixel art is small or palette-sized, and lossy compression would blur it. Returns nothing when ImageMagick cannot read the image. */
export const isPixelArt = async (
  bytes: Uint8Array<ArrayBuffer>,
): Promise<boolean | undefined> => {
  const result = await $`magick identify -format ${"%w %h %k"} -[0]`
    .stdin(bytes).stdout("piped").stderr("null").noThrow()
  if (result.code !== 0) return undefined
  const [width, height, colors] = result.stdout.split(" ").map(Number)
  return Math.max(width, height) <= pixelArtMaxSide ||
    colors <= pixelArtMaxColors
}

/** Returns WebP bytes, or nothing when ImageMagick cannot encode the image (for example beyond the WebP size limit). */
const toWebp = async (bytes: Uint8Array<ArrayBuffer>) => {
  const pixelArt = await isPixelArt(bytes)
  if (pixelArt === undefined) return undefined
  const mode = pixelArt
    ? ["-define", "webp:lossless=true"]
    : ["-quality", `${webpQuality}`]
  const result = await $`magick - ${mode} webp:-`.stdin(bytes).stdout("piped")
    .stderr("null").noThrow()
  return result.code === 0 ? new Uint8Array(result.stdoutBytes) : undefined
}

/** Keeps whichever of the original and its WebP copy is smaller. */
const compress = async (bytes: Uint8Array<ArrayBuffer>, extension: string) => {
  const webp = extension === "webp" ? undefined : await toWebp(bytes)
  const smaller = webp && webp.length < bytes.length
  const output = smaller ? webp : bytes
  const digest = await crypto.subtle.digest("SHA-256", output)
  return {
    name: `${encodeHex(digest)}.${smaller ? "webp" : extension}`,
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

const isWide = async (bytes: Uint8Array<ArrayBuffer>): Promise<boolean> => {
  const result = await $`magick identify -format ${"%w %h"} -[0]`
    .stdin(bytes).stdout("piped").stderr("null").noThrow()
  const [width, height] = result.stdout.split(" ").map(Number)
  return result.code === 0 && width >= wideRatio * height
}

const mirror = async (
  post: string,
  { remote, cdn }: MirrorOptions,
): Promise<{ post: string; wide: Set<string> }> => {
  const urls = postImageUrls(post)
  if (urls.length === 0) return { post, wide: new Set() }

  const dir = await Deno.makeTempDir({ prefix: "dc-changelog-images-" })
  try {
    await $`git clone --quiet --depth 1 --branch ${branch} ${remote} ${dir}`
    const files = await Promise.all(urls.map(async (url) => {
      const { name, bytes } = await download(url)
      await Deno.writeFile(join(dir, name), bytes)
      return { name, wide: await isWide(bytes) }
    }))
    await $`git -C ${dir} add --all`
    const unchanged = await $`git -C ${dir} diff --cached --quiet`.noThrow()
    if (unchanged.code !== 0) {
      await $`git -C ${dir} commit --quiet -m ${"chore: add post images"}`
      await $`git -C ${dir} push --quiet origin HEAD:${branch}`
    }
    const commit = await $`git -C ${dir} rev-parse HEAD`.text()
    const mirrored = files.map(({ name }) => `${cdn}@${commit}/${name}`)
    await Promise.all(mirrored.map(assertServed))
    return {
      post: mapPostImages(post, (url) => mirrored[urls.indexOf(url)]),
      wide: new Set(mirrored.filter((_, index) => files[index].wide)),
    }
  } finally {
    await Deno.remove(dir, { recursive: true })
  }
}

/** Returns the post with its image URLs replaced by CDN URLs of copies pushed to the images branch. */
export const mirrorPostImages = async (
  post: string,
  options: MirrorOptions = defaults,
): Promise<string> => (await mirror(post, options)).post

/** Mirrors the post images and renders the post HTML with the CDN URLs. */
export const mirrorPostHtml = async (
  post: string,
  options: MirrorOptions = defaults,
): Promise<string> => {
  const mirrored = await mirror(post, options)
  return renderPostHtml(mirrored.post, mirrored.wide)
}

if (import.meta.main) {
  const [changelog] = Deno.args
  if (!changelog?.endsWith(".txt")) {
    throw new Error("Usage: deno task html <changelog.txt|changelog.en.txt>")
  }
  const post = await Deno.readTextFile(changelog)
  await Deno.writeTextFile(
    changelog.replace(/\.txt$/u, ".html"),
    await mirrorPostHtml(post),
  )
}
