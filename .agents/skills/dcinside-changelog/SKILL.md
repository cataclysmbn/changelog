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

   It lists this week first, lets the user choose an older contiguous week range, crawls PR evidence/images, writes prompts only in a temp directory, and invokes isolated pi writer/reviewer passes per week. Pi runs with `--no-context-files` plus role-specific AGENTS content injected through the system prompt, while keeping the user's normal pi auth/model settings. Output is a folder like `dist/2026-06-15_to_2026-06-21/changelog.txt` plus only the PR images referenced in the final text.

2. Generate a prompt or skeleton manually from the Cataclysm-BN checkout:

   ```sh
   deno task dc --repo /home/scarf/repo/cata/Cataclysm-BN --since 2026-01-01 --until 2026-01-07 --asset-dir dist/2026-01-01_to_2026-01-07 -o /tmp/prompt.md
   deno task dc --repo /home/scarf/repo/cata/Cataclysm-BN v0.10.0..HEAD --mode draft
   ```

3. Always inspect PR body/files/images or the diff before writing a Korean bullet. Commit titles and curated commit lists are not enough. Do not invent gameplay details.
4. Use `/home/scarf/repo/cata/translations/lang/po/ko.po` as the Korean game-term glossary before finalizing visible item/monster/UI names:

   ```sh
   rg -C2 -i '<English term>' /home/scarf/repo/cata/translations/lang/po/ko.po | rg -v '^(#:|--)' | head -n 20
   ```

   `feral` in human/monster names is `이성을 잃은`, never `야생`; e.g. `feral soldier` = `이성을 잃은 군인`, `feral armored bio-operator` = `이성을 잃은 중장갑 바이오닉 특수부대원`.

## Post format

- Title: `밝밤) M월 D일 ~ M월 D일 패치`.
- Body groups entries by date with `MM월 DD일` headings.
- Main bullets use `*`. Sub-bullets use `ㄴ`.
- Keep bullets short and player-facing.
- First mention may include English in parentheses: `불굴의 괴물(Relentless Hulk)`.
- If a downloaded image illustrates an entry, put the filename alone immediately before that bullet, e.g. `pr-8621-1.png`.
- End with `---` and a short caveat only when useful, e.g. `일부 누락될 수 있음`.

## Style distilled from reference posts

- Korean, compact, informal patch-note tone.
- DCInside terms seen in crawled rlike posts: `밝밤`, `ㅋㅌㅋㅂㅂ`, `ㅂㅂ`, `실험판`, `안정판`, `최신버전`, `하늘섬`, `람쥐모드`, `파암`, `한글패치`, `시작 지점`, `스폰`, `타일`, `줍기`, `자동운전`.
- Prefer concrete visible effects: UI changes, recipes, monsters, scenarios, balance, bug fixes.
- Modding entries are usually omitted unless normal players directly see the result. If kept, label them clearly and explain the player-facing effect.
- Keep related bullets together under the same date. Merge follow-up/revert chains into the final visible result.
- Use `ㄴ` for conditions, examples, exact numeric changes, and "what changed from what to what" details.
- Include important numeric before/after values when present: `(300 -> 3000)`, `(50kw -> 5kw)`.
- Follow the hand-written reference posts (`밝밤) 1월 3일 ~ 1월 13일 패치`, `밝밤) 1월 14일 ~ 2월 9일 패치`): concrete effect first, then `ㄴ` examples/conditions/numbers.
- Mention screenshots/images only if the final folder actually includes them, with the bare filename before the relevant bullet.

## Avoid

- Credits, contributor counts, Discord links, PR process, CI details, internal build plumbing, or changelog-provenance text.
- Corporate/hype wording.
- English-only bullets when a Korean term is known.
- Putting unclear commit subjects into a confident Korean gameplay claim.
- Developer jargon or vague verbs such as `번들 배포`, `레지스트리 모드`, `전용 위치`, `정리`, `갱신`, `공용 팩토리`, or `타입체크` when the player-visible result is the real point.
- Bare `수정`, `개선`, or `변경` entries without concrete details about what changed.
- Long Markdown sections from release notes; DCInside posts should remain date-bucketed bullets.
