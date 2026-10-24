import { assertEquals, assertStringIncludes, assertThrows } from "@std/assert"

import {
  parsePo,
  poGlossary,
  validateTranslationReview,
} from "./translation.ts"

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

Deno.test("PO parser preserves context, plural, fuzzy, missing translations and source lines", () => {
  assertEquals(entries.length, 6)
  assertEquals(entries[0], {
    msgid: "feral human",
    msgctxt: null,
    msgidPlural: "feral humans",
    msgstr: "이성을 잃은 인간",
    fuzzy: false,
    line: 1,
  })
  assertEquals(entries[2].msgctxt, "verb")
  assertEquals(entries[3].msgctxt, "power")
  assertEquals(entries[4].fuzzy, true)
  assertEquals(entries[5].msgstr, "")
  for (const entry of entries) {
    assertEquals(po.split("\n")[entry.line - 1], `msgid "${entry.msgid}"`)
  }
})

Deno.test("PO parser handles multiline fields and CRLF without using obsolete entries", () => {
  const text =
    'msgid ""\r\nmsgstr "Language: ko\\n"\r\n\r\nmsgctxt "menu"\r\nmsgid ""\r\n"long "\r\n"name"\r\nmsgstr ""\r\n"긴 "\r\n"이름"\r\n'
  assertEquals(parsePo(text), [{
    msgid: "long name",
    msgctxt: "menu",
    msgstr: "긴 이름",
    fuzzy: false,
    line: 5,
  }])
})

Deno.test("glossary includes terms beyond the former 120 limit and short complete names", () => {
  const names = [
    ...Array.from({ length: 130 }, (_, i) => `item ${i}`),
    "feral human",
    "UPS",
  ]
  const fixture = names.map((name) => `msgid "${name}"\nmsgstr "번역 ${name}"`)
    .join("\n\n")
  const glossary = poGlossary(parsePo(fixture), names.join("\n"))
  assertEquals((glossary.match(/^- msgid /gmu) ?? []).length, names.length)
  assertStringIncludes(glossary, 'msgid "feral human"')
  assertStringIncludes(glossary, 'msgid "UPS"')
})

Deno.test("glossary uses word boundaries and retains competing contexts and fuzzy status", () => {
  const extra = parsePo('msgid "Scribe"\nmsgstr "서기"')
  assertEquals(poGlossary(extra, "Describe the solution"), "")
  const glossary = poGlossary(entries, "Charge and new armor")
  assertStringIncludes(glossary, 'msgctxt "verb"')
  assertStringIncludes(glossary, 'msgctxt "power"')
  assertStringIncludes(glossary, "fuzzy: 번역 미확정")
})

Deno.test("review rejects the feral human mistranslation and records the actual PO evidence", () => {
  assertThrows(
    () =>
      validateTranslationReview(
        response("feral human", "야생화 인간"),
        entries,
      ),
    Error,
    "PO 번역 불일치",
  )
  const review = validateTranslationReview(
    response("feral human", "이성을 잃은 인간"),
    entries,
  )
  assertEquals(review.terms, [{
    msgid: "feral human",
    msgctxt: null,
    used: "이성을 잃은 인간",
    poLine: 1,
    status: "translated",
  }])
  assertEquals(review.changelog, "07월 29일\n* 이성을 잃은 인간 추가\n")
  assertEquals(
    validateTranslationReview(response("feral cat", "야생 고양이"), entries)
      .terms[0].status,
    "translated",
  )
  assertEquals(
    validateTranslationReview(
      response("feral humans", "이성을 잃은 인간"),
      entries,
    ).terms[0].poLine,
    1,
  )
})

Deno.test("new SWAT names keep their full English names when the PO has no exact entry", () => {
  for (const name of ["feral SWAT officer", "feral SWAT team"]) {
    assertThrows(
      () => validateTranslationReview(response(name, "야생화 SWAT"), entries),
      Error,
      "PO 번역 불일치",
    )
    assertThrows(
      () =>
        validateTranslationReview(response(name, "이성을 잃은 SWAT"), entries),
      Error,
      "PO 번역 불일치",
    )
    assertEquals(
      validateTranslationReview(response(name, name), entries).terms[0],
      {
        msgid: name,
        msgctxt: null,
        used: name,
        poLine: null,
        status: "missing",
      },
    )
  }
})

Deno.test("review requires the exact context and rejects ambiguous duplicate PO entries", () => {
  assertThrows(
    () => validateTranslationReview(response("Charge", "충전"), entries),
    Error,
    "PO 문맥",
  )
  assertThrows(
    () =>
      validateTranslationReview(response("Charge", "충전", "verb"), entries),
    Error,
    "PO 번역 불일치",
  )
  assertEquals(
    validateTranslationReview(response("Charge", "충전", "power"), entries)
      .terms[0].status,
    "translated",
  )
  assertThrows(
    () =>
      validateTranslationReview(response("feral human", "이성을 잃은 인간"), [
        ...entries,
        entries[0],
      ]),
    Error,
    "PO 문맥",
  )
})

Deno.test("fuzzy and empty translations cannot be presented as official Korean names", () => {
  for (
    const [name, translation, status] of [["new armor", "이전 갑옷", "fuzzy"], [
      "new weapon",
      "새 무기",
      "untranslated",
    ]]
  ) {
    assertThrows(
      () => validateTranslationReview(response(name, translation), entries),
      Error,
      "PO 번역 불일치",
    )
    assertEquals(
      validateTranslationReview(response(name, name), entries).terms[0].status,
      status,
    )
  }
})

Deno.test("review evidence must refer to the final body and cannot be omitted", () => {
  const report = JSON.parse(response("feral human", "이성을 잃은 인간"))
  report.changelog = "* 야생화 인간 추가"
  assertThrows(
    () => validateTranslationReview(JSON.stringify(report), entries),
    Error,
    "검수 본문에 없습니다",
  )
  assertThrows(() =>
    validateTranslationReview(JSON.stringify({ changelog: "* 변경" }), entries)
  )
  assertThrows(() => validateTranslationReview("* 검수 완료", entries))
  assertThrows(() =>
    validateTranslationReview(
      JSON.stringify({ changelog: "   ", terms: [] }),
      entries,
    )
  )
  assertEquals(
    validateTranslationReview(
      JSON.stringify({ changelog: "* 멈추던 문제 수정", terms: [] }),
      entries,
    ).terms,
    [],
  )
})

Deno.test("review accepts a term whose shared last word is written once after a ·-joined list", () => {
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
  assertEquals(
    validateTranslationReview(JSON.stringify(report), entries).terms.length,
    2,
  )
  assertThrows(
    () =>
      validateTranslationReview(
        JSON.stringify({ ...report, changelog: "* 권총용 소총용 탄약대" }),
        entries,
      ),
    Error,
    "검수 본문에 없습니다",
  )
})
