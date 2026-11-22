import $ from "@david/dax"
import { assertEquals, assertStringIncludes } from "@std/assert"
import { join } from "@std/path"

import { publishPages } from "./pages.ts"

const site = "https://example.test/changelog"

const writeFixturePost = async (root: string, name: string) => {
  const dir = join(root, name)
  await Deno.mkdir(dir)
  await Deno.writeTextFile(join(dir, "changelog.txt"), "# 밝밤) 패치\n")
  await Deno.writeTextFile(join(dir, "changelog.en.txt"), "# BN changelog\n")
  await Deno.writeTextFile(
    join(dir, "changelog.html"),
    '<p><img src="https://cdn.test/a.webp" alt=""></p>\n',
  )
  await Deno.writeTextFile(join(dir, "changelog.en.html"), "<p>Fix</p>\n")
  return dir
}

Deno.test("publishPages creates gh-pages, opens the newest period at the root, and lists every period in the archive newest first", async () => {
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
  try {
    await $`git init --quiet --bare --initial-branch=main ${remote}`
    // First publish creates the branch; second publish keeps the first period.
    const old = await writeFixturePost(root, "2026-11-01_to_2026-11-07")
    const latest = await writeFixturePost(root, "2026-11-08_to_2026-11-14")
    await publishPages([old], { remote, site })
    assertEquals(
      await publishPages([latest], { remote, site }),
      [`${site}/2026-11-08_to_2026-11-14/`],
    )

    const show = (path: string) =>
      $`git -C ${remote} show gh-pages:${path}`.text()
    const archive = await show("archive/index.html")
    assertEquals(
      [...archive.matchAll(/<li>(\S+)/gu)].map((match) => match[1]),
      ["2026-11-08", "2026-11-01"],
    )
    assertStringIncludes(archive, '<a href="../2026-11-01_to_2026-11-07/">')
    assertStringIncludes(
      await show("index.html"),
      '<meta http-equiv="refresh" content="0; url=2026-11-08_to_2026-11-14/">',
    )
    const korean = await show("2026-11-08_to_2026-11-14/index.html")
    assertStringIncludes(korean, '<html lang="ko">')
    assertStringIncludes(korean, "<title>밝밤) 패치</title>")
    assertStringIncludes(korean, '<a href="en.html" hreflang="en">English</a>')
    assertStringIncludes(
      korean,
      '<meta property="og:image" content="https://cdn.test/a.webp">',
    )
    assertStringIncludes(korean, 'location.replace("en.html")')
    const english = await show("2026-11-08_to_2026-11-14/en.html")
    assertStringIncludes(english, "<title>BN changelog</title>")
    assertStringIncludes(english, "<p>Fix</p>")
    assertEquals(english.includes("og:image"), false)
    assertStringIncludes(english, '<a href="./?ko" hreflang="ko">한국어</a>')
    assertEquals(english.includes("location.replace"), false)
  } finally {
    await Deno.remove(root, { recursive: true })
    for (const name of Object.keys(Deno.env.toObject())) Deno.env.delete(name)
    for (const [name, value] of Object.entries(saved)) Deno.env.set(name, value)
  }
})
