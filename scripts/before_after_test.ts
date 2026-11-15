import $ from "@david/dax"
import { assertEquals, assertRejects } from "@std/assert"
import { join } from "@std/path"

import { beforeAfter } from "./before_after.ts"

const withDir = async (run: (dir: string) => Promise<void>) => {
  const dir = await Deno.makeTempDir()
  try {
    await run(dir)
  } finally {
    await Deno.remove(dir, { recursive: true })
  }
}

const solid = async (
  dir: string,
  name: string,
  size: string,
  color: string,
) => {
  const file = join(dir, `${name}.png`)
  await $`magick -size ${size} xc:${color} ${file}`
  return file
}

const pixel = (file: string, x: number, y: number) =>
  $`magick ${file} -format ${`%[pixel:p{${x},${y}}]`} info:`.text()

Deno.test("beforeAfter puts each before left and after right, one frame per pair, 1 s each, looped", () =>
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
    const sizes = await $`magick identify -format ${"%w %h %T\n"} ${output}`
      .lines()
    assertEquals(sizes.length, 2)
    const first = join(dir, "frame-0.png")
    const second = join(dir, "frame-1.png")
    assertEquals(
      await $`magick identify -format ${"%w %h"} ${first}`.text(),
      `${200 + 8 + 200} ${44 + 120}`,
    )
    assertEquals(await pixel(first, 100, 104), "srgb(255,0,0)")
    assertEquals(await pixel(first, 308, 104), "srgb(0,0,255)")
    assertEquals(await pixel(second, 100, 104), "srgb(0,255,0)")
    assertEquals(await pixel(second, 308, 104), "srgb(255,255,0)")
    assertEquals(sizes.map((line) => line.split(" ")[2]), ["100", "100"])
    // ANIM chunk: tag, size, background color, then the loop count (0 = forever).
    const bytes = await Deno.readFile(output)
    const anim = new TextDecoder().decode(bytes).indexOf("ANIM")
    assertEquals(new DataView(bytes.buffer).getUint16(anim + 12, true), 0)
  }))

Deno.test("beforeAfter rejects a before image without its after image", () =>
  withDir(async (dir) => {
    const before = await solid(dir, "b", "8x8", "red")
    await assertRejects(
      () => beforeAfter({ sources: [before], output: join(dir, "out.webp") }),
      Error,
      "짝",
    )
  }))
