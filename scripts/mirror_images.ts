#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env --allow-net
/**
 * @module
 *
 * DCInside deletes GitHub image URLs from posts, so post images are copied to the `images` branch of this public
 * repository and served through jsDelivr. Files are named by content hash and URLs pin the commit, so they never change.
 * Pixel art and GIFs are kept as they are; other PNG and JPEG images are compressed to WebP. Requires ImageMagick.
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
  remote: "https://github.com/scarf005/cbn-dc-changelog.git",
  cdn: "https://cdn.jsdelivr.net/gh/scarf005/cbn-dc-changelog",
}

const webpQuality = 50
const pixelArtMaxSide = 128
const pixelArtMaxColors = 256
const webpMaxSide = 16383

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

/** Pixel art is small or palette-sized, and lossy compression would blur it. Images beyond the WebP size limit stay as they are. */
const keepsOriginal = async (
  bytes: Uint8Array<ArrayBuffer>,
): Promise<boolean> => {
  const info = await $`magick identify -format ${"%w %h %k"} -`.stdin(bytes)
    .text()
  const [width, height, colors] = info.split(" ").map(Number)
  const side = Math.max(width, height)
  return side <= pixelArtMaxSide || colors <= pixelArtMaxColors ||
    side > webpMaxSide
}

const compress = async (bytes: Uint8Array<ArrayBuffer>, extension: string) => {
  const lossy = extension === "png" || extension === "jpg"
  const converted = lossy && !(await keepsOriginal(bytes))
  const output = converted
    ? new Uint8Array(
      await $`magick - -quality ${webpQuality} webp:-`.stdin(bytes).bytes(),
    )
    : bytes
  const digest = await crypto.subtle.digest("SHA-256", output)
  return {
    name: `${encodeHex(digest)}.${converted ? "webp" : extension}`,
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
