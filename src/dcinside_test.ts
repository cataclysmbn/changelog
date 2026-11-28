import { expect, test } from "vite-plus/test"

import {
  aiFooter,
  assertPostFormat,
  assertSameLayout,
  type Commit,
  draftPost,
  githubImageUrls,
  postMarkdown,
  escapeHtml,
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
    body: "Adds a display toggle.\n\nAssisted-by: pi:gpt-5.5\nCo-authored-by: bot <bot@example.com>",
  },
  {
    hash: "def5678",
    date: "2026-01-05",
    subject: "fix: stop crash while lockpicking (#101)",
    author: "dev",
    body: "",
  },
]

test("titleRange uses DCInside title spacing", () => {
  expect(titleRange(commits)).toEqual("밝밤) 1월 4일 ~ 1월 5일 패치")
})

test("draftPost writes one template entry per commit", () => {
  const draft = draftPost({ commits, includeBody: true })

  expect(draft).toEqual(
    "# 밝밤) 1월 4일 ~ 1월 5일 패치\n\n## improve zone manager UI (#100, abc1234)\nAdds a display toggle.\n\n## stop crash while lockpicking (#101, def5678)\n",
  )
})

test("rewritePrompt carries the DCInside style guide", () => {
  const prompt = rewritePrompt({ commits })

  expect(prompt).toContain("DCInside 밝밤 패치글 형식")
  expect(prompt).toContain("## [변경 항목 이름](PR URL)")
  expect(prompt).toContain("rg -n -C2 -i '<English term>'")
  expect(prompt).toContain("같은 msgid/context의 msgstr")
  expect(prompt).toContain("feat(ui): improve zone manager UI (#100)")
})

test("rewritePrompt includes supplied PO glossary evidence", () => {
  const prompt = rewritePrompt({
    commits,
    glossary: '- msgid "display toggle"\n  msgstr "표시 전환"',
  })

  expect(prompt).toContain("# 한국어 PO 용어 근거")
  expect(prompt).toContain('msgstr "표시 전환"')
})

test("rewritePrompt includes PR evidence and image URLs", () => {
  const prompt = rewritePrompt({
    commits: [
      {
        ...commits[0],
        pullRequest: {
          number: 100,
          title: "fix: player-facing bug",
          url: "https://github.com/cataclysmbn/Cataclysm-BN/pull/100",
          body: "## Purpose of change (The Why)\nPlayers saw a bad menu.",
          files: ["src/menu.cpp"],
          images: ["https://github.com/user-attachments/assets/example"],
        },
      },
    ],
  })

  expect(prompt).toContain("PR: #100 fix: player-facing bug")
  expect(prompt).toContain("src/menu.cpp")
  expect(prompt).toContain("  Image: https://github.com/user-attachments/assets/example\n")
})

test("githubImageUrls keeps only permanent GitHub addresses once each", () => {
  const asset = "https://github.com/user-attachments/assets/b8f2f31a"
  const repoAsset = "https://github.com/cataclysmbn/Cataclysm-BN/assets/1/a2"
  const legacy = "https://user-images.githubusercontent.com/1/a.png"
  const raw = "https://raw.githubusercontent.com/dev/repo/assets/a.webp"
  expect(
    githubImageUrls(`<img src="${asset}">
![x](${repoAsset})
| tileset | ![](${raw}) |
${legacy} ${asset}
![signed](https://private-user-images.githubusercontent.com/1/a.png?jwt=x)
![other](https://i.imgur.com/a.png)
https://github.com/cataclysmbn/Cataclysm-BN/pull/1`),
  ).toEqual([asset, repoAsset, raw, legacy])
  expect(githubImageUrls(`see ${asset}.\n[${legacy}]`)).toEqual([asset, legacy])
})

const image = "https://github.com/user-attachments/assets/a"
const pr = "https://github.com/cataclysmbn/Cataclysm-BN/pull/100"
const source = `  URL: ${pr}\n  Image: ${image}\n`
// Body evidence is indented four spaces and must not widen the URL lists.
const post = `# 밝밤) 1월 4일 ~ 1월 5일 패치

1월 4일

## [구역 <관리> & 표시](${pr})
![](${image})
구역 표시 전환 추가
- 전환
- 표시
![전환 화면](${image})

1월 5일

## 자물쇠 따기 충돌 수정
따는 도중 멈추던 문제 해결
`

test("renderPostHtml renders the static reference layout without the title", () => {
  const html = renderPostHtml(postMarkdown(post))

  expect(html.includes("패치")).toEqual(false)
  expect(html.split("\n").slice(0, 8)).toEqual([
    "<p><b>1월 4일</b></p>",
    `<p><b><a href="${pr}" target="_blank">구역 &lt;관리&gt; &amp; 표시</a></b></p>`,
    `<p><img src="${image}" alt="" style="max-width:425px;height:auto;"></p>`,
    "<p>구역 표시 전환 추가</p>",
    "<p>• 전환</p>",
    "<p>• 표시</p>",
    `<p><img src="${image}" alt="전환 화면" style="max-width:425px;height:auto;"></p>`,
    "<p>▲ 전환 화면</p>",
  ])
  expect(html).toContain(
    "<p>▲ 전환 화면</p>\n<p><br></p>\n<p><b><br></b></p>\n<p><b>1월 5일</b></p>\n<p><b>자물쇠 따기 충돌 수정</b></p>",
  )
})

test("postMarkdown ends with the AI footer that renderPostHtml shows after a blank line", () => {
  // Korean and English footers name the same model.
  for (const [footer, text] of [
    [aiFooter("gpt-5.6-terra"), "이 변경 내역은 AI(gpt-5.6-terra)로 자동 생성되었습니다."],
    [
      aiFooter("gpt-5.6-terra", true),
      "This changelog was generated automatically by AI (gpt-5.6-terra).",
    ],
  ]) {
    expect(
      renderPostHtml(postMarkdown(post, footer)).endsWith(
        `<p>따는 도중 멈추던 문제 해결</p>\n<p><br></p>\n<p>${text}</p>\n`,
      ),
    ).toEqual(true)
  }
  expect(renderPostHtml(postMarkdown(post)).includes("AI(")).toEqual(false)
})

test("postMarkdown writes each post line, table and bullet list as its own Markdown block", () => {
  // "a\nb" would join into one Markdown paragraph; table rows must stay together,
  // and "- 전환\n\n- 표시" would make a loose list with a paragraph gap between bullets.
  const markdown = postMarkdown(`${post}| a | b |\n|---|---|\n| ![](x.png) | c |\n`)
  expect(markdown).toContain("\n\n| a | b |\n|---|---|\n| ![](x.png) | c |\n")
  expect(markdown).toContain("\n\n- 전환\n- 표시\n\n")
  // Date lines become "##" headings and entries "###" headings, so the sidebar nests entries under their date.
  expect(markdown).toContain("\n\n## 1월 4일\n\n### [구역 <관리> & 표시](")
  expect(markdown).toContain("\n\n## 1월 5일\n\n### 자물쇠 따기 충돌 수정\n\n")
  // An entry titled like a date stays an entry: "Nov 14" then "## Nov 14" gives "## Nov 14" then "### Nov 14".
  expect(postMarkdown("# T\nNov 14\n## Nov 14\n본문")).toContain("## Nov 14\n\n### Nov 14\n\n본문")
  expect(markdown.includes("\n\n\n")).toEqual(false)
})

test("assertPostFormat accepts the template and rejects everything outside it", () => {
  assertPostFormat(post, source)
  assertPostFormat("# 제목\n## 항목\n-10% 피해\n*표시 추가\n[밝밤] 설명", source)
  expect(() =>
    assertPostFormat(
      "# 제목\n## 항목\n![](https://example.test/a.png)",
      `${source}    Image: https://example.test/a.png\n`,
    ),
  ).toThrow("없는 이미지")
  for (const [text, message] of [
    ["## 제목 없음\n내용", "첫 줄"],
    ["# 제목\n내용", "'## 항목'"],
    ["# 제목\n## 항목\nㄴ 하위 불릿", "템플릿에 없는 줄"],
    ["# 제목\n## 항목\n* 불릿", "템플릿에 없는 줄"],
    ["# 제목\n## 항목\n✓ 핵심", "템플릿에 없는 줄"],
    [`# 제목\n## 항목\n- ${image}`, "템플릿에 없는 줄"],
    ["# 제목\n## 항목\n# 제목 둘", "템플릿에 없는 줄"],
    ["# 제목\n## 항목\n### 소제목", "템플릿에 없는 줄"],
    [`# 제목\n## 항목\n${image}`, "템플릿에 없는 줄"],
    ["# 제목\n## 항목\n![](https://github.com/x.png)", "없는 이미지"],
    [`# 제목\n## 항목\n![](${pr})`, "없는 이미지"],
    [`# 제목\n## [항목](${image})`, "없는 링크"],
    [`# 제목\n## 항목\n[GitHub에서 보기 ↗](${pr})`, "템플릿에 없는 줄"],
    [`# 제목\n## [항목](${pr}) [둘](${pr})`, "템플릿에 없는 줄"],
  ]) {
    expect(() => assertPostFormat(text, source)).toThrow(message)
  }
})

const after = "https://github.com/user-attachments/assets/b"
const tableSource = `${source}  Image: ${after}\n`
const tablePost = `# 제목
## [항목](${pr})
| 타일셋 | 전 | 후 |
|---|---|---|
| Ultica_iso | ![](${image}) | ![](${after}) |
![](${image} ${after})
`

test("renderPostHtml renders table rows as one table with a header row", () => {
  expect(renderPostHtml(postMarkdown(tablePost)).split("\n").slice(1, 5)).toEqual([
    `<table border="1" style="border-collapse:collapse;width:100%;max-width:850px;">`,
    "<tr><th>타일셋</th><th>전</th><th>후</th></tr>",
    `<tr><td>Ultica_iso</td><td><img src="${image}" alt="" style="max-width:100%;height:auto;"></td><td><img src="${after}" alt="" style="max-width:100%;height:auto;"></td></tr>`,
    "</table>",
  ])
})

test("renderPostHtml renders every image of a table cell", () => {
  expect(renderPostHtml(`| ![](${image}) ![](${after}) |\n`)).toEqual(
    `<table border="1" style="border-collapse:collapse;width:100%;max-width:850px;">\n<tr><td><img src="${image}" alt="" style="max-width:100%;height:auto;"><br><img src="${after}" alt="" style="max-width:100%;height:auto;"></td></tr>\n</table>\n`,
  )
})

test("renderPostHtml keeps lines outside the template as text and keeps every table cell", () => {
  // Markdown reads "> ", "***", "+ " and "1) " as other blocks; DCInside shows them as typed.
  const html = renderPostHtml(
    postMarkdown(
      "# 제목\n## 항목\n> 주의\n***\n+ 하나\n1) 둘\n| a | b |\n| c | d | e |\n끝\n| a |\n|---|\n| c | d |\n",
    ),
  )
  const table = `<table border="1" style="border-collapse:collapse;width:100%;max-width:850px;">`
  expect(html.split("\n")).toEqual([
    "<p><b>항목</b></p>",
    "<p>&gt; 주의</p>",
    "<p>***</p>",
    "<p>+ 하나</p>",
    "<p>1) 둘</p>",
    table,
    "<tr><td>a</td><td>b</td></tr>",
    "<tr><td>c</td><td>d</td><td>e</td></tr>",
    "</table>",
    "<p>끝</p>",
    table,
    "<tr><th>a</th></tr>",
    "<tr><td>c</td><td>d</td></tr>",
    "</table>",
    "",
  ])
})

test("renderPostHtml ends an unclosed fence or comment at the next blank line", () => {
  // "```" and "<!--" open blocks that Markdown runs to the end of the post; later entries must still render.
  for (const line of ["```", "<!-- 메모"]) {
    expect(renderPostHtml(postMarkdown(`# 제목\n## 가\n${line}\n## 나\n`)).split("\n")).toEqual([
      "<p><b>가</b></p>",
      `<p>${escapeHtml(line)}</p>`,
      "<p><br></p>",
      "<p><b><br></b></p>",
      "<p><b>나</b></p>",
      "",
    ])
  }
})

test("assertPostFormat accepts image tables and before/after pairs from PR evidence", () => {
  assertPostFormat(tablePost, tableSource)
  for (const [text, message] of [
    [`# 제목\n## 항목\n| a | ![](${pr}) |`, "없는 이미지"],
    [`# 제목\n## 항목\n| a | ${image} |`, "템플릿에 없는 줄"],
    [`# 제목\n## 항목\n![](${image} ${after} ${image})`, "짝"],
    [`# 제목\n## 항목\n![](${image} ${pr})`, "없는 이미지"],
    [`# 제목\n## 항목\n![](${image}) ![](${after})`, "템플릿에 없는 줄"],
    [`# 제목\n## 항목\n| a | ![](${image}) ![](${after}) |`, "템플릿에 없는 줄"],
  ]) {
    expect(() => assertPostFormat(text, tableSource)).toThrow(message)
  }
})

test("reviewPrompt injects hostile senior editor pass", () => {
  const prompt = reviewPrompt({
    draft: "* 번들 배포에 레지스트리 모드 포함",
    sourcePrompt: "PR evidence",
    title: "밝밤) 1월 4일 ~ 1월 5일 패치",
  })

  expect(prompt).toContain("표독한 senior 한국어 편집자 reviewer subagent")
  expect(prompt).toContain("## [변경 항목 이름](PR URL)")
  expect(prompt).toContain("같은 msgid/context의 msgstr")
  expect(prompt).toContain("번들 배포")
  expect(prompt).toContain("PR evidence")
})

const english = `# Bright Nights changelog: 2026-01-04 ~ 2026-01-05

Jan 4

## [Zone <manager> & display](${pr})
![](${image})
Adds a zone display toggle
- Toggle
- Display
![Toggle screen](${image})

Jan 5

## Fix lockpicking crash
No more freeze while picking a lock
`

test("assertSameLayout accepts a line-by-line translation and rejects drift", () => {
  assertSameLayout(post, english)
  for (const [text, message] of [
    [english.replace("- Display\n", ""), "줄 구조"],
    [english.replace("- Display", "Display"), "줄 구조"],
    [english.replace(`](${pr})`, `](${pr}0)`), "줄 구조"],
    [english.replace("![Toggle screen]", "![]"), "줄 구조"],
    [english.replace("Toggle\n", "토글\n"), "한글"],
  ]) {
    expect(() => assertSameLayout(post, text)).toThrow(message)
  }
  const englishTable = tablePost
    .replace("제목", "Title")
    .replace("타일셋 | 전 | 후", "Tileset | Before | After")
    .replace("[항목]", "[Entry]")
  assertSameLayout(tablePost, englishTable)
  for (const text of [
    englishTable.replace(" After |", ""),
    englishTable.replace(`| ![](${after}) |`, "| After |"),
    englishTable.replace("|---|---|---|\n", ""),
  ])
    expect(() => assertSameLayout(tablePost, text)).toThrow("줄 구조")
})

test("translatePrompt keeps verified English names and the layout rules", () => {
  const prompt = translatePrompt({
    post,
    title: "Bright Nights changelog: 2026-01-04 ~ 2026-01-05",
    terms: [{ msgid: "lock picking", used: "자물쇠 따기" }],
  })

  expect(prompt).toContain("# Bright Nights changelog: 2026-01-04 ~ 2026-01-05")
  expect(prompt).toContain("- 자물쇠 따기 -> lock picking")
  expect(prompt).toContain("## [구역 <관리> & 표시]")
})
