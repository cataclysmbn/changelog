import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import $ from "dax"
import { expect, test } from "vite-plus/test"
import { join } from "node:path"

import { beforeAfter } from "./before_after.ts"

const withDir = async (run: (dir: string) => Promise<void>) => {
  const dir = await mkdtemp(join(tmpdir(), "changelog-"))
  try {
    await run(dir)
  } finally {
    await rm(dir, { recursive: true })
  }
}

const solid = async (dir: string, name: string, size: string, color: string) => {
  const file = join(dir, `${name}.png`)
  await $`magick -size ${size} xc:${color} ${file}`
  return file
}

const pixel = (file: string, x: number, y: number) =>
  $`magick ${file} -format ${`%[pixel:p{${x},${y}}]`} info:`.text()

test("beforeAfter puts each before left and after right, one frame per pair, 1 s each, looped", () =>
  withDir(async (dir) => {
    // 200x100 red | 160x120 blue, then 200x100 green | 200x100 yellow: panels pad to 200x120, gap 8, label 44 on top.
    const sources = [
      await solid(dir, "b1", "200x100", "red"),
      await solid(dir, "a1", "160x120", "blue"),
      await solid(dir, "b2", "200x100", "lime"),
      await solid(dir, "a2", "200x100", "yellow"),
    ]
    const output = join(dir, "out.webp")
    await beforeAfter({ sources, output })

    const frames = join(dir, "frame-%d.png")
    await $`magick ${output} -coalesce ${frames}`
    const sizes = await $`magick identify -format ${"%w %h %T\n"} ${output}`.lines()
    expect(sizes.length).toEqual(2)
    const first = join(dir, "frame-0.png")
    const second = join(dir, "frame-1.png")
    expect(await $`magick identify -format ${"%w %h"} ${first}`.text()).toEqual(
      `${200 + 8 + 200} ${44 + 120}`,
    )
    expect(await pixel(first, 100, 104)).toEqual("srgb(255,0,0)")
    expect(await pixel(first, 308, 104)).toEqual("srgb(0,0,255)")
    expect(await pixel(second, 100, 104)).toEqual("srgb(0,255,0)")
    expect(await pixel(second, 308, 104)).toEqual("srgb(255,255,0)")
    expect(sizes.map((line) => line.split(" ")[2])).toEqual(["100", "100"])
    // ANIM chunk: tag, size, background color, then the loop count (0 = forever).
    const bytes = await readFile(output)
    const anim = new TextDecoder().decode(bytes).indexOf("ANIM")
    expect(new DataView(bytes.buffer).getUint16(anim + 12, true)).toEqual(0)
  }))

test("beforeAfter rejects a before image without its after image", () =>
  withDir(async (dir) => {
    const before = await solid(dir, "b", "8x8", "red")
    await expect(() =>
      beforeAfter({ sources: [before], output: join(dir, "out.webp") }),
    ).rejects.toThrow("짝")
  }))

test("beforeAfter rejects animated images, which it would cut to their first frame", () =>
  withDir(async (dir) => {
    const before = join(dir, "before.webp")
    await $`magick -delay 10 -size 8x8 xc:red xc:blue -loop 0 ${before}`
    const after = await solid(dir, "a", "8x8", "blue")
    await expect(() =>
      beforeAfter({ sources: [before, after], output: join(dir, "out.webp") }),
    ).rejects.toThrow("움직이는 이미지")
  }))
