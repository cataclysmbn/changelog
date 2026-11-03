---
name: dcinside-changelog
description: Korean DCInside BN changelog posts.
compatibility: Local Cataclysm-BN checkout and Deno.
---

# DCInside Changelog

Use this for `밝밤)` DCInside posts.

## Source gathering

1. For interactive weekly generation, use the dax TUI:

   ```sh
   deno task tui
   ```

   It lists this week first, lets the user choose an older contiguous week range, crawls PR evidence and image URLs, writes prompts only in a temp directory, and invokes isolated pi writer/reviewer passes per week. Pi runs with `--no-context-files` plus role-specific AGENTS content injected through the system prompt, while keeping the user's normal pi auth/model settings. Output is a folder like `dist/2026-06-15_to_2026-06-21/` with `changelog.txt` and the `changelog.html` to paste into the DCInside HTML editor.

2. Generate a prompt or skeleton manually from the Cataclysm-BN checkout:

   ```sh
   deno task dc --repo /home/scarf/repo/cata/Cataclysm-BN --since 2026-01-01 --until 2026-01-07 -o /tmp/prompt.md
   deno task dc --repo /home/scarf/repo/cata/Cataclysm-BN v0.10.0..HEAD --mode draft
   ```

3. Always inspect PR body/files/images or the diff before writing a Korean bullet. Commit titles and curated commit lists are not enough. Do not invent gameplay details.
4. Use `/home/scarf/repo/cata/translations/lang/po/ko.po` as the Korean game-term glossary before finalizing visible item/monster/UI names. Search the exact English term from the PR/diff and copy the matching `msgstr`; do not store word-level fixed translations or infer a whole name from a partial match. Preserve `msgctxt` when looking up a name. If the exact entry is absent, untranslated, or fuzzy, retain the full English name.

   ```sh
   rg -C2 -i '<English term>' /home/scarf/repo/cata/translations/lang/po/ko.po | rg -v '^(#:|--)' | head -n 20
   ```

## Images

- Use only the `Image:` URLs in the PR evidence. They are permanent GitHub addresses from the raw PR body (`gh pr view --json body`), e.g. `https://github.com/user-attachments/assets/<id>`.
- Do not use signed `private-user-images` URLs from rendered HTML. They expire.

## Translation review

- Keep the existing writer → reviewer sequence. The reviewer must report every game name in the final text as `msgid`, `msgctxt` (null for no context), and `used`, alongside the corrected `changelog` in the JSON review response.
- Validate that response against the actual selected PO with `validateTranslationReview` in `src/translation.ts` before accepting the text. Reviewer approval alone is insufficient. Apply this to directly delegated writing as well as the TUI; do not invent a separate translation table from memory.
- A missing report, incorrect context, or mismatched translation blocks completion. Keep the evidence outside the published body. The TUI saves verified PO lines and PO/changelog hashes under `dist/.reviews/`; failed runs preserve their temporary review inputs and responses.

## Post format

Write `changelog.txt` with this template. `renderPostHtml` in `src/dcinside.ts` turns each line into static HTML. `assertPostFormat` rejects other line types and URLs that the PR evidence does not list.

```text
# 밝밤) M월 D일 ~ M월 D일 패치

## 변경 항목 이름
![](대표 이미지 URL)
무엇이 바뀌었는지 한 문장
어떻게 달라지는지 조건, 수치, 예시를 붙인 1~2문장
✓ 핵심 1   ✓ 핵심 2   ✓ 핵심 3
![이미지 설명](추가 이미지 URL)
[GitHub에서 보기 ↗](PR URL)
```

- Put the entries with the largest player impact first. Do not use date headings, `*` bullets, or `ㄴ` sub-bullets.
- Small fixes use only the `##` line, one sentence, and the link.
- Keep lines short and player-facing.
- First mention may include English in parentheses: `불굴의 괴물(Relentless Hulk)`.

## Style distilled from reference posts

- Korean, compact, informal patch-note tone.
- DCInside terms seen in crawled rlike posts: `밝밤`, `ㅋㅌㅋㅂㅂ`, `ㅂㅂ`, `실험판`, `안정판`, `최신버전`, `하늘섬`, `람쥐모드`, `파암`, `한글패치`, `시작 지점`, `스폰`, `타일`, `줍기`, `자동운전`.
- Prefer concrete visible effects: UI changes, recipes, monsters, scenarios, balance, bug fixes.
- Modding entries are usually omitted unless normal players directly see the result. If kept, label them clearly and explain the player-facing effect.
- Merge follow-up/revert chains into one entry with the final visible result.
- Use the detail sentence for conditions, examples, exact numeric changes, and "what changed from what to what" details.
- Include important numeric before/after values when present: `(300 -> 3000)`, `(50kw -> 5kw)`.
- Follow the layout of the [reference post](https://gall.dcinside.com/mgallery/board/view/?id=rimworld&no=953751&exception_mode=recommend&page=1): name, image, one-line summary, detail, `✓` highlights, captioned images, link button.

## Avoid

- Credits, contributor counts, Discord links, PR process, CI details, internal build plumbing, or changelog-provenance text.
- Corporate/hype wording.
- English-only bullets when a Korean term is known.
- Putting unclear commit subjects into a confident Korean gameplay claim.
- Developer jargon or vague verbs such as `번들 배포`, `레지스트리 모드`, `전용 위치`, `정리`, `갱신`, `공용 팩토리`, or `타입체크` when the player-visible result is the real point.
- Bare `수정`, `개선`, or `변경` entries without concrete details about what changed.
- Long Markdown sections from release notes.
