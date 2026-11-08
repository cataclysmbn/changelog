import { assertEquals, assertStringIncludes, assertThrows } from "@std/assert"

import {
  assertPostFormat,
  assertSameLayout,
  type Commit,
  draftPost,
  githubImageUrls,
  renderPostHtml,
  reviewPrompt,
  rewritePrompt,
  titleRange,
  translatePrompt,
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

Deno.test("draftPost writes one template entry per commit", () => {
  const draft = draftPost({ commits, includeBody: true })

  assertEquals(
    draft,
    "# 밝밤) 1월 4일 ~ 1월 5일 패치\n\n## improve zone manager UI (#100, abc1234)\nAdds a display toggle.\n\n## stop crash while lockpicking (#101, def5678)\n",
  )
})

Deno.test("rewritePrompt carries the DCInside style guide", () => {
  const prompt = rewritePrompt({ commits })

  assertStringIncludes(prompt, "DCInside 밝밤 패치글 형식")
  assertStringIncludes(prompt, "## [변경 항목 이름](PR URL)")
  assertStringIncludes(prompt, "rg -n -C2 -i '<English term>'")
  assertStringIncludes(prompt, "같은 msgid/context의 msgstr")
  assertStringIncludes(prompt, "feat(ui): improve zone manager UI (#100)")
})

Deno.test("rewritePrompt includes supplied PO glossary evidence", () => {
  const prompt = rewritePrompt({
    commits,
    glossary: '- msgid "display toggle"\n  msgstr "표시 전환"',
  })

  assertStringIncludes(prompt, "# 한국어 PO 용어 근거")
  assertStringIncludes(prompt, 'msgstr "표시 전환"')
})

Deno.test("rewritePrompt includes PR evidence and image URLs", () => {
  const prompt = rewritePrompt({
    commits: [{
      ...commits[0],
      pullRequest: {
        number: 100,
        title: "fix: player-facing bug",
        url: "https://github.com/cataclysmbn/Cataclysm-BN/pull/100",
        body: "## Purpose of change (The Why)\nPlayers saw a bad menu.",
        files: ["src/menu.cpp"],
        images: ["https://github.com/user-attachments/assets/example"],
      },
    }],
  })

  assertStringIncludes(prompt, "PR: #100 fix: player-facing bug")
  assertStringIncludes(prompt, "src/menu.cpp")
  assertStringIncludes(
    prompt,
    "  Image: https://github.com/user-attachments/assets/example\n",
  )
})

Deno.test("githubImageUrls keeps only permanent GitHub addresses once each", () => {
  const asset = "https://github.com/user-attachments/assets/b8f2f31a"
  const repoAsset = "https://github.com/cataclysmbn/Cataclysm-BN/assets/1/a2"
  const legacy = "https://user-images.githubusercontent.com/1/a.png"
  assertEquals(
    githubImageUrls(`<img src="${asset}">
![x](${repoAsset})
${legacy} ${asset}
![signed](https://private-user-images.githubusercontent.com/1/a.png?jwt=x)
![other](https://i.imgur.com/a.png)
https://github.com/cataclysmbn/Cataclysm-BN/pull/1`),
    [asset, repoAsset, legacy],
  )
  assertEquals(githubImageUrls(`see ${asset}.\n[${legacy}]`), [asset, legacy])
})

const image = "https://github.com/user-attachments/assets/a"
const pr = "https://github.com/cataclysmbn/Cataclysm-BN/pull/100"
const source = `  URL: ${pr}\n  Image: ${image}\n`
// Body evidence is indented four spaces and must not widen the URL lists.
const post = `# 밝밤) 1월 4일 ~ 1월 5일 패치

## [구역 <관리> & 표시](${pr})
![](${image})
구역 표시 전환 추가
- 전환
- 표시
![전환 화면](${image})

## 자물쇠 따기 충돌 수정
따는 도중 멈추던 문제 해결
`

Deno.test("renderPostHtml renders the static reference layout without the title", () => {
  const html = renderPostHtml(post)

  assertEquals(html.includes("패치"), false)
  assertEquals(html.split("\n").slice(0, 7), [
    `<p><b><a href="${pr}" target="_blank">구역 &lt;관리&gt; &amp; 표시</a></b></p>`,
    `<p><img src="${image}" alt="" style="max-width:425px;height:auto;"></p>`,
    "<p>구역 표시 전환 추가</p>",
    "<p>• 전환</p>",
    "<p>• 표시</p>",
    `<p><img src="${image}" alt="전환 화면" style="max-width:425px;height:auto;"></p>`,
    "<p>▲ 전환 화면</p>",
  ])
  assertStringIncludes(
    html,
    "<p>▲ 전환 화면</p>\n<p><br></p>\n<p><b><br></b></p>\n<p><b>자물쇠 따기 충돌 수정</b></p>",
  )
})

Deno.test("assertPostFormat accepts the template and rejects everything outside it", () => {
  assertPostFormat(post, source)
  assertPostFormat(
    "# 제목\n## 항목\n-10% 피해\n*표시 추가\n[밝밤] 설명",
    source,
  )
  assertThrows(
    () =>
      assertPostFormat(
        "# 제목\n## 항목\n![](https://example.test/a.png)",
        `${source}    Image: https://example.test/a.png\n`,
      ),
    Error,
    "없는 이미지",
  )
  for (
    const [text, message] of [
      ["## 제목 없음\n내용", "첫 줄"],
      ["# 제목\n내용", "'## 항목'"],
      ["# 제목\n## 항목\nㄴ 하위 불릿", "템플릿에 없는 줄"],
      ["# 제목\n## 항목\n* 불릿", "템플릿에 없는 줄"],
      ["# 제목\n## 항목\n✓ 핵심", "템플릿에 없는 줄"],
      [`# 제목\n## 항목\n- ${image}`, "템플릿에 없는 줄"],
      ["# 제목\n01월 04일\n## 항목", "템플릿에 없는 줄"],
      ["# 제목\n## 항목\n# 제목 둘", "템플릿에 없는 줄"],
      ["# 제목\n## 항목\n### 소제목", "템플릿에 없는 줄"],
      [`# 제목\n## 항목\n${image}`, "템플릿에 없는 줄"],
      ["# 제목\n## 항목\n![](https://github.com/x.png)", "없는 이미지"],
      [`# 제목\n## 항목\n![](${pr})`, "없는 이미지"],
      [`# 제목\n## [항목](${image})`, "없는 링크"],
      [`# 제목\n## 항목\n[GitHub에서 보기 ↗](${pr})`, "템플릿에 없는 줄"],
      [`# 제목\n## [항목](${pr}) [둘](${pr})`, "템플릿에 없는 줄"],
    ]
  ) {
    assertThrows(() => assertPostFormat(text, source), Error, message)
  }
})

Deno.test("reviewPrompt injects hostile senior editor pass", () => {
  const prompt = reviewPrompt({
    draft: "* 번들 배포에 레지스트리 모드 포함",
    sourcePrompt: "PR evidence",
    title: "밝밤) 1월 4일 ~ 1월 5일 패치",
  })

  assertStringIncludes(prompt, "표독한 senior 한국어 편집자 reviewer subagent")
  assertStringIncludes(prompt, "## [변경 항목 이름](PR URL)")
  assertStringIncludes(prompt, "같은 msgid/context의 msgstr")
  assertStringIncludes(prompt, "번들 배포")
  assertStringIncludes(prompt, "PR evidence")
})

const english = `# Bright Nights changelog: 2026-01-04 ~ 2026-01-05

## [Zone <manager> & display](${pr})
![](${image})
Adds a zone display toggle
- Toggle
- Display
![Toggle screen](${image})

## Fix lockpicking crash
No more freeze while picking a lock
`

Deno.test("assertSameLayout accepts a line-by-line translation and rejects drift", () => {
  assertSameLayout(post, english)
  for (
    const [text, message] of [
      [english.replace("- Display\n", ""), "줄 구조"],
      [english.replace("- Display", "Display"), "줄 구조"],
      [english.replace(`](${pr})`, `](${pr}0)`), "줄 구조"],
      [english.replace("![Toggle screen]", "![]"), "줄 구조"],
      [english.replace("Toggle\n", "토글\n"), "한글"],
    ]
  ) {
    assertThrows(() => assertSameLayout(post, text), Error, message)
  }
})

Deno.test("translatePrompt keeps verified English names and the layout rules", () => {
  const prompt = translatePrompt({
    post,
    title: "Bright Nights changelog: 2026-01-04 ~ 2026-01-05",
    terms: [{ msgid: "lock picking", used: "자물쇠 따기" }],
  })

  assertStringIncludes(
    prompt,
    "# Bright Nights changelog: 2026-01-04 ~ 2026-01-05",
  )
  assertStringIncludes(prompt, "- 자물쇠 따기 -> lock picking")
  assertStringIncludes(prompt, "## [구역 <관리> & 표시]")
})
