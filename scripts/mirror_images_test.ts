import { mkdtemp, rm } from "node:fs/promises"
import { createServer } from "node:http"
import type { AddressInfo } from "node:net"
import { tmpdir } from "node:os"
import $ from "dax"
import { expect, test } from "vite-plus/test"
import { join } from "node:path"

import { mirrorPost, mirrorPostImages } from "./mirror_images.ts"

const magick = async (...args: string[]) => new Uint8Array(await $`magick ${args}`.bytes())
const png = await magick("-size", "8x8", "xc:red", "png:-")
const webp = await magick("-size", "8x8", "xc:red", "-define", "webp:lossless=true", "webp:-")
const photo = await magick("-size", "300x300", "plasma:fractal", "png:-")
const wide = await magick("-size", "20x10", "xc:blue", "png:-")
const sha256 = async (bytes: Uint8Array<ArrayBuffer>) =>
  Buffer.from(await crypto.subtle.digest("SHA-256", bytes)).toString("hex")
const pngName = `${await sha256(png)}.png`
const webpName = `${await sha256(webp)}.webp`

/** Serve `handler` on a free localhost port. */
const serve = async (handler: (url: URL) => Response) => {
  const server = createServer(async (request, response) => {
    const reply = handler(new URL(request.url!, "http://localhost"))
    response.writeHead(reply.status, Object.fromEntries(reply.headers))
    response.end(Buffer.from(await reply.arrayBuffer()))
  })
  await new Promise<void>((done) => server.listen(0, "localhost", done))
  return {
    port: (server.address() as AddressInfo).port,
    shutdown: () => new Promise((done) => server.close(done)),
  }
}

const isolateGit = () => {
  for (const name of Object.keys({ ...process.env })) {
    if (name.startsWith("GIT_")) delete process.env[name]
  }
  process.env["GIT_CONFIG_GLOBAL"] = "/dev/null"
  process.env["GIT_CONFIG_NOSYSTEM"] = "1"
  for (const role of ["AUTHOR", "COMMITTER"]) {
    process.env[`GIT_${role}_NAME`] = "test"
    process.env[`GIT_${role}_EMAIL`] = "test@example.test"
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
  const saved = { ...process.env }
  isolateGit()
  const root = await mkdtemp(join(tmpdir(), "changelog-"))
  const remote = join(root, "remote.git")
  await $`git init --quiet --bare --initial-branch=main ${remote}`
  const tree = await $`git -C ${remote} mktree`.stdinText("").text()
  const seed = await $`git -C ${remote} commit-tree ${tree} -m seed`.text()
  await $`git -C ${remote} update-ref refs/heads/images ${seed}`

  const server = await serve(({ pathname }) => {
    if (pathname === "/a.png") {
      return new Response(webp, { headers: { "content-type": "image/webp" } })
    }
    if (pathname === "/small.png") {
      return new Response(png, { headers: { "content-type": "image/png" } })
    }
    if (pathname === "/photo.png") {
      return new Response(photo, { headers: { "content-type": "image/png" } })
    }
    if (pathname === "/wide.png") {
      return new Response(wide, { headers: { "content-type": "image/png" } })
    }
    if (pathname === "/broken.png") {
      return new Response(new Uint8Array(100).fill(7), {
        headers: { "content-type": "image/png" },
      })
    }
    if (pathname === "/page") {
      return new Response("x", { headers: { "content-type": "text/html" } })
    }
    return new Response(null, {
      status: pathname.startsWith("/missing") ? 403 : 200,
    })
  })
  const base = `http://localhost:${server.port}`
  try {
    await run({
      remote,
      cdn: `${base}/cdn`,
      source: base,
      tip: () => $`git -C ${remote} rev-parse images`.text(),
    })
  } finally {
    await server.shutdown()
    await rm(root, { recursive: true })
    for (const name of Object.keys({ ...process.env })) delete process.env[name]
    for (const [name, value] of Object.entries(saved)) {
      process.env[name] = value
    }
  }
}

test("mirrorPostImages pushes each image once and rewrites the post to pinned CDN URLs", async () => {
  await withMirror(async ({ remote, cdn, source, tip }) => {
    const before = await tip()
    const post = `# 제목\n## 항목\n![](${source}/a.png)\n![설명](${source}/a.png)\n`

    const mirrored = await mirrorPostImages(post, { remote, cdn })

    const commit = await tip()
    const url = `${cdn}@${commit}/${webpName}`
    expect(mirrored).toEqual(`# 제목\n## 항목\n![](${url})\n![설명](${url})\n`)
    expect(await $`git -C ${remote} rev-parse ${commit}~1`.text()).toEqual(before)
    expect(await $`git -C ${remote} ls-tree --name-only ${commit}`.text()).toEqual(webpName)
    expect(await mirrorPostImages(post, { remote, cdn })).toEqual(mirrored)
    expect(await tip()).toEqual(commit)
  })
})

test("mirrorPostImages keeps the smaller of the original and its WebP copy", async () => {
  await withMirror(async ({ remote, cdn, source, tip }) => {
    const mirrored = await mirrorPostImages(
      `# 제목\n## 항목\n![](${source}/small.png)\n![](${source}/photo.png)\n`,
      { remote, cdn },
    )

    const commit = await tip()
    const names = (await $`git -C ${remote} ls-tree --name-only ${commit}`.text()).split("\n")
    const webps = names.filter((name) => name.endsWith(".webp"))
    expect(webps.length >= 1).toEqual(true)
    for (const name of names) {
      expect(mirrored).toContain(`@${commit}/${name}`)
      const stored = new Uint8Array(
        await $`git -C ${remote} cat-file blob ${commit}:${name}`.bytes(),
      )
      expect(name.split(".")[0]).toEqual(await sha256(stored))
      expect(new TextDecoder().decode(stored.slice(8, 12)) === "WEBP").toEqual(
        name.endsWith(".webp"),
      )
    }
    expect(names.includes(pngName)).toEqual(png.length <= webp.length)
  })
})

test("mirrorPost doubles the width of images at least twice as wide as tall", async () => {
  await withMirror(async ({ remote, cdn, source }) => {
    // 20x10 (ratio 2) gets 850px, 8x8 keeps 425px.
    const { html } = await mirrorPost(
      `# 제목\n## 항목\n![](${source}/wide.png)\n![](${source}/small.png)\n`,
      { remote, cdn },
    )
    expect([...html.matchAll(/max-width:(\d+)px/gu)].map((match) => match[1])).toEqual([
      "850",
      "425",
    ])
  })
})

test("mirrorPostImages turns a before/after line into one animated WebP and mirrors table images", async () => {
  await withMirror(async ({ remote, cdn, source, tip }) => {
    // Two pairs make two frames; the table cell image is mirrored on its own.
    const mirrored = await mirrorPostImages(
      `# 제목\n## 항목\n![](${source}/a.png ${source}/photo.png ${source}/photo.png ${source}/a.png)\n| 전 | ![](${source}/a.png) |\n`,
      { remote, cdn },
    )

    const commit = await tip()
    const names = (await $`git -C ${remote} ls-tree --name-only ${commit}`.text()).split("\n")
    const compare = names.find((name) => name !== webpName)!
    expect(mirrored).toEqual(
      `# 제목\n## 항목\n![](${cdn}@${commit}/${compare})\n| 전 | ![](${cdn}@${commit}/${webpName}) |\n`,
    )
    const frames = await $`git -C ${remote} cat-file blob ${commit}:${compare}`
      .pipe($`magick identify -format ${"%n\n"} -`)
      .text()
    expect(frames.split("\n")[0]).toEqual("2")
  })
})

test("mirrorPostImages keeps images ImageMagick cannot encode as WebP", async () => {
  const tall = await magick("-size", "300x17000", "gradient:red-blue", "png:-")
  const server = await serve(() => new Response(tall, { headers: { "content-type": "image/png" } }))
  try {
    await withMirror(async ({ remote, cdn, tip }) => {
      const mirrored = await mirrorPostImages(
        `# 제목\n![](http://localhost:${server.port}/tall.png)`,
        { remote, cdn },
      )
      expect(mirrored).toContain(`/${await sha256(tall)}.png`)
      expect(await $`git -C ${remote} ls-tree --name-only ${await tip()}`.text()).toEqual(
        `${await sha256(tall)}.png`,
      )
    })
  } finally {
    await server.shutdown()
  }
})

test("mirrorPostImages keeps images ImageMagick cannot read", async () => {
  await withMirror(async ({ remote, cdn, source, tip }) => {
    const mirrored = await mirrorPostImages(`# 제목\n![](${source}/broken.png)`, { remote, cdn })
    const name = `${await sha256(new Uint8Array(100).fill(7))}.png`
    expect(mirrored).toEqual(`# 제목\n![](${cdn}@${await tip()}/${name})`)
  })
})

test("mirrorPostImages rejects non-images and images the CDN does not serve", async () => {
  await withMirror(async ({ remote, cdn, source, tip }) => {
    const before = await tip()
    await expect(() =>
      mirrorPostImages(`# 제목\n![](${source}/page)`, { remote, cdn }),
    ).rejects.toThrow("이미지 다운로드 실패")
    expect(await tip()).toEqual(before)

    await expect(
      mirrorPostImages(`# 제목\n![](${source}/a.png)`, {
        remote,
        cdn: `${source}/missing`,
      }),
    ).rejects.toThrow("CDN 응답 실패")
  })
})

test("mirrorPostImages leaves a post without images untouched", async () => {
  expect(
    await mirrorPostImages("# 제목\n## 항목\n", {
      remote: "/nonexistent",
      cdn: "http://localhost:1",
    }),
  ).toEqual("# 제목\n## 항목\n")
})

test("mirrorPostImages rewrites whole image URLs and leaves heading links alone", async () => {
  await withMirror(async ({ remote, cdn, source, tip }) => {
    const mirrored = await mirrorPostImages(
      `# 제목\n## [항목](${source}/a.png)\n![](${source}/a.png)\n![](${source}/a.png?raw=1)\n`,
      { remote, cdn },
    )

    const url = `${cdn}@${await tip()}/${webpName}`
    expect(mirrored).toEqual(`# 제목\n## [항목](${source}/a.png)\n![](${url})\n![](${url})\n`)
  })
})
