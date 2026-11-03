import { assertEquals } from "@std/assert"

import { rangesBetween, startOfWeek, weeklyRanges } from "./weeks.ts"

Deno.test("startOfWeek returns the local Monday", () => {
  assertEquals(
    startOfWeek(new Date(2026, 5, 14, 12)).toDateString(),
    new Date(2026, 5, 8).toDateString(),
  )
  assertEquals(
    startOfWeek(new Date(2026, 5, 15, 12)).toDateString(),
    new Date(2026, 5, 15).toDateString(),
  )
})

Deno.test("weeklyRanges starts with current week and walks older weeks", () => {
  const ranges = weeklyRanges(new Date(2026, 5, 14, 12), 3)

  assertEquals(ranges.map((range) => range.start), [
    "2026-06-08",
    "2026-06-01",
    "2026-05-25",
  ])
  assertEquals(ranges[0].endInclusive, "2026-06-14")
  assertEquals(ranges[0].endExclusive, "2026-06-15")
  assertEquals(ranges[0].title, "밝밤) 6월 8일 ~ 6월 14일 패치")
})

Deno.test("weeklyRanges ends the current week today and keeps its query window", () => {
  const [current, previous] = weeklyRanges(new Date(2026, 10, 3, 12), 2)

  assertEquals(current.endInclusive, "2026-11-03")
  assertEquals(current.endExclusive, "2026-11-09")
  assertEquals(current.title, "밝밤) 11월 2일 ~ 11월 3일 패치")
  assertEquals(previous.title, "밝밤) 10월 26일 ~ 11월 1일 패치")
})

Deno.test("rangesBetween returns contiguous newest-to-oldest weekly ranges", () => {
  const ranges = weeklyRanges(new Date(2026, 5, 14, 12), 4)

  assertEquals(rangesBetween(ranges, 1, 3).map((range) => range.index), [
    1,
    2,
    3,
  ])
  assertEquals(rangesBetween(ranges, 3, 1).map((range) => range.index), [
    1,
    2,
    3,
  ])
})
