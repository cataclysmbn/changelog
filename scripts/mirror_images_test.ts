import $ from "@david/dax"
import { assertEquals, assertRejects, assertStringIncludes } from "@std/assert"
import { encodeHex } from "@std/encoding/hex"
import { join } from "@std/path"

import { mirrorPostImages } from "./mirror_images.ts"

const magick = async (...args: string[]) =>
  new Uint8Array(await $`magick ${args}`.bytes())
const png = await magick("-size", "8x8", "xc:red", "png:-")
const photo = await magick("-size", "300x300", "plasma:fractal", "png:-")
const sha256 = async (bytes: Uint8Array<ArrayBuffer>) =>
  encodeHex(await crypto.subtle.digest("SHA-256", bytes))
const pngName = `${await sha256(png)}.png`

const isolateGit = () => {
  for (const name of Object.keys(Deno.env.toObject())) {
    if (name.startsWith("GIT_")) Deno.env.delete(name)
  }
  Deno.env.set("GIT_CONFIG_GLOBAL", "/dev/null")
  Deno.env.set("GIT_CONFIG_NOSYSTEM", "1")
  for (const role of ["AUTHOR", "COMMITTER"]) {
    Deno.env.set(`GIT_${role}_NAME`, "test")
    Deno.env.set(`GIT_${role}_EMAIL`, "test@example.test")
  }
}

const withMirror = async (
  run: (options: {
    remote: string
    cdn: string
    source: string
    tip: () => Promise<string>
  }) => Promise<void>,
) => {
  const saved = Deno.env.toObject()
  isolateGit()
  const root = await Deno.makeTempDir()
  const remote = join(root, "remote.git")
  await $`git init --quiet --bare --initial-branch=main ${remote}`
  const tree = await $`git -C ${remote} mktree`.stdinText("").text()
  const seed = await $`git -C ${remote} commit-tree ${tree} -m seed`.text()
  await $`git -C ${remote} update-ref refs/heads/images ${seed}`

  const server = Deno.serve({ port: 0, onListen: () => {} }, (request) => {
    const { pathname } = new URL(request.url)
    if (pathname === "/a.png") {
      return new Response(png, { headers: { "content-type": "image/png" } })
    }
    if (pathname === "/photo.png") {
      return new Response(photo, { headers: { "content-type": "image/png" } })
    }
    if (pathname === "/page") {
      return new Response("x", { headers: { "content-type": "text/html" } })
    }
    return new Response(null, {
      status: pathname.startsWith("/missing") ? 403 : 200,
    })
  })
  const base = `http://localhost:${server.addr.port}`
  try {
    await run({
      remote,
      cdn: `${base}/cdn`,
      source: base,
      tip: () => $`git -C ${remote} rev-parse images`.text(),
    })
  } finally {
    await server.shutdown()
    await Deno.remove(root, { recursive: true })
    for (const name of Object.keys(Deno.env.toObject())) Deno.env.delete(name)
    for (const [name, value] of Object.entries(saved)) {
      Deno.env.set(name, value)
    }
  }
}

Deno.test("mirrorPostImages pushes each image once and rewrites the post to pinned CDN URLs", async () => {
  await withMirror(async ({ remote, cdn, source, tip }) => {
    const before = await tip()
    const post =
      `# 제목\n## 항목\n![](${source}/a.png)\n![설명](${source}/a.png)\n`

    const mirrored = await mirrorPostImages(post, { remote, cdn })

    const commit = await tip()
    const url = `${cdn}@${commit}/${pngName}`
    assertEquals(mirrored, `# 제목\n## 항목\n![](${url})\n![설명](${url})\n`)
    assertEquals(
      await $`git -C ${remote} rev-parse ${commit}~1`.text(),
      before,
    )
    assertEquals(
      await $`git -C ${remote} ls-tree --name-only ${commit}`.text(),
      pngName,
    )
    assertEquals(await mirrorPostImages(post, { remote, cdn }), mirrored)
    assertEquals(await tip(), commit)
  })
})

Deno.test("mirrorPostImages keeps pixel art as PNG and compresses other images to WebP", async () => {
  await withMirror(async ({ remote, cdn, source, tip }) => {
    const mirrored = await mirrorPostImages(
      `# 제목\n## 항목\n![](${source}/a.png)\n![](${source}/photo.png)\n`,
      { remote, cdn },
    )

    const commit = await tip()
    const names = (await $`git -C ${remote} ls-tree --name-only ${commit}`
      .text()).split("\n")
    const [webp] = names.filter((name) => name.endsWith(".webp"))
    assertEquals(names.sort(), [pngName, webp].sort())
    assertEquals(
      mirrored,
      `# 제목\n## 항목\n![](${cdn}@${commit}/${pngName})\n![](${cdn}@${commit}/${webp})\n`,
    )
    const stored = new Uint8Array(
      await $`git -C ${remote} cat-file blob ${commit}:${webp}`.bytes(),
    )
    assertEquals(new TextDecoder().decode(stored.slice(8, 12)), "WEBP")
    assertEquals(webp, `${await sha256(stored)}.webp`)
  })
})

Deno.test("mirrorPostImages keeps images beyond the WebP size limit as PNG", async () => {
  const tall = await magick("-size", "300x17000", "gradient:red-blue", "png:-")
  const server = Deno.serve(
    { port: 0, onListen: () => {} },
    () => new Response(tall, { headers: { "content-type": "image/png" } }),
  )
  try {
    await withMirror(async ({ remote, cdn, tip }) => {
      const mirrored = await mirrorPostImages(
        `# 제목\n![](http://localhost:${server.addr.port}/tall.png)`,
        { remote, cdn },
      )
      assertStringIncludes(mirrored, `/${await sha256(tall)}.png`)
      assertEquals(
        await $`git -C ${remote} ls-tree --name-only ${await tip()}`.text(),
        `${await sha256(tall)}.png`,
      )
    })
  } finally {
    await server.shutdown()
  }
})

Deno.test("mirrorPostImages rejects non-images and images the CDN does not serve", async () => {
  await withMirror(async ({ remote, cdn, source, tip }) => {
    const before = await tip()
    await assertRejects(
      () => mirrorPostImages(`# 제목\n![](${source}/page)`, { remote, cdn }),
      Error,
      "이미지 다운로드 실패",
    )
    assertEquals(await tip(), before)

    const error = await assertRejects(
      () =>
        mirrorPostImages(`# 제목\n![](${source}/a.png)`, {
          remote,
          cdn: `${source}/missing`,
        }),
      Error,
    )
    assertStringIncludes(error.message, "CDN 응답 실패")
  })
})

Deno.test("mirrorPostImages leaves a post without images untouched", async () => {
  assertEquals(
    await mirrorPostImages("# 제목\n## 항목\n", {
      remote: "/nonexistent",
      cdn: "http://localhost:1",
    }),
    "# 제목\n## 항목\n",
  )
})

Deno.test("mirrorPostImages rewrites whole image URLs and leaves heading links alone", async () => {
  await withMirror(async ({ remote, cdn, source, tip }) => {
    const mirrored = await mirrorPostImages(
      `# 제목\n## [항목](${source}/a.png)\n![](${source}/a.png)\n![](${source}/a.png?raw=1)\n`,
      { remote, cdn },
    )

    const url = `${cdn}@${await tip()}/${pngName}`
    assertEquals(
      mirrored,
      `# 제목\n## [항목](${source}/a.png)\n![](${url})\n![](${url})\n`,
    )
  })
})
