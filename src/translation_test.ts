import { expect, test } from "vite-plus/test"

import { parsePo, poGlossary, validateTranslationReview } from "./translation.ts"

const po = `msgid "feral human"
msgid_plural "feral humans"
msgstr[0] "이성을 잃은 인간"

msgid "feral cat"
msgstr "야생 고양이"

msgctxt "verb"
msgid "Charge"
msgstr "돌진"

msgctxt "power"
msgid "Charge"
msgstr "충전"

#, c-format, fuzzy
msgid "new armor"
msgstr "이전 갑옷"

msgid "new weapon"
msgstr ""

#~ msgid "retired item"
#~ msgstr "폐기된 물건"
`
const entries = parsePo(po)
const response = (msgid: string, used: string, msgctxt: string | null = null) =>
  JSON.stringify({
    changelog: `07월 29일\n* ${used} 추가\n`,
    terms: [{ msgid, msgctxt, used }],
  })

test("PO parser preserves context, plural, fuzzy, missing translations and source lines", () => {
  expect(entries.length).toEqual(6)
  expect(entries[0]).toEqual({
    msgid: "feral human",
    msgctxt: null,
    msgidPlural: "feral humans",
    msgstr: "이성을 잃은 인간",
    fuzzy: false,
    line: 1,
  })
  expect(entries[2].msgctxt).toEqual("verb")
  expect(entries[3].msgctxt).toEqual("power")
  expect(entries[4].fuzzy).toEqual(true)
  expect(entries[5].msgstr).toEqual("")
  for (const entry of entries) {
    expect(po.split("\n")[entry.line - 1]).toEqual(`msgid "${entry.msgid}"`)
  }
})

test("PO parser handles multiline fields and CRLF without using obsolete entries", () => {
  const text =
    'msgid ""\r\nmsgstr "Language: ko\\n"\r\n\r\nmsgctxt "menu"\r\nmsgid ""\r\n"long "\r\n"name"\r\nmsgstr ""\r\n"긴 "\r\n"이름"\r\n'
  expect(parsePo(text)).toEqual([
    {
      msgid: "long name",
      msgctxt: "menu",
      msgstr: "긴 이름",
      fuzzy: false,
      line: 5,
    },
  ])
})

test("glossary includes terms beyond the former 120 limit and short complete names", () => {
  const names = [...Array.from({ length: 130 }, (_, i) => `item ${i}`), "feral human", "UPS"]
  const fixture = names.map((name) => `msgid "${name}"\nmsgstr "번역 ${name}"`).join("\n\n")
  const glossary = poGlossary(parsePo(fixture), names.join("\n"))
  expect((glossary.match(/^- msgid /gmu) ?? []).length).toEqual(names.length)
  expect(glossary).toContain('msgid "feral human"')
  expect(glossary).toContain('msgid "UPS"')
})

test("glossary uses word boundaries and retains competing contexts and fuzzy status", () => {
  const extra = parsePo('msgid "Scribe"\nmsgstr "서기"')
  expect(poGlossary(extra, "Describe the solution")).toEqual("")
  const glossary = poGlossary(entries, "Charge and new armor")
  expect(glossary).toContain('msgctxt "verb"')
  expect(glossary).toContain('msgctxt "power"')
  expect(glossary).toContain("fuzzy: 번역 미확정")
})

test("review rejects the feral human mistranslation and records the actual PO evidence", () => {
  expect(() => validateTranslationReview(response("feral human", "야생화 인간"), entries)).toThrow(
    "PO 번역 불일치",
  )
  const review = validateTranslationReview(response("feral human", "이성을 잃은 인간"), entries)
  expect(review.terms).toEqual([
    {
      msgid: "feral human",
      msgctxt: null,
      used: "이성을 잃은 인간",
      poLine: 1,
      status: "translated",
    },
  ])
  expect(review.changelog).toEqual("07월 29일\n* 이성을 잃은 인간 추가\n")
  expect(
    validateTranslationReview(response("feral cat", "야생 고양이"), entries).terms[0].status,
  ).toEqual("translated")
  expect(
    validateTranslationReview(response("feral humans", "이성을 잃은 인간"), entries).terms[0]
      .poLine,
  ).toEqual(1)
})

test("new SWAT names keep their full English names when the PO has no exact entry", () => {
  for (const name of ["feral SWAT officer", "feral SWAT team"]) {
    expect(() => validateTranslationReview(response(name, "야생화 SWAT"), entries)).toThrow(
      "PO 번역 불일치",
    )
    expect(() => validateTranslationReview(response(name, "이성을 잃은 SWAT"), entries)).toThrow(
      "PO 번역 불일치",
    )
    expect(validateTranslationReview(response(name, name), entries).terms[0]).toEqual({
      msgid: name,
      msgctxt: null,
      used: name,
      poLine: null,
      status: "missing",
    })
  }
})

test("review requires the exact context and rejects ambiguous duplicate PO entries", () => {
  expect(() => validateTranslationReview(response("Charge", "충전"), entries)).toThrow("PO 문맥")
  expect(() => validateTranslationReview(response("Charge", "충전", "verb"), entries)).toThrow(
    "PO 번역 불일치",
  )
  expect(
    validateTranslationReview(response("Charge", "충전", "power"), entries).terms[0].status,
  ).toEqual("translated")
  expect(() =>
    validateTranslationReview(response("feral human", "이성을 잃은 인간"), [
      ...entries,
      entries[0],
    ]),
  ).toThrow("PO 문맥")
})

test("fuzzy and empty translations cannot be presented as official Korean names", () => {
  for (const [name, translation, status] of [
    ["new armor", "이전 갑옷", "fuzzy"],
    ["new weapon", "새 무기", "untranslated"],
  ]) {
    expect(() => validateTranslationReview(response(name, translation), entries)).toThrow(
      "PO 번역 불일치",
    )
    expect(validateTranslationReview(response(name, name), entries).terms[0].status).toEqual(status)
  }
})

test("review evidence must refer to the final body and cannot be omitted", () => {
  const report = JSON.parse(response("feral human", "이성을 잃은 인간"))
  report.changelog = "* 야생화 인간 추가"
  expect(() => validateTranslationReview(JSON.stringify(report), entries)).toThrow(
    "검수 본문에 없습니다",
  )
  expect(() =>
    validateTranslationReview(JSON.stringify({ changelog: "* 변경" }), entries),
  ).toThrow()
  expect(() => validateTranslationReview("* 검수 완료", entries)).toThrow()
  expect(() =>
    validateTranslationReview(JSON.stringify({ changelog: "   ", terms: [] }), entries),
  ).toThrow()
  expect(
    validateTranslationReview(
      JSON.stringify({ changelog: "* 멈추던 문제 수정", terms: [] }),
      entries,
    ).terms,
  ).toEqual([])
})

test("review accepts a term whose shared last word is written once after a ·-joined list", () => {
  const entries = parsePo(`msgid "pistol bandolier"
msgstr "권총용 탄약대"

msgid "rifle bandolier"
msgstr "소총용 탄약대"
`)
  const report = {
    changelog: "* 권총용·소총용 탄약대 적재량 통일",
    terms: [
      { msgid: "pistol bandolier", msgctxt: null, used: "권총용 탄약대" },
      { msgid: "rifle bandolier", msgctxt: null, used: "소총용 탄약대" },
    ],
  }
  expect(validateTranslationReview(JSON.stringify(report), entries).terms.length).toEqual(2)
  expect(() =>
    validateTranslationReview(
      JSON.stringify({ ...report, changelog: "* 권총용 소총용 탄약대" }),
      entries,
    ),
  ).toThrow("검수 본문에 없습니다")
})
