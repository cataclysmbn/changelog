import { expect, test } from "vite-plus/test"

import { mergeRanges, rangesBetween, startOfWeek, weeklyRanges } from "./weeks.ts"

test("startOfWeek returns the local Monday", () => {
  expect(startOfWeek(new Date(2026, 5, 14, 12)).toDateString()).toEqual(
    new Date(2026, 5, 8).toDateString(),
  )
  expect(startOfWeek(new Date(2026, 5, 15, 12)).toDateString()).toEqual(
    new Date(2026, 5, 15).toDateString(),
  )
})

test("weeklyRanges starts with current week and walks older weeks", () => {
  const ranges = weeklyRanges(new Date(2026, 5, 14, 12), 3)

  expect(ranges.map((range) => range.start)).toEqual(["2026-06-08", "2026-06-01", "2026-05-25"])
  expect(ranges[0].endInclusive).toEqual("2026-06-14")
  expect(ranges[0].endExclusive).toEqual("2026-06-15")
  expect(ranges[0].title).toEqual("밝밤) 6월 8일 ~ 6월 14일 패치")
})

test("weeklyRanges ends the current week today and keeps its query window", () => {
  const [current, previous] = weeklyRanges(new Date(2026, 10, 3, 12), 2)

  expect(current.endInclusive).toEqual("2026-11-03")
  expect(current.endExclusive).toEqual("2026-11-09")
  expect(current.title).toEqual("밝밤) 11월 2일 ~ 11월 3일 패치")
  expect(previous.title).toEqual("밝밤) 10월 26일 ~ 11월 1일 패치")
})

test("mergeRanges covers the oldest start through the newest end", () => {
  const ranges = weeklyRanges(new Date(2026, 10, 3, 12), 3)
  const merged = mergeRanges(rangesBetween(ranges, 0, 1))

  expect(merged.start).toEqual("2026-10-26")
  expect(merged.endInclusive).toEqual("2026-11-03")
  expect(merged.endExclusive).toEqual("2026-11-09")
  expect(merged.title).toEqual("밝밤) 10월 26일 ~ 11월 3일 패치")
  expect(mergeRanges(rangesBetween(ranges, 1, 1))).toEqual({
    ...ranges[1],
    label: "2026-10-26 ~ 2026-11-01",
  })
})

test("rangesBetween returns contiguous newest-to-oldest weekly ranges", () => {
  const ranges = weeklyRanges(new Date(2026, 5, 14, 12), 4)

  expect(rangesBetween(ranges, 1, 3).map((range) => range.index)).toEqual([1, 2, 3])
  expect(rangesBetween(ranges, 3, 1).map((range) => range.index)).toEqual([1, 2, 3])
})
