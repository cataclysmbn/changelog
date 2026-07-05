import { assertEquals, assertStringIncludes } from "@std/assert"

import {
  type Commit,
  draftPost,
  reviewPrompt,
  rewritePrompt,
  titleRange,
} from "./dcinside.ts"

const commits: Commit[] = [
  {
    hash: "abc1234",
    date: "2026-01-04",
    subject: "feat(ui): improve zone manager UI (#100)",
    author: "dev",
    body:
      "Adds a display toggle.\n\nAssisted-by: pi:gpt-5.5\nCo-authored-by: bot <bot@example.com>",
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
  assertEquals(draft.includes("Assisted-by"), false)
  assertStringIncludes(draft, "01월 05일")
  assertStringIncludes(draft, "* stop crash while lockpicking (#101, def5678)")
})

Deno.test("rewritePrompt carries the DCInside style guide", () => {
  const prompt = rewritePrompt({ commits })

  assertStringIncludes(prompt, "DCInside 밝밤 패치글 형식")
  assertStringIncludes(prompt, '세부 설명은 "ㄴ" 하위 불릿')
  assertStringIncludes(prompt, "pr-8621-1.png")
  assertStringIncludes(prompt, '"feral"은 사람/괴물 이름에서 "이성을 잃은"')
  assertStringIncludes(prompt, "feat(ui): improve zone manager UI (#100)")
})

Deno.test("rewritePrompt includes PR evidence and downloaded images", () => {
  const prompt = rewritePrompt({
    commits: [{
      ...commits[0],
      pullRequest: {
        number: 100,
        title: "fix: player-facing bug",
        url: "https://github.com/cataclysmbn/Cataclysm-BN/pull/100",
        body: "## Purpose of change (The Why)\nPlayers saw a bad menu.",
        files: ["src/menu.cpp"],
        images: [{
          sourceUrl: "https://github.com/user-attachments/assets/example",
          filename: "pr-100-1.png",
        }],
      },
    }],
  })

  assertStringIncludes(prompt, "PR: #100 fix: player-facing bug")
  assertStringIncludes(prompt, "src/menu.cpp")
  assertStringIncludes(prompt, "pr-100-1.png")
})

Deno.test("reviewPrompt injects hostile senior editor pass", () => {
  const prompt = reviewPrompt({
    draft: "* 번들 배포에 레지스트리 모드 포함",
    sourcePrompt: "PR evidence",
    title: "밝밤) 1월 4일 ~ 1월 5일 패치",
  })

  assertStringIncludes(prompt, "표독한 senior 한국어 편집자 reviewer subagent")
  assertStringIncludes(prompt, "pr-8621-1.png")
  assertStringIncludes(
    prompt,
    '"feral armored bio-operator" = "이성을 잃은 중장갑 바이오닉 특수부대원"',
  )
  assertStringIncludes(prompt, "번들 배포")
  assertStringIncludes(prompt, "PR evidence")
})
