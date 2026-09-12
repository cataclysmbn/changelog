import * as v from "@valibot/valibot"

export type PoEntry = {
  msgid: string
  msgctxt: string | null
  msgidPlural?: string
  msgstr: string
  fuzzy: boolean
  line: number
}

const poField = (lines: string[], field: RegExp): string | undefined => {
  const start = lines.findIndex((line) => field.test(line))
  if (start < 0) return undefined
  const value = (line: string): string =>
    JSON.parse(line.slice(line.indexOf('"')))
  let result = value(lines[start])
  for (const line of lines.slice(start + 1)) {
    if (!line.startsWith('"')) break
    result += value(line)
  }
  return result
}

export const parsePo = (text: string): PoEntry[] => {
  const entries: PoEntry[] = []
  let offset = 0
  for (const block of text.replace(/\r\n/gu, "\n").split(/(\n\s*\n)/u)) {
    const lines = block.split("\n").map((line) => line.trim())
    const msgid = poField(lines, /^msgid\s/u)
    if (msgid) {
      const msgidPlural = poField(lines, /^msgid_plural\s/u)
      entries.push({
        msgid,
        msgctxt: poField(lines, /^msgctxt\s/u) ?? null,
        ...(msgidPlural === undefined ? {} : { msgidPlural }),
        msgstr: poField(lines, /^msgstr(?:\[0\])?\s/u) ?? "",
        fuzzy: lines.some((line) => /^#,.*\bfuzzy\b/u.test(line)),
        line: offset + lines.findIndex((line) => /^msgid\s/u.test(line)) + 1,
      })
    }
    offset += (block.match(/\n/gu) ?? []).length
  }
  return entries
}

const normalized = (text: string): string =>
  text.toLowerCase().replace(/[-_]+/gu, " ").replace(/\s+/gu, " ")

const termIndex = (term: string, source: string): number => {
  if (!term.trim() || term.includes("\n")) return -1
  const needle = normalized(term)
  const word = /[\p{L}\p{N}]/u
  for (
    let index = source.indexOf(needle);
    index >= 0;
    index = source.indexOf(needle, index + 1)
  ) {
    if (
      !word.test(source[index - 1] ?? "") &&
      !word.test(source[index + needle.length] ?? "")
    ) return index
  }
  return -1
}

export const poGlossary = (
  entries: readonly PoEntry[],
  source: string,
): string => {
  const text = normalized(source)
  return entries.map((entry) => {
    const matches = [entry.msgid, entry.msgidPlural]
      .filter((term): term is string => term !== undefined)
      .map((term) => termIndex(term, text)).filter((index) => index >= 0)
    return { entry, index: matches.length ? Math.min(...matches) : -1 }
  }).filter(({ index }) => index >= 0)
    .toSorted((a, b) => a.index - b.index)
    .map(({ entry }) =>
      [
        `- msgid ${JSON.stringify(entry.msgid)}`,
        `  msgctxt ${JSON.stringify(entry.msgctxt)}`,
        entry.msgidPlural
          ? `  msgid_plural ${JSON.stringify(entry.msgidPlural)}`
          : "",
        `  msgstr ${JSON.stringify(entry.msgstr)}`,
        `  po_line ${entry.line}${entry.fuzzy ? " (fuzzy: 번역 미확정)" : ""}`,
      ].filter(Boolean).join("\n")
    ).join("\n")
}

const TermSchema = v.strictObject({
  msgid: v.pipe(v.string(), v.minLength(1)),
  msgctxt: v.nullable(v.string()),
  used: v.pipe(v.string(), v.minLength(1)),
})
const ReviewSchema = v.strictObject({
  changelog: v.pipe(v.string(), v.minLength(1)),
  terms: v.array(TermSchema),
})

export type VerifiedTerm = v.InferOutput<typeof TermSchema> & {
  poLine: number | null
  status: "translated" | "untranslated" | "fuzzy" | "missing"
}

export const validateTranslationReview = (
  response: string,
  entries: readonly PoEntry[],
): { changelog: string; terms: VerifiedTerm[] } => {
  const review = v.parse(ReviewSchema, JSON.parse(response))
  if (!review.changelog.trim()) throw new Error("검수 본문이 비어 있습니다")
  const terms = review.terms.map((term): VerifiedTerm => {
    const candidates = entries.filter((entry) =>
      entry.msgid === term.msgid || entry.msgidPlural === term.msgid
    )
    const matches = candidates.filter((entry) => entry.msgctxt === term.msgctxt)
    if (matches.length > 1 || (candidates.length && !matches.length)) {
      throw new Error(`PO 문맥을 확인해야 합니다: ${term.msgid}`)
    }
    const entry = matches[0]
    const status = !entry
      ? "missing"
      : entry.fuzzy
      ? "fuzzy"
      : entry.msgstr
      ? "translated"
      : "untranslated"
    const expected = status === "translated" ? entry.msgstr : term.msgid
    if (term.used !== expected) {
      throw new Error(
        `PO 번역 불일치: ${term.msgid}: ${JSON.stringify(term.used)} → ${
          JSON.stringify(expected)
        }`,
      )
    }
    if (!review.changelog.includes(term.used)) {
      throw new Error(`대조한 표현이 검수 본문에 없습니다: ${term.used}`)
    }
    return { ...term, poLine: entry?.line ?? null, status }
  })
  return { changelog: review.changelog, terms }
}
