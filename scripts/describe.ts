/**
 * @module
 *
 * Writes `description.txt`, the biggest changes for the link preview, beside each post of both books that has none.
 * Picks the agent from the Claude plan, like `vp run tui`.
 *
 * Usage: vp run describe [<period>...]
 */

import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import $ from "dax"

import { descriptionText } from "../src/description.ts"
import { claudeTier, describeWithPi, planAgent } from "./dc_tui.ts"
import { bookPosts } from "./pages.ts"

const book = fileURLToPath(new URL("../book", import.meta.url))
const src = (code: string, name: string) => join(book, code, "src", name)
const args = process.argv.slice(2).filter((arg) => arg !== "--")
const names = args.length > 0 ? args : await bookPosts(join(book, "ko", "src"))
const options = {
  ...planAgent(await claudeTier("claude")),
  pi: "pi",
  claude: "claude",
  piTools: "none",
}
const temp = await mkdtemp(join(tmpdir(), "changelog-describe-"))
try {
  for (const name of names) {
    const done = await access(join(src("ko", name), "description.txt")).then(
      () => true,
      () => false,
    )
    if (done) continue
    $.logStep("describe", name)
    const read = (code: string) => readFile(join(src(code, name), "index.md"), "utf8")
    const { ko, en } = await describeWithPi(
      options,
      { korean: await read("ko"), english: await read("en") },
      join(temp, `${name}.prompt.md`),
    )
    await writeFile(join(src("en", name), "description.txt"), descriptionText(en))
    await writeFile(join(src("ko", name), "description.txt"), descriptionText(ko))
  }
} finally {
  await rm(temp, { recursive: true })
}
