#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env --allow-net
/**
 * @module
 *
 * DCInside deletes GitHub image URLs from posts, so post images are copied to the `images` branch of this public
 * repository and served through jsDelivr. Files are named by content hash and URLs pin the commit, so they never change.
 * Each image is also converted to WebP (lossless for pixel art) and the smaller file is kept. Requires ImageMagick.
 *
 * Usage: deno task html dist/<period>/changelog.txt
 */

import $ from "@david/dax"
import { encodeHex } from "@std/encoding/hex"
import { dirname, join } from "@std/path"

import {
  mapPostImages,
  postImageUrls,
  renderPostHtml,
} from "../src/dcinside.ts"

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

const webpQuality = 50
const pixelArtMaxSide = 128
const pixelArtMaxColors = 256

const fetchWithTimeout = (url: string): Promise<Response> =>
  fetch(url, { signal: AbortSignal.timeout(60_000) })

const download = async (url: string) => {
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
const isPixelArt = async (
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

/** Returns the post with its image URLs replaced by CDN URLs of copies pushed to the images branch. */
export const mirrorPostImages = async (
  post: string,
  { remote, cdn }: MirrorOptions = defaults,
): Promise<string> => {
  const urls = postImageUrls(post)
  if (urls.length === 0) return post

  const dir = await Deno.makeTempDir({ prefix: "dc-changelog-images-" })
  try {
    await $`git clone --quiet --depth 1 --branch ${branch} ${remote} ${dir}`
    const names = await Promise.all(urls.map(async (url) => {
      const { name, bytes } = await download(url)
      await Deno.writeFile(join(dir, name), bytes)
      return name
    }))
    await $`git -C ${dir} add --all`
    const unchanged = await $`git -C ${dir} diff --cached --quiet`.noThrow()
    if (unchanged.code !== 0) {
      await $`git -C ${dir} commit --quiet -m ${"chore: add post images"}`
      await $`git -C ${dir} push --quiet origin HEAD:${branch}`
    }
    const commit = await $`git -C ${dir} rev-parse HEAD`.text()
    const mirrored = names.map((name) => `${cdn}@${commit}/${name}`)
    await Promise.all(mirrored.map(assertServed))
    return mapPostImages(post, (url) => mirrored[urls.indexOf(url)])
  } finally {
    await Deno.remove(dir, { recursive: true })
  }
}

if (import.meta.main) {
  const [changelog] = Deno.args
  if (!changelog) throw new Error("Usage: deno task html <changelog.txt>")
  const post = await Deno.readTextFile(changelog)
  await Deno.writeTextFile(
    join(dirname(changelog), "changelog.html"),
    renderPostHtml(await mirrorPostImages(post)),
  )
}
