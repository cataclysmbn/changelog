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

   It lists this week first, lets the user choose an older contiguous week range, writes prompts under `out/dcinside`, and invokes `pi --skill .agents/skills/dcinside-changelog/SKILL.md -p @prompt` per week.

2. Generate a prompt or skeleton manually from the Cataclysm-BN checkout:

   ```sh
   deno task dc --repo /home/scarf/repo/cata/Cataclysm-BN --since 2026-01-01 --until 2026-01-07 -o out/prompt.md
   deno task dc --repo /home/scarf/repo/cata/Cataclysm-BN v0.10.0..HEAD --mode draft
   ```

3. If a commit title is unclear, inspect the PR or diff before writing a Korean bullet. Do not invent gameplay details.
4. Look up Korean game terms in `Cataclysm-BN/lang/po/ko.po` before finalizing visible item/monster/UI names:

   ```sh
   rg -C2 -i '<English term>' /home/scarf/repo/cata/Cataclysm-BN/lang/po/ko.po | rg -v '^(#:|--)' | head -n 20
   ```

## Post format

- Title: `밝밤) M월 D일 ~ M월 D일 패치`.
- Body groups entries by date with `MM월 DD일` headings.
- Main bullets use `*`. Sub-bullets use `ㄴ`.
- Keep bullets short and player-facing.
- First mention may include English in parentheses: `불굴의 괴물(Relentless Hulk)`.
- End with `---` and a short caveat only when useful, e.g. `일부 누락될 수 있음`.

## Style distilled from reference posts

- Korean, compact, informal patch-note tone.
- Prefer concrete visible effects: UI changes, recipes, monsters, scenarios, balance, bug fixes.
- Modding entries are allowed but label them clearly: `Modding:`, `Lua 모딩:`.
- Keep related bullets together under the same date.
- Use `ㄴ` for conditions, examples, or exact numeric changes.
- Include important numeric before/after values when present: `(300 -> 3000)`, `(50kw -> 5kw)`.
- Mention screenshots manually only if the final post will actually include them; the script does not fetch media.

## Avoid

- Credits, contributor counts, Discord links, PR process, CI/build details, or changelog-provenance text.
- Corporate/hype wording.
- English-only bullets when a Korean term is known.
- Putting unclear commit subjects into a confident Korean gameplay claim.
- Long Markdown sections from release notes; DCInside posts should remain date-bucketed bullets.
