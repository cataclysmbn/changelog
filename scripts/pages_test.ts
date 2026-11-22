import $ from "@david/dax"
import { assertEquals, assertStringIncludes } from "@std/assert"
import { copy } from "@std/fs"
import { fromFileUrl, join, toFileUrl } from "@std/path"

import { renderPostHtml } from "../src/dcinside.ts"
import { publishPages } from "./pages.ts"
import { buildSite } from "./site.ts"

const site = "https://example.test/changelog"

const writeFixturePost = async (root: string, name: string, image: string) => {
  const dir = join(root, name)
  await Deno.mkdir(dir)
  await Deno.writeTextFile(
    join(dir, "changelog.md"),
    `# 밝밤) 패치\n\n## 항목\n\n![](${image})\n\n---\n\n이 변경 내역은 AI(test)로 자동 생성되었습니다.\n`,
  )
  await Deno.writeTextFile(
    join(dir, "changelog.en.md"),
    "# BN changelog\n\nFix\n",
  )
  return dir
}

Deno.test("publishPages commits both books newest first and buildSite serves each post with its DCInside page", async () => {
  const saved = Deno.env.toObject()
  for (const name of Object.keys(saved)) {
    if (name.startsWith("GIT_")) Deno.env.delete(name)
  }
  Deno.env.set("GIT_CONFIG_GLOBAL", "/dev/null")
  Deno.env.set("GIT_CONFIG_NOSYSTEM", "1")
  for (const role of ["AUTHOR", "COMMITTER"]) {
    Deno.env.set(`GIT_${role}_NAME`, "test")
    Deno.env.set(`GIT_${role}_EMAIL`, "test@example.test")
  }
  const root = await Deno.makeTempDir()
  const remote = join(root, "remote.git")
  const seed = join(root, "seed")
  try {
    // The remote main branch starts with this repository's book settings and no posts.
    await $`git init --quiet --bare --initial-branch=main ${remote}`
    await $`git init --quiet --initial-branch=main ${seed}`
    for (const code of ["ko", "en"]) {
      const book = fromFileUrl(new URL(`../book/${code}`, import.meta.url))
      await copy(book, join(seed, "book", code))
      await Deno.remove(join(seed, "book", code, "src"), { recursive: true })
    }
    await $`git -C ${seed} add book`
    await $`git -C ${seed} commit --quiet -m seed`
    await $`git -C ${seed} push --quiet ${remote} main`

    // 20x10 is twice as wide as tall, so the DCInside page shows it at 850px.
    const image = join(root, "wide.png")
    await $`magick -size 20x10 xc:red ${image}`
    const old = await writeFixturePost(
      root,
      "2026-11-01_to_2026-11-07",
      toFileUrl(image).href,
    )
    const latest = await writeFixturePost(
      root,
      "2026-11-08_to_2026-11-14",
      toFileUrl(image).href,
    )
    await publishPages([old], { remote, site })
    assertEquals(
      await publishPages([latest], { remote, site }),
      [`${site}/2026-11-08_to_2026-11-14/`],
    )

    const checkout = join(root, "checkout")
    await $`git clone --quiet ${remote} ${checkout}`
    assertEquals(
      await Deno.readTextFile(
        join(checkout, "book/ko/src/2026-11-08_to_2026-11-14/index.md"),
      ),
      await Deno.readTextFile(join(latest, "changelog.md")),
    )
    const out = join(root, "out")
    await buildSite({ root: checkout, out, site })
    const read = (path: string) => Deno.readTextFile(join(out, path))

    const archive = await read("archive/index.html")
    assertEquals(
      [...archive.matchAll(/<li><a href="\.\.\/([^/]+)\/index\.html">/gu)].map(
        (match) => match[1],
      ),
      ["2026-11-08_to_2026-11-14", "2026-11-01_to_2026-11-07"],
    )
    // Root shows the newest post; the sidebar lists the older post too.
    assertStringIncludes(
      await read("index.html"),
      "<title>2026-11-08 ~ 2026-11-14",
    )
    assertStringIncludes(
      await read("toc.html"),
      "2026-11-01_to_2026-11-07/index.html",
    )
    const korean = await read("2026-11-08_to_2026-11-14/index.html")
    assertStringIncludes(korean, '<html lang="ko"')
    assertStringIncludes(
      korean,
      '<meta property="og:title" content="밝밤) 패치">',
    )
    assertStringIncludes(
      korean,
      `<meta property="og:image" content="${toFileUrl(image).href}">`,
    )
    assertStringIncludes(korean, "location.replace(other)")
    // The DCInside page is the post HTML alone, with the wide image and the footer after a blank line.
    const dcinside = await read("2026-11-08_to_2026-11-14.html")
    assertEquals(
      dcinside,
      renderPostHtml(await Deno.readTextFile(join(latest, "changelog.md")), {
        wide: new Set([toFileUrl(image).href]),
      }),
    )
    assertStringIncludes(dcinside, "max-width:850px")
    assertStringIncludes(
      dcinside,
      "<p><br></p>\n<p>이 변경 내역은 AI(test)로 자동 생성되었습니다.</p>\n",
    )
    const english = await read("en/2026-11-08_to_2026-11-14/index.html")
    assertStringIncludes(english, '<html lang="en"')
    assertStringIncludes(english, "<p>Fix</p>")
    assertEquals(english.includes("location.replace"), false)
    assertEquals(await read("en/2026-11-08_to_2026-11-14.html"), "<p>Fix</p>\n")
  } finally {
    await Deno.remove(root, { recursive: true })
    for (const name of Object.keys(Deno.env.toObject())) Deno.env.delete(name)
    for (const [name, value] of Object.entries(saved)) Deno.env.set(name, value)
  }
})
