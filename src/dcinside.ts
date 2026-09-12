export type Commit = {
  hash: string
  date: string
  subject: string
  author: string
  body: string
  pullRequest?: PullRequestDetails
}

export type PullRequestImage = {
  sourceUrl: string
  filename?: string
  error?: string
}

export type PullRequestDetails = {
  number: number
  title: string
  url: string
  body: string
  files: string[]
  images: PullRequestImage[]
  lookupError?: string
}

export type DraftOptions = {
  commits: Commit[]
  title?: string
  includeBody?: boolean
  glossary?: string
  glossaryPo?: string
}

export type ReviewPromptOptions = {
  glossaryPo?: string
  draft: string
  sourcePrompt: string
  title?: string
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

const cleanMarkdown = (body: string): string =>
  body
    .replace(
      /<!-- BEGIN artifact comment -->[\s\S]*?<!-- END artifact comment -->/giu,
      "",
    )
    .replace(/<!--([\s\S]*?)-->/gu, "")
    .replace(/^## Checklist[\s\S]*/imu, "")
    .replace(/^### Mandatory[\s\S]*/imu, "")
    .replace(/^### Optional[\s\S]*/imu, "")
    .replace(/\r\n/gu, "\n")
    .trim()

const bodySummary = (body: string, limit = 3): string[] =>
  cleanMarkdown(body)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/^(Assisted-by|Co-authored-by):/iu.test(line))
    .slice(0, limit)

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

export const translationGuide = `한국어 용어 확인:
- 생성 프롬프트의 "# 한국어 PO 용어 근거"에서 같은 msgid/context의 msgstr를 확인합니다.
- 근거에 없는 보이는 영어 이름은 지정된 "PO 파일"을 읽기 전용 grep/read 도구로 직접 조회합니다. 쉘 도구가 있으면 \`rg -n -C2 -i '<English term>'\`를 사용할 수 있습니다. 조회 도구가 없으면 제공된 근거만 사용하고 확인되지 않은 이름은 원문으로 남깁니다.
- msgid는 원문의 전체 명칭으로 조회하고 msgctxt를 함께 확인합니다. 문맥이 불명확하면 추가 조회하며 임의로 고르지 않습니다.
- 항목이 없거나 msgstr가 비어 있거나 fuzzy이면 영문 명칭을 그대로 유지합니다. 단어를 쪼개 추측 번역하거나 다른 항목의 번역으로 새 이름을 만들지 않습니다.`

const styleGuide = `DCInside 밝밤 패치글 형식:
- 제목은 "밝밤) M월 D일 ~ M월 D일 패치".
- 본문은 날짜별로 "MM월 DD일" 머리말을 쓰고, 변경점은 "*" 불릿으로 적습니다.
- 세부 설명은 "ㄴ" 하위 불릿으로 짧게 붙입니다.
- 한국어 위주로 쓰고 필요한 경우 첫 언급에만 영어 원문을 괄호로 병기합니다.
- 플레이어가 체감하는 기능, 콘텐츠, 밸런스, UI, 버그 수정을 우선합니다.
- PR 제목만 번역하지 말고 PR 본문/파일/이미지 근거에서 Where + What + Result를 뽑아 씁니다.
- PR 근거가 내부 개발/CI/리팩터링/Lua 타입체크뿐이면 게시글에서 뺍니다. 단, 실험판 다운로드 파일, 기본 포함 모드, 플레이 가능한 모드 콘텐츠처럼 플레이어가 직접 보는 변화는 남깁니다.
- 되돌림/후속 수정 관계가 보이면 최종 플레이어 결과 하나로 합칩니다.
- PR에 다운로드된 이미지가 있고 해당 불릿을 설명하는 데 도움이 되면 불릿 바로 위에 파일명만 한 줄로 붙입니다. 예: "pr-8621-1.png".
- "번들 배포", "레지스트리 모드", "전용 위치", "정리", "공용 팩토리", "갱신"처럼 한국 플레이어가 바로 이해 못 하는 개발자 말을 금지합니다. 예: "실험판에 기본 포함 모드 추가", "크라켄이 호수의 난파선 특수 장소에서만 스폰", "크라켄 본체가 촉수를 소환하고 촉수가 공격을 담당".
- 갤러리에서 쓰는 말은 짧고 구체적입니다: 밝밤, ㅋㅌㅋㅂㅂ, ㅂㅂ, 실험판, 안정판, 최신버전, 하늘섬, 람쥐모드, 파암, 한글패치, 시작 지점, 스폰, 타일, 줍기, 자동운전.
${translationGuide}
- 손작성 기준은 "밝밤) 1월 3일 ~ 1월 13일 패치", "밝밤) 1월 14일 ~ 2월 9일 패치"처럼 구체적 효과/수치/예시를 붙이는 방식입니다.
- 말투는 간결하고 갤러리 패치글처럼 담백하게 씁니다. 홍보 문구, 기여자 목록, 개발 과정 설명은 넣지 않습니다.
- 추측으로 내용을 만들지 말고 PR 근거가 부족한 항목은 빼거나 보수적으로 씁니다.
- "수정", "개선", "변경"만 쓰고 무엇이 달라졌는지 없는 불릿은 실패입니다. 하위 불릿으로 구체적 전/후, 조건, 예시를 붙입니다.
`

const indent = (text: string, prefix: string): string =>
  text.split("\n").map((line) => `${prefix}${line}`).join("\n")

const prEvidence = (pullRequest: PullRequestDetails): string => {
  if (pullRequest.lookupError) {
    return indent(`PR lookup failed: ${pullRequest.lookupError}`, "  ")
  }

  const body = bodySummary(pullRequest.body, 18).join("\n")
  const files = pullRequest.files.slice(0, 20).map((file) => `  - ${file}`)
    .join("\n")
  const images = pullRequest.images.length > 0
    ? pullRequest.images.map((image) =>
      `  - ${image.filename ?? "not downloaded"}: ${image.sourceUrl}${
        image.error ? ` (${image.error})` : ""
      }`
    ).join("\n")
    : "  - none"

  return [
    `  PR: #${pullRequest.number} ${pullRequest.title}`,
    `  URL: ${pullRequest.url}`,
    body
      ? `  Body evidence:\n${indent(body, "    ")}`
      : "  Body evidence: none",
    files ? `  Changed files:\n${files}` : "  Changed files: none",
    `  Downloaded images:\n${images}`,
  ].join("\n")
}

export const rewritePrompt = (
  { commits, title, includeBody = true, glossary, glossaryPo }: DraftOptions,
): string => {
  const rawEntries = [...groupedCommits(commits)]
    .map(([date, items]) => {
      const entries = items
        .map((commit) => {
          const details = bodySummary(commit.body)
            .map((line) => `  commit body: ${line}`)
            .join("\n")
          return [
            `- ${commit.hash} ${commit.subject}`,
            `  author: ${commit.author}`,
            includeBody ? details : "",
            commit.pullRequest
              ? prEvidence(commit.pullRequest)
              : "  PR evidence: none",
          ].filter((line) => line.length > 0).join("\n")
        })
        .join("\n")
      return `${date}\n${entries}`
    })
    .join("\n\n")

  const glossarySection = glossary?.trim()
    ? `\n\n# 한국어 PO 용어 근거\n${glossary.trim()}\n`
    : ""

  return `${styleGuide}\n\n목표 제목: ${
    title ?? titleRange(commits)
  }\nPO 파일: ${
    glossaryPo ?? "/home/scarf/repo/cata/translations/lang/po/ko.po"
  }\n출력은 게시글 본문만 반환합니다.${glossarySection}\n\n아래 커밋/PR 근거를 읽고 위 형식의 한국어 패치글로 재작성해 주세요. 커밋 제목만 보고 쓰면 실패입니다. 플레이어가 읽고 "뭐가 어떻게 바뀌었는지" 알 수 없는 항목은 고치거나 삭제하세요.\n\n${rawEntries}\n`
}

export const reviewPrompt = (
  { draft, sourcePrompt, title, glossaryPo }: ReviewPromptOptions,
): string =>
  `${styleGuide}

당신은 표독한 senior 한국어 편집자 reviewer subagent입니다. 아래 초안을 0점짜리 개발자 번역이라고 의심하고, PR 근거와 대조해서 게시 가능한 밝밤 DCInside 패치글로 다시 고치세요.

검수 기준:
- 한국인이 안 쓰는 비문, 개발자 은어, 번역투를 전부 제거합니다.
- 플레이어에게 의미 없는 Lua/CI/리팩터링/팩토리/타입체크 항목은 삭제합니다.
- PR을 읽어야 알 수 있는 세부사항(무엇에서 무엇으로 바뀜, 어떤 버그가 고쳐짐, 어디서 체감됨)을 복원합니다.
- 다운로드된 이미지가 해당 항목 이해에 도움이 되면 파일명만 불릿 바로 위에 추가합니다. 예: "pr-8621-1.png".
- 후속 PR이 앞 PR을 고친 경우 최종 결과만 하나로 합칩니다.
- 날짜별 형식과 불릿 형식을 유지합니다.
- 최종 본문에 사용한 모든 게임 명칭의 원문 msgid, PO 문맥(msgctxt, 문맥 없으면 null), 실제 본문 표현(used)을 terms에 기록합니다. 같은 명칭·문맥·표현은 한 번만 기록합니다.
- terms는 실제 PO 조회 근거와 최종 본문에 일치해야 합니다. 확인하지 않은 번역을 검수 완료로 처리하지 마세요.
- used는 확정된 msgstr와 정확히 같아야 합니다. 번역이 없으면 msgid와 대소문자까지 같아야 합니다. 조사나 영문 병기는 used 밖의 본문에 붙입니다.
- 게임 명칭이 없는 글만 terms를 빈 배열로 반환할 수 있습니다.
- 아래 JSON 객체만 반환합니다. changelog에는 게시글 본문만 넣고, 용어 대조표와 검수 설명은 넣지 않습니다. 코드 블록이나 앞뒤 설명을 붙이지 않습니다.
{"changelog":"수정된 게시글 본문","terms":[{"msgid":"원문의 전체 명칭","msgctxt":null,"used":"본문에 사용한 표현"}]}
PO 파일: ${glossaryPo ?? "/home/scarf/repo/cata/translations/lang/po/ko.po"}
${title ? `- 목표 제목: ${title}\n` : ""}

# 원본 근거
${sourcePrompt}

# 초안
${draft}
`
