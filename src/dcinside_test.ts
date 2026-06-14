import { assertEquals, assertStringIncludes } from "@std/assert"

import {
  type Commit,
  draftPost,
  rewritePrompt,
  titleRange,
} from "./dcinside.ts"

const commits: Commit[] = [
  {
    hash: "abc1234",
    date: "2026-01-04",
    subject: "feat(ui): improve zone manager UI (#100)",
    author: "dev",
    body: "Adds a display toggle.\n\nCo-authored-by: bot <bot@example.com>",
  },
  {
    hash: "def5678",
    date: "2026-01-05",
    subject: "fix: stop crash while lockpicking (#101)",
    author: "dev",
    body: "",
  },
]

Deno.test("titleRange uses DCInside title spacing", () => {
  assertEquals(titleRange(commits), "밝밤) 1월 4일 ~ 1월 5일 패치")
})

Deno.test("draftPost groups commits by padded body dates", () => {
  const draft = draftPost({ commits, includeBody: true })

  assertStringIncludes(draft, "01월 04일")
  assertStringIncludes(draft, "* improve zone manager UI (#100, abc1234)")
  assertStringIncludes(draft, "ㄴ Adds a display toggle.")
  assertStringIncludes(draft, "01월 05일")
  assertStringIncludes(draft, "* stop crash while lockpicking (#101, def5678)")
})

Deno.test("rewritePrompt carries the DCInside style guide", () => {
  const prompt = rewritePrompt({ commits })

  assertStringIncludes(prompt, "DCInside 밝밤 패치글 형식")
  assertStringIncludes(prompt, '세부 설명은 "ㄴ" 하위 불릿')
  assertStringIncludes(prompt, "feat(ui): improve zone manager UI (#100)")
})
