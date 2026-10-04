import {
  assertEquals,
  assertRejects,
  assertStringIncludes,
  assertThrows,
} from "@std/assert"
import { join } from "@std/path"

import { runUpload } from "../scripts/dc_upload.ts"
import {
  collectUploadAssets,
  parseUploadResult,
  uploadBrowserCode,
} from "./upload.ts"

const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
const assets = [{ files: ["/images/pr-1-1.png"] }]
const image = {
  ...assets[0],
  src: "https://dcimg1.dcinside.com/viewimage.php?id=rlike&no=image",
  tempno: "123",
  width: 600,
  height: 395,
}
const output = (value: unknown): string =>
  `### Result\n${JSON.stringify(value)}\n### Ran Playwright code\nignored`

Deno.test("collects only referenced images and deduplicates content across directories", async () => {
  const root = await Deno.makeTempDir()
  try {
    const first = join(root, "first")
    const second = join(root, "second")
    await Deno.mkdir(first)
    await Deno.mkdir(second)
    await Deno.writeTextFile(
      join(first, "changelog.txt"),
      "title\npr-1-1.png\npr-1-1.png\n* pr-2-1.png mentioned in prose\n",
    )
    await Deno.writeTextFile(join(second, "changelog.txt"), "pr-3-1.png\r\n")
    await Deno.writeFile(join(first, "pr-1-1.png"), png)
    await Deno.writeFile(join(first, "pr-2-1.png"), png)
    await Deno.writeFile(join(second, "pr-3-1.png"), png)
    assertEquals(await collectUploadAssets([first, second, first]), [{
      files: [join(first, "pr-1-1.png"), join(second, "pr-3-1.png")],
    }])
    await Deno.writeFile(
      join(second, "pr-3-1.png"),
      new Uint8Array([...png, 1]),
    )
    assertEquals((await collectUploadAssets([first, second])).length, 2)
  } finally {
    await Deno.remove(root, { recursive: true })
  }
})

Deno.test("missing, non-image, oversized and external symlink files fail before upload", async () => {
  const root = await Deno.makeTempDir()
  try {
    const dir = join(root, "post")
    await Deno.mkdir(dir)
    const file = join(dir, "pr-1-1.png")
    await Deno.writeTextFile(join(dir, "changelog.txt"), "pr-1-1.png\n")
    await assertRejects(() => collectUploadAssets([dir]), Deno.errors.NotFound)
    await Deno.writeTextFile(file, "not an image")
    await assertRejects(() => collectUploadAssets([dir]), Error, "이미지 형식")
    await Deno.writeFile(file, png)
    await Deno.truncate(file, 20_000_001)
    await assertRejects(() => collectUploadAssets([dir]), Error, "20MB")
    await Deno.remove(file)
    const outside = join(root, "outside.png")
    await Deno.writeFile(outside, png)
    await Deno.symlink(outside, file)
    await assertRejects(() => collectUploadAssets([dir]), Error, "외부 경로")
  } finally {
    await Deno.remove(root, { recursive: true })
  }
})

Deno.test("upload response preserves exact source mapping and validates loaded CDN images", () => {
  assertEquals(parseUploadResult(output([image]), assets), [image])
  assertEquals(
    parseUploadResult(`### Result\n${JSON.stringify([image])}`, assets),
    [image],
  )
  for (
    const invalid of [
      [],
      [{ ...image, files: ["/wrong.png"] }],
      [{ ...image, src: "https://example.com/image.png" }],
      [{
        ...image,
        src: "https://dcimg1.dcinside.com.evil.test/viewimage.php?id=x",
      }],
      [{ ...image, width: 0 }],
      [{ ...image, tempno: '123"]' }],
      [{ ...image, unexpected: "secret" }],
    ]
  ) {
    assertThrows(() => parseUploadResult(output(invalid), assets))
  }
  assertThrows(() => parseUploadResult("### Error\nsecret", assets))
  const error = assertThrows(
    () => parseUploadResult("### Result\nsecret credential", assets),
    Error,
  )
  assertEquals(error.message.includes("credential"), false)
  assertThrows(() =>
    parseUploadResult(output([image, image]), [assets[0], assets[0]])
  )
})

Deno.test("browser code handles empty, 50 and 51 image batches without relying on thumbnail order", async () => {
  for (const count of [0, 50, 51]) {
    let nextId = 1
    let popups = 0
    const selected: string[] = []
    const makeEditor = (): Record<string, unknown> => {
      const ids: string[] = []
      const popup = {
        locator: () => ({
          waitFor: () => Promise.resolve(),
          count: () => Promise.resolve(ids.length),
          setInputFiles: (file: string) => {
            selected.push(file)
            ids.unshift(String(nextId++))
            return Promise.resolve()
          },
          evaluateAll: (
            callback: (
              nodes: { dataset: { no: string } }[],
              known: string[],
            ) => string[],
            known: string[],
          ) =>
            Promise.resolve(
              callback(ids.map((no) => ({ dataset: { no } })), known),
            ),
        }),
        waitForFunction: () => Promise.resolve(),
        waitForEvent: () => Promise.resolve(),
        getByRole: (_role: string, { name }: { name: string }) => ({
          click: () => {
            assertEquals(name, "적용")
            return Promise.resolve()
          },
        }),
      }
      return {
        context: () => ({ newPage: () => Promise.resolve(makeEditor()) }),
        goto: () => Promise.resolve(),
        waitForEvent: () => {
          popups++
          return Promise.resolve(popup)
        },
        waitForFunction: () => Promise.resolve(),
        getByRole: (_role: string, { name }: { name: string }) => ({
          click: () => {
            assertEquals(name, "이미지")
            return Promise.resolve()
          },
        }),
        locator: () => ({
          waitFor: () => Promise.resolve(),
          evaluate: (
            callback: (
              node: {
                src: string
                naturalWidth: number
                naturalHeight: number
              },
              entry: unknown,
            ) => unknown,
            entry: unknown,
          ) =>
            Promise.resolve(
              callback({
                src: image.src,
                naturalWidth: 600,
                naturalHeight: 395,
              }, entry),
            ),
        }),
      }
    }
    const items = Array.from(
      { length: count },
      (_, index) => ({ files: [`/sources/pr-${index}-1.png`] }),
    )
    const paths = items.map((_, index) => `/workspace/${index}.png`)
    const callback = new Function(
      `return (${uploadBrowserCode(items, paths)})`,
    )()
    const result = await callback(makeEditor())
    assertEquals(popups, Math.ceil(count / 50))
    assertEquals(selected, paths)
    assertEquals(
      parseUploadResult(output(result), items).map((entry) => entry.tempno),
      items.map((_, index) => String(index + 1)),
    )
  }
})

Deno.test("browser code keeps source paths as data and never submits a post", () => {
  const file = '/images/quotes" and \\slashes/pr-1-1.png'
  const code = uploadBrowserCode([{ files: [file] }])
  const callback = new Function(`return (${code})`)()
  assertEquals(typeof callback, "function")
  assertStringIncludes(code, JSON.stringify(file))
  assertStringIncludes(code, "start += 50")
  assertStringIncludes(code, 'name: "적용"')
  assertEquals(code.includes("등록"), false)
  assertEquals(code.includes("changelog.txt"), false)
})

Deno.test("empty changelogs and existing upload mappings do not start a browser or change posts", async () => {
  const dir = await Deno.makeTempDir()
  try {
    const text = "title\n* no images\n"
    await Deno.writeTextFile(join(dir, "changelog.txt"), text)
    await runUpload({ directories: [dir], playwright: "nonexistent-browser" })
    assertEquals(await Deno.readTextFile(join(dir, "changelog.txt")), text)
    await Deno.writeTextFile(join(dir, "uploads.json"), "user-owned")
    await assertRejects(
      () =>
        runUpload({ directories: [dir], playwright: "nonexistent-browser" }),
      Error,
      "이미 존재",
    )
    assertEquals(
      await Deno.readTextFile(join(dir, "uploads.json")),
      "user-owned",
    )
  } finally {
    await Deno.remove(dir, { recursive: true })
  }
})
