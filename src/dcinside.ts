export type Commit = {
  hash: string
  date: string
  subject: string
  author: string
  body: string
}

export type DraftOptions = {
  commits: Commit[]
  title?: string
  includeBody?: boolean
}

const monthDay = (date: string, pad: boolean): string => {
  const [month = "", day = ""] = date.split("-").slice(1)
  const parsedMonth = Number(month)
  const parsedDay = Number(day)
  if (Number.isNaN(parsedMonth) || Number.isNaN(parsedDay)) {
    return date
  }
  const monthText = pad
    ? parsedMonth.toString().padStart(2, "0")
    : parsedMonth.toString()
  const dayText = pad
    ? parsedDay.toString().padStart(2, "0")
    : parsedDay.toString()
  return `${monthText}월 ${dayText}일`
}

export const titleRange = (commits: Commit[]): string => {
  if (commits.length === 0) return "밝밤) 패치"
  const dates = commits.map((commit) => commit.date).toSorted()
  return `밝밤) ${monthDay(dates[0], false)} ~ ${
    monthDay(dates.at(-1)!, false)
  } 패치`
}

const bodySummary = (body: string): string[] =>
  body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/^(Assisted-by|Co-authored-by):/iu.test(line))
    .slice(0, 3)

const prNumber = (subject: string): string | null =>
  subject.match(/\(#(\d+)\)$/u)?.[1] ?? null

const stripConventionalPrefix = (subject: string): string =>
  subject
    .replace(/^\w+(?:\([^)]*\))?!?:\s*/u, "")
    .replace(/\s*\(#\d+\)$/u, "")
    .trim()

export const groupedCommits = (commits: Commit[]): Map<string, Commit[]> => {
  const byDate = new Map<string, Commit[]>()
  for (
    const commit of commits.toSorted((a, b) => a.date.localeCompare(b.date))
  ) {
    byDate.set(commit.date, [...(byDate.get(commit.date) ?? []), commit])
  }
  return byDate
}

export const draftPost = (
  { commits, title, includeBody = false }: DraftOptions,
): string => {
  const sections = [...groupedCommits(commits)]
    .map(([date, items]) => {
      const bullets = items
        .map((commit) => {
          const refs = [`${commit.hash}`]
          const pr = prNumber(commit.subject)
          if (pr) refs.unshift(`#${pr}`)
          const details = includeBody
            ? bodySummary(commit.body).map((line) => `ㄴ ${line}`).join("\n")
            : ""
          return [
            `* ${stripConventionalPrefix(commit.subject)} (${refs.join(", ")})`,
            details,
          ]
            .filter((line) => line.length > 0)
            .join("\n")
        })
        .join("\n")
      return `${monthDay(date, true)}\n${bullets}`
    })
    .join("\n\n")

  return `${
    title ?? titleRange(commits)
  }\n\n${sections}\n\n---\n\n일부 누락될 수 있음\n`
}

const styleGuide = `DCInside 밝밤 패치글 형식:
- 제목은 "밝밤) M월 D일 ~ M월 D일 패치".
- 본문은 날짜별로 "MM월 DD일" 머리말을 쓰고, 변경점은 "*" 불릿으로 적습니다.
- 세부 설명은 "ㄴ" 하위 불릿으로 짧게 붙입니다.
- 한국어 위주로 쓰고 필요한 경우 첫 언급에만 영어 원문을 괄호로 병기합니다.
- 플레이어가 체감하는 기능, 콘텐츠, 밸런스, UI, 버그 수정을 우선합니다.
- JSON/Lua 모딩 변경은 "Modding:" 또는 "Lua 모딩:"처럼 명확히 표시합니다.
- 말투는 간결하고 갤러리 패치글처럼 담백하게 씁니다. 홍보 문구, 기여자 목록, 개발 과정 설명은 넣지 않습니다.
- 추측으로 내용을 만들지 말고 커밋에서 불명확한 항목은 짧게 보수적으로 적습니다.
- 출력은 게시글 본문만 반환합니다.`

export const rewritePrompt = (
  { commits, title, includeBody = true }: DraftOptions,
): string => {
  const rawEntries = [...groupedCommits(commits)]
    .map(([date, items]) => {
      const entries = items
        .map((commit) => {
          const details = bodySummary(commit.body)
            .map((line) => `  body: ${line}`)
            .join("\n")
          return [
            `- ${commit.hash} ${commit.subject}`,
            `  author: ${commit.author}`,
            includeBody ? details : "",
          ].filter((line) => line.length > 0).join("\n")
        })
        .join("\n")
      return `${date}\n${entries}`
    })
    .join("\n\n")

  return `${styleGuide}\n\n목표 제목: ${
    title ?? titleRange(commits)
  }\n\n아래 커밋 목록을 위 형식의 한국어 패치글로 재작성해 주세요.\n\n${rawEntries}\n`
}
