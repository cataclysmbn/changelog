/**
 * @module
 *
 * The biggest changes of a post, for its Open Graph description. They are stored in `description.txt` beside the
 * post, one change per line.
 */

import * as v from "valibot"

const min = 5
const max = 10

/** Fewest items a post can have: 5, or every entry of a post with fewer. */
const fewest = (post: string) => Math.min(min, post.match(/^#{2,3} \[/gmu)?.length ?? 0)

export const describePrompt = ({ korean, english }: { korean: string; english: string }) =>
  `List the biggest changes of this Cataclysm: Bright Nights changelog for the link preview of the post.

Rules:
- Return only a JSON object {"ko": [...], "en": [...]}. No code fence, preface, or notes.
- Pick ${min} to ${max} changes, biggest first: new content, gameplay changes and large speedups before small fixes.
- Merge related entries into one change and add up their effect. Example: three entries that make waiting 1.2x, 3x and 1.4x faster become "Waiting is about 5x faster".
- Write each change as one short phrase of at most 50 characters, without Markdown, links or a final period.
- "ko" uses the Korean post's words and "en" uses the English post's words. Both lists have the same changes in the same order.
- Use only facts and numbers the posts state.

# Korean post
${korean}

# English post
${english}
`

export type Description = { ko: string[]; en: string[] }

const Item = v.pipe(v.string(), v.trim(), v.regex(/^[^\n[\]#`*]{1,80}$/u, "한 줄 80자 이하 문구"))

/** Parses the agent's answer to `describePrompt` for `post`, either language of it. */
export const parseDescription = (response: string, post: string): Description => {
  const json = response.slice(response.indexOf("{"), response.lastIndexOf("}") + 1)
  const items = v.pipe(v.array(Item), v.minLength(fewest(post)), v.maxLength(max))
  const description = v.parse(v.strictObject({ ko: items, en: items }), JSON.parse(json))
  if (description.ko.length !== description.en.length) {
    throw new Error(`ko ${description.ko.length}개, en ${description.en.length}개로 개수가 다름`)
  }
  const hangul = description.en.find((item) => /\p{Script=Hangul}/u.test(item))
  if (hangul) throw new Error(`en에 한글이 남음: ${hangul}`)
  return description
}

/** The `description.txt` text of a list of changes. */
export const descriptionText = (items: string[]) => `${items.join("\n")}\n`

/** The Open Graph description of a `description.txt` text. */
export const ogDescription = (text: string) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" · ")
