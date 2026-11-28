import { expect, test } from "vite-plus/test"

import { ogDescription, parseDescription } from "./description.ts"

const post = Array.from(
  { length: 6 },
  (_, index) => `### [Change ${index}](https://example.test/pull/${index})`,
).join("\n\n")
const answer = (ko: string[], en: string[]) => `\`\`\`json\n${JSON.stringify({ ko, en })}\n\`\`\``
const five = (text: string) => Array.from({ length: 5 }, (_, index) => `${text} ${index}`)

test("parseDescription accepts 5 to 10 changes per language and rejects other counts, Hangul in en, and Markdown", () => {
  expect(parseDescription(answer(five("변경"), five("Change")), post)).toEqual({
    ko: five("변경"),
    en: five("Change"),
  })
  expect(() => parseDescription(answer(five("변경").slice(1), five("Change")), post)).toThrow()
  expect(() => parseDescription(answer(five("변경"), five("Change").slice(1)), post)).toThrow()
  expect(() =>
    parseDescription(answer([...five("변경"), ...five("변경"), "변경"], five("Change")), post),
  ).toThrow()
  expect(() => parseDescription(answer(five("변경"), five("변경")), post)).toThrow("한글")
  expect(() =>
    parseDescription(answer(five("변경"), ["[Change](https://x)", ...five("C").slice(1)]), post),
  ).toThrow()
})

test("parseDescription accepts 2 changes for a post with 2 entries", () => {
  const short = post.split("\n\n").slice(0, 2).join("\n\n")
  expect(
    parseDescription(answer(["변경 1", "변경 2"], ["Change 1", "Change 2"]), short).en,
  ).toEqual(["Change 1", "Change 2"])
})

test("ogDescription joins the lines of description.txt with a middle dot", () => {
  expect(ogDescription("Faster loading\n5 fungal animals\n")).toEqual(
    "Faster loading · 5 fungal animals",
  )
})
