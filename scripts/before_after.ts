/**
 * @module
 *
 * Builds a looping animated WebP that shows before/after screenshot pairs side by side, `Before` on the left and
 * `After` on the right. Each pair is one frame. It refuses animated sources, because a panel shows only their first
 * frame. Requires ImageMagick.
 *
 * Usage: vp run compare -o out.webp BEFORE1 AFTER1 [BEFORE2 AFTER2 ...]; each source is a URL or a file path.
 */

import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import $ from "dax"
import { Command } from "@cliffy/command"
import { join } from "node:path"

import { isAnimated, isPixelArt, webpQuality } from "./mirror_images.ts"

const background = "#202020"
const labelHeight = 44
const gap = 8

const read = async (source: string): Promise<Uint8Array<ArrayBuffer>> => {
  if (!/^https?:/u.test(source)) return await readFile(source)
  const response = await fetch(source, { signal: AbortSignal.timeout(60_000) })
  if (!response.ok) {
    await response.body?.cancel()
    throw new Error(`이미지 다운로드 실패: ${source} (${response.status})`)
  }
  return new Uint8Array(await response.arrayBuffer())
}

const panel = (file: string, label: string, size: string) => [
  "(",
  file,
  "-background",
  background,
  "-gravity",
  "center",
  "-extent",
  size,
  "-gravity",
  "north",
  "-splice",
  `0x${labelHeight}`,
  "-font",
  "Noto-Sans-Bold",
  "-pointsize",
  "28",
  "-fill",
  "white",
  "-annotate",
  "+0+4",
  label,
  ")",
]

/** Writes the comparison to `output`; sources alternate before, after. Panels pad every image to the largest size without scaling. */
export const beforeAfter = async ({
  sources,
  output,
  delay = 1,
}: {
  sources: string[]
  output: string
  delay?: number
}): Promise<void> => {
  if (sources.length === 0 || sources.length % 2 !== 0) {
    throw new Error("이미지는 before, after 순서의 짝으로 주세요")
  }
  const dir = await mkdtemp(join(tmpdir(), "dc-changelog-compare-"))
  try {
    const images = await Promise.all(sources.map(read))
    const animated = (await Promise.all(images.map(isAnimated))).indexOf(true)
    if (animated !== -1) {
      throw new Error(`움직이는 이미지는 합치지 말고 그대로 쓰세요: ${sources[animated]}`)
    }
    const files = await Promise.all(
      images.map(async (bytes, index) => {
        const file = join(dir, `${index}`)
        await writeFile(file, bytes)
        return `${file}[0]`
      }),
    )
    const sizes = (await $`magick identify -format ${"%w %h\n"} ${files}`.text())
      .split("\n")
      .map((line) => line.split(" ").map(Number))
    const size = `${Math.max(...sizes.map(([w]) => w))}x${Math.max(...sizes.map(([, h]) => h))}`
    const frames = await Promise.all(
      Array.from({ length: files.length / 2 }, async (_, index) => {
        const frame = join(dir, `frame-${index}.png`)
        await $`magick ${[
          ...panel(files[2 * index], "Before", size),
          ...panel(files[2 * index + 1], "After", size),
        ]} -background ${background} -gravity west -splice ${`${gap}x0`} +append -chop ${`${gap}x0`} ${frame}`
        return frame
      }),
    )
    const lossless = await isPixelArt(images[0])
    const mode = lossless ? ["-define", "webp:lossless=true"] : ["-quality", `${webpQuality}`]
    await $`magick -delay ${delay * 100} ${frames} -loop 0 ${mode} webp:${output}`
  } finally {
    await rm(dir, { recursive: true })
  }
}

if (import.meta.main) {
  await new Command()
    .name("before-after")
    .description(
      "Build a looping side-by-side before/after animated WebP; sources alternate BEFORE AFTER.",
    )
    .arguments("<sources...:string>")
    .option("-o, --output <file:string>", "Output WebP path", {
      required: true,
    })
    .option("-d, --delay <seconds:number>", "Seconds per frame", { default: 1 })
    .action(({ output, delay }, ...sources) => beforeAfter({ sources, output, delay }))
    .parse(process.argv.slice(2))
}
