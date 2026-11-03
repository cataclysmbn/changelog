import $ from "@david/dax"
import { assertEquals, assertRejects, assertStringIncludes } from "@std/assert"
import { join } from "@std/path"

import { mirrorPostImages } from "./mirror_images.ts"

const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47])
const pngName =
  "0f4636c78f65d3639ece5a064b5ae753e3408614a14fb18ab4d7540d2c248543.png"

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
