export type WeekRange = {
  index: number
  start: string
  endInclusive: string
  endExclusive: string
  label: string
  title: string
}

const toLocalDate = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate())

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const formatDate = (date: Date): string => {
  const year = date.getFullYear().toString().padStart(4, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  return `${year}-${month}-${day}`
}

const monthDay = (date: Date): string =>
  `${date.getMonth() + 1}월 ${date.getDate()}일`

export const startOfWeek = (date: Date): Date => {
  const local = toLocalDate(date)
  const daysSinceMonday = (local.getDay() + 6) % 7
  return addDays(local, -daysSinceMonday)
}

export const weeklyRanges = (baseDate: Date, count: number): WeekRange[] => {
  const currentWeek = startOfWeek(baseDate)
  return Array.from({ length: count }, (_, index) => {
    const start = addDays(currentWeek, -index * 7)
    const endExclusive = addDays(start, 7)
    const endInclusive = addDays(endExclusive, -1)
    const prefix = index === 0 ? "이번 주" : `${index}주 전`
    const title = `밝밤) ${monthDay(start)} ~ ${monthDay(endInclusive)} 패치`
    return {
      index,
      start: formatDate(start),
      endInclusive: formatDate(endInclusive),
      endExclusive: formatDate(endExclusive),
      label: `${prefix}: ${formatDate(start)} ~ ${formatDate(endInclusive)}`,
      title,
    }
  })
}

export const rangesBetween = (
  ranges: WeekRange[],
  newestIndex: number,
  oldestIndex: number,
): WeekRange[] => {
  const low = Math.min(newestIndex, oldestIndex)
  const high = Math.max(newestIndex, oldestIndex)
  return ranges.filter((range) => range.index >= low && range.index <= high)
}
