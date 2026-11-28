import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { fileURLToPath, pathToFileURL } from "node:url"
import $ from "dax"
import { expect, test } from "vite-plus/test"
import { join } from "node:path"

import { renderPostHtml } from "../src/dcinside.ts"
import { publishPages } from "./pages.ts"
import { buildSite } from "./site.ts"

const site = "https://example.test/changelog"

const writeFixturePost = async (root: string, name: string, image: string) => {
  const dir = join(root, name)
  await mkdir(dir)
  await writeFile(
    join(dir, "changelog.md"),
    `# 밝밤) 패치\n\n## [항목](https://example.test/pull/1)\n\n![](${image})\n\n---\n\n이 변경 내역은 AI(test)로 자동 생성되었습니다.\n`,
  )
  await writeFile(join(dir, "changelog.en.md"), "# BN changelog\n\nFix\n")
  await writeFile(join(dir, "description.txt"), "항목 & 수정\n로딩 2배\n")
  await writeFile(join(dir, "description.en.txt"), "Fix\nLoading 2x\n")
  return dir
}

test("publishPages commits both books newest first and buildSite serves each post with its DCInside page", async () => {
  const saved = { ...process.env }
  for (const name of Object.keys(saved)) {
    if (name.startsWith("GIT_")) delete process.env[name]
  }
  process.env["GIT_CONFIG_GLOBAL"] = "/dev/null"
  process.env["GIT_CONFIG_NOSYSTEM"] = "1"
  for (const role of ["AUTHOR", "COMMITTER"]) {
    process.env[`GIT_${role}_NAME`] = "test"
    process.env[`GIT_${role}_EMAIL`] = "test@example.test"
  }
  const root = await mkdtemp(join(tmpdir(), "changelog-"))
  const remote = join(root, "remote.git")
  const seed = join(root, "seed")
  try {
    // The remote main branch starts with this repository's book settings and no posts.
    await $`git init --quiet --bare --initial-branch=main ${remote}`
    await $`git init --quiet --initial-branch=main ${seed}`
    for (const code of ["ko", "en"]) {
      const book = fileURLToPath(new URL(`../book/${code}`, import.meta.url))
      await cp(book, join(seed, "book", code), { recursive: true })
      await rm(join(seed, "book", code, "src"), { recursive: true })
    }
    await $`git -C ${seed} add book`
    await $`git -C ${seed} commit --quiet -m seed`
    await $`git -C ${seed} push --quiet ${remote} main`

    // 20x10 is twice as wide as tall, so the DCInside page shows it at 850px.
    const image = join(root, "wide.png")
    await $`magick -size 20x10 xc:red ${image}`
    const old = await writeFixturePost(root, "2026-11-01_to_2026-11-07", pathToFileURL(image).href)
    const latest = await writeFixturePost(
      root,
      "2026-11-08_to_2026-11-14",
      pathToFileURL(image).href,
    )
    await publishPages([old], { remote, site })
    expect(await publishPages([latest], { remote, site })).toEqual([
      `${site}/2026-11-08_to_2026-11-14/`,
    ])

    const checkout = join(root, "checkout")
    await $`git clone --quiet ${remote} ${checkout}`
    expect(
      await readFile(join(checkout, "book/ko/src/2026-11-08_to_2026-11-14/index.md"), "utf8"),
    ).toEqual(await readFile(join(latest, "changelog.md"), "utf8"))
    const out = join(root, "out")
    await buildSite({ root: checkout, out, site })
    const read = (path: string) => readFile(join(out, path), "utf8")

    const archive = await read("archive/index.html")
    expect(
      [...archive.matchAll(/<li><a href="\.\.\/([^/]+)\/index\.html">/gu)].map((match) => match[1]),
    ).toEqual(["2026-11-08_to_2026-11-14", "2026-11-01_to_2026-11-07"])
    // Root shows the newest post; the sidebar lists the older post too.
    expect(await read("index.html")).toContain("<title>2026-11-08 ~ 2026-11-14")
    expect(await read("toc.html")).toContain("2026-11-01_to_2026-11-07/index.html")
    const korean = await read("2026-11-08_to_2026-11-14/index.html")
    expect(korean).toContain('<html lang="ko"')
    expect(korean).toContain('<meta property="og:title" content="밝밤) 패치">')
    expect(korean).toContain(`<meta property="og:image" content="${pathToFileURL(image).href}">`)
    expect(korean).toContain(
      '<meta property="og:description" content="항목 &amp; 수정 · 로딩 2배">',
    )
    expect(korean).toContain(
      '<meta name="changelog-dcinside" content="2026-11-08_to_2026-11-14.html">',
    )
    expect(await read("index.html")).toContain(
      '<meta property="og:description" content="항목 &amp; 수정 · 로딩 2배">',
    )
    expect(korean).toContain("location.replace(other)")
    // The sidebar lists each heading by the text of its first link, so the PR link must not sit inside the heading anchor.
    expect(korean).toContain('<h2 id="항목"><a href="https://example.test/pull/1">항목</a></h2>')
    // The DCInside page is the post HTML alone, with the wide image and the footer after a blank line.
    const dcinside = await read("2026-11-08_to_2026-11-14.html")
    expect(dcinside).toEqual(
      renderPostHtml(await readFile(join(latest, "changelog.md"), "utf8"), {
        wide: new Set([pathToFileURL(image).href]),
      }),
    )
    expect(dcinside).toContain("max-width:850px")
    expect(dcinside).toContain(
      "<p><br></p>\n<p>이 변경 내역은 AI(test)로 자동 생성되었습니다.</p>\n",
    )
    const english = await read("en/2026-11-08_to_2026-11-14/index.html")
    expect(english).toContain('<html lang="en"')
    expect(english).toContain("<p>Fix</p>")
    expect(english.includes("location.replace")).toEqual(false)
    expect(english).toContain('<meta property="og:description" content="Fix · Loading 2x">')
    expect(await read("en/2026-11-08_to_2026-11-14.html")).toEqual("<p>Fix</p>\n")
  } finally {
    await rm(root, { recursive: true })
    for (const name of Object.keys({ ...process.env })) delete process.env[name]
    for (const [name, value] of Object.entries(saved)) process.env[name] = value
  }
})
