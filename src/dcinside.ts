import { Lexer, type Tokens } from "marked"

export type Commit = {
  hash: string
  date: string
  subject: string
  author: string
  body: string
  pullRequest?: PullRequestDetails
}

export type PullRequestDetails = {
  number: number
  title: string
  url: string
  body: string
  files: string[]
  images: string[]
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

const monthDay = (date: string): string => {
  const [month = "", day = ""] = date.split("-").slice(1)
  const parsedMonth = Number(month)
  const parsedDay = Number(day)
  if (Number.isNaN(parsedMonth) || Number.isNaN(parsedDay)) {
    return date
  }
  return `${parsedMonth}월 ${parsedDay}일`
}

export const titleRange = (commits: Commit[]): string => {
  if (commits.length === 0) return "밝밤) 패치"
  const dates = commits.map((commit) => commit.date).toSorted()
  return `밝밤) ${monthDay(dates[0])} ~ ${monthDay(dates.at(-1)!)} 패치`
}

const cleanMarkdown = (body: string): string =>
  body
    .replace(/<!-- BEGIN artifact comment -->[\s\S]*?<!-- END artifact comment -->/giu, "")
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

const prNumber = (subject: string): string | null => subject.match(/\(#(\d+)\)$/u)?.[1] ?? null

const stripConventionalPrefix = (subject: string): string =>
  subject
    .replace(/^\w+(?:\([^)]*\))?!?:\s*/u, "")
    .replace(/\s*\(#\d+\)$/u, "")
    .trim()

export const groupedCommits = (commits: Commit[]): Map<string, Commit[]> => {
  const byDate = new Map<string, Commit[]>()
  for (const commit of commits.toSorted((a, b) => a.date.localeCompare(b.date))) {
    byDate.set(commit.date, [...(byDate.get(commit.date) ?? []), commit])
  }
  return byDate
}

export const draftPost = ({ commits, title, includeBody = false }: DraftOptions): string => {
  const sections = commits
    .map((commit) => {
      const refs = [`${commit.hash}`]
      const pr = prNumber(commit.subject)
      if (pr) refs.unshift(`#${pr}`)
      return [
        `## ${stripConventionalPrefix(commit.subject)} (${refs.join(", ")})`,
        ...(includeBody ? bodySummary(commit.body) : []),
      ].join("\n")
    })
    .join("\n\n")

  return `# ${title ?? titleRange(commits)}\n\n${sections}\n`
}

const permanentImageUrl =
  /^https:\/\/(?:github\.com\/(?:user-attachments\/assets|[^/]+\/[^/]+\/assets)\/|user-images\.githubusercontent\.com\/|raw\.githubusercontent\.com\/)/u

/** Permanent GitHub image candidates in a raw PR body; signed `private-user-images` URLs expire and never match. */
export const githubImageUrls = (markdown: string): string[] =>
  [
    ...new Set(
      [...markdown.matchAll(/https:\/\/[^\s)\]"'<>]+/gu)].map(([url]) =>
        url.replace(/[.,;:!*]+$/u, ""),
      ),
    ),
  ].filter((url) => permanentImageUrl.test(url))

// One URL is a plain image; an even count of URLs alternates before, after and becomes one comparison image.
const imageLine = /^!\[([^\]]*)\]\((\S+(?: (?!!\[)\S+)*)\)$/u
const tableRow = /^\|.*\|$/u
const tableSeparator = /^\|(?:\s*:?-+:?\s*\|)+$/u
const linkedHeading = /^## \[([^\]]+)\]\((\S+)\)$/u
const dateLine = /^(?:\d{1,2}월 \d{1,2}일|[A-Z][a-z]{2} \d{1,2})$/u

const postLines = (post: string): string[] =>
  post
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

const tableCells = (row: string): string[] =>
  row
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim())

/** Image matches of a text that holds only images. After mirroring, one table cell can hold several images. */
const textImages = (text: string): RegExpMatchArray[] | undefined => {
  const images = text.split(/(?<=\)) (?=!\[)/u).map((part) => part.match(imageLine))
  return images.every((image) => image !== null) ? images : undefined
}

/** Image matches of an image line or of the image cells of a table row. */
const lineImages = (line: string): RegExpMatchArray[] =>
  (tableRow.test(line) ? tableCells(line) : [line]).flatMap((text) => textImages(text) ?? [])

const evidenceUrls = (source: string, label: string): Set<string> =>
  new Set([...source.matchAll(new RegExp(`^  ${label}: (\\S+)$`, "gmu"))].map((match) => match[1]))

/** Rejects text outside the post template and URLs that the PR evidence does not list. */
export const assertPostFormat = (post: string, source: string): void => {
  const images = evidenceUrls(source, "Image")
  const links = evidenceUrls(source, "URL")
  const lines = postLines(post)
  if (!lines[0]?.startsWith("# ")) {
    throw new Error("글 형식 오류: 첫 줄은 '# 제목'이어야 합니다")
  }
  if (!lines.some((line) => line.startsWith("## "))) {
    throw new Error("글 형식 오류: '## 항목' 줄이 없습니다")
  }
  for (const [index, line] of lines.entries()) {
    const image = line.match(imageLine)
    const link = line.match(linkedHeading)
    const table = tableRow.test(line)
    for (const [, , source] of lineImages(line)) {
      const urls = source.split(" ")
      const missing = urls.find((url) => !images.has(url))
      if (missing) throw new Error(`PR 근거에 없는 이미지: ${missing}`)
      if (urls.length % 2 !== 0 && urls.length > 1) {
        throw new Error(`비교 이미지는 전, 후 짝이어야 합니다: ${source}`)
      }
    }
    if (
      table &&
      tableCells(line).some((cell) => !imageLine.test(cell) && /!\[|https?:\/\//u.test(cell))
    )
      throw new Error(`템플릿에 없는 줄: ${line}`)
    if (link && !links.has(link[2])) {
      throw new Error(`PR 근거에 없는 링크: ${link[2]}`)
    }
    if (
      !image &&
      !link &&
      !table &&
      (/^(?:ㄴ|\* |✓|```)|https?:\/\//u.test(line) ||
        (index > 0 && /^#+ /u.test(line) && !line.startsWith("## ")))
    )
      throw new Error(`템플릿에 없는 줄: ${line}`)
  }
}

/** Distinct image sources of a post, in order of first use; a comparison source is its URLs joined by spaces. */
export const postImageUrls = (post: string): string[] => [
  ...new Set(postLines(post).flatMap((line) => lineImages(line).map((image) => image[2]))),
]

/** Returns one image per URL that replaces a source. Only the last image keeps the caption, so the caption shows once below all of them. */
const images = ([, caption, source]: RegExpMatchArray, replace: (url: string) => string[]) =>
  replace(source).map(
    (url, index, urls) => `![${index === urls.length - 1 ? caption : ""}](${url})`,
  )

/** Replaces the source of each image line and image table cell with one image per returned URL; other lines keep their URLs. */
export const mapPostImages = (post: string, replace: (url: string) => string[]): string =>
  post
    .split("\n")
    .map((line) => {
      const image = line.trim().match(imageLine)
      if (image) return images(image, replace).join("\n")
      if (!tableRow.test(line.trim())) return line
      return `| ${tableCells(line.trim())
        .map((cell) => {
          const cellImage = cell.match(imageLine)
          return cellImage ? images(cellImage, replace).join(" ") : cell
        })
        .join(" | ")} |`
    })
    .join("\n")

export const escapeHtml = (text: string): string =>
  text
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;")
    .replace(/"/gu, "&quot;")

/** Post lines with each run of table rows joined into one block. */
const postBlocks = (lines: string[]): (string | string[])[] =>
  lines.reduce<(string | string[])[]>((blocks, line) => {
    const last = blocks.at(-1)
    if (!tableRow.test(line)) return [...blocks, line]
    return Array.isArray(last) ? [...blocks.slice(0, -1), [...last, line]] : [...blocks, [line]]
  }, [])

/** Last line of each post: names the AI model that wrote it. */
export const aiFooter = (model: string, english = false): string =>
  english
    ? `This changelog was generated automatically by AI (${model}).`
    : `이 변경 내역은 AI(${model})로 자동 생성되었습니다.`

/** Writes a post as Markdown with a blank line between blocks, so mdBook keeps each post line apart; dates and entries become nested headings for `renderPostHtml`, bullets stay one list, and `footer` follows a rule at the end. */
export const postMarkdown = (post: string, footer?: string): string =>
  postBlocks(
    postLines(post).map((line) =>
      dateLine.test(line) ? `## ${line}` : line.startsWith("## ") ? `#${line}` : line,
    ),
  )
    .map((block) => (Array.isArray(block) ? block.join("\n") : block))
    .concat(footer ? ["---", footer] : [])
    .map((block, index, blocks) =>
      index === 0
        ? block
        : `${block.startsWith("- ") && blocks[index - 1].startsWith("- ") ? "\n" : "\n\n"}${block}`,
    )
    .join("") + "\n"

const htmlImage = (url: string, alt: string, width: string): string =>
  `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" style="max-width:${width};height:auto;">`

/** Renders table rows as one table; a separator second row makes the first row the header. */
const renderTable = (rows: string[]): string => {
  const header = tableSeparator.test(rows[1] ?? "")
  return `<table border="1" style="border-collapse:collapse;width:100%;max-width:850px;">\n${rows
    .filter((row) => !tableSeparator.test(row))
    .map((row, index) => {
      const tag = header && index === 0 ? "th" : "td"
      return `<tr>${tableCells(row)
        .map((cell) => {
          const images = textImages(cell)
          return `<${tag}>${images ? images.map(([, alt, url]) => htmlImage(url, alt, "100%")).join("<br>") : escapeHtml(cell)}</${tag}>`
        })
        .join("")}</tr>`
    })
    .join("\n")}\n</table>`
}

/** Renders a post's site Markdown (from `postMarkdown`) to the HTML fragment for the DCInside HTML editor; the title goes in its own form field. Images in `wide` may grow to two normal widths, a `---` rule becomes a blank line, and lines outside the template stay as typed. */
export const renderPostHtml = (
  markdown: string,
  { wide = new Set() }: { wide?: ReadonlySet<string> } = {},
): string =>
  // Lex each blank-line block on its own, so an unclosed fence or comment cannot swallow the rest of the post.
  markdown
    .split(/\n{2,}/u)
    .flatMap((block) => new Lexer().lex(block))
    .filter((token) => token.type !== "space" && !(token.type === "heading" && token.depth === 1))
    .map((token, index, tokens) => {
      const previous = tokens[index - 1]
      const lines = token.raw.trim().split("\n")
      // A blank line and an empty bold line separate entries and dates, except an entry right below its date.
      const gap =
        index > 0 && !(previous.type === "heading" && previous.depth === 2)
          ? "<p><br></p>\n<p><b><br></b></p>\n"
          : ""
      if (token.type === "heading" && lines[0].startsWith("#")) {
        const link =
          token.tokens?.length === 1 && token.tokens[0].type === "link"
            ? (token.tokens[0] as Tokens.Link)
            : undefined
        const name = link
          ? `<a href="${escapeHtml(link.href)}" target="_blank">${escapeHtml(link.text)}</a>`
          : escapeHtml(token.text)
        return `${gap}<p><b>${name}</b></p>`
      }
      if (lines.join("\n") === "---") return "<p><br></p>"
      if (lines.every((line) => tableRow.test(line))) return renderTable(lines)
      const image =
        token.type === "paragraph" && token.tokens?.length === 1 && token.tokens[0].type === "image"
          ? (token.tokens[0] as Tokens.Image)
          : undefined
      if (image) {
        const tag = `<p>${htmlImage(
          image.href,
          image.text,
          `${wide.has(image.href) ? 850 : 425}px`,
        )}</p>`
        return image.text ? `${tag}\n<p>▲ ${escapeHtml(image.text)}</p>` : tag
      }
      const bullets = token.type === "list" && lines.every((line) => line.startsWith("- "))
      return lines
        .map((line) => `<p>${bullets ? `• ${escapeHtml(line.slice(2))}` : escapeHtml(line)}</p>`)
        .join("\n")
    })
    .join("\n") + "\n"

export const translationGuide = `한국어 용어 확인:
- 생성 프롬프트의 "# 한국어 PO 용어 근거"에서 같은 msgid/context의 msgstr를 확인합니다.
- 근거에 없는 보이는 영어 이름은 지정된 "PO 파일"을 읽기 전용 grep/read 도구로 직접 조회합니다. 쉘 도구가 있으면 \`rg -n -C2 -i '<English term>'\`를 사용할 수 있습니다. 조회 도구가 없으면 제공된 근거만 사용하고 확인되지 않은 이름은 원문으로 남깁니다.
- msgid는 원문의 전체 명칭으로 조회하고 msgctxt를 함께 확인합니다. 문맥이 불명확하면 추가 조회하며 임의로 고르지 않습니다.
- 항목이 없거나 msgstr가 비어 있거나 fuzzy이면 영문 명칭을 그대로 유지합니다. 단어를 쪼개 추측 번역하거나 다른 항목의 번역으로 새 이름을 만들지 않습니다.
- PR이 특정 타일셋이나 모드를 다루면 분류어를 번역(isometric → 등각)하지 말고 그 이름(Ultica_iso 타일셋)으로 씁니다.`

const styleGuide = `DCInside 밝밤 패치글 형식:
- 아래 템플릿을 줄 단위로 따릅니다. 프로그램이 각 줄을 게시용 HTML로 바꿉니다.

# 밝밤) M월 D일 ~ M월 D일 패치

M월 D일

## [변경 항목 이름](PR URL)
![](대표 이미지 URL)
무엇이 바뀌었는지 한 문장
어떻게 달라지는지 조건, 수치, 예시를 붙인 1~2문장
- 핵심 1
- 핵심 2
- 핵심 3
![이미지 설명](추가 이미지 URL)

- 첫 줄은 "# " 제목이고, 항목마다 "## " 줄로 시작합니다. 플레이어 체감이 큰 항목을 먼저 씁니다.
- 날짜 머리말은 "M월 D일" 단독 줄로, 그날 머지된 항목들 위에 한 번만 씁니다. 날짜는 근거의 날짜 머리말을 따르고 오름차순입니다. 항목 이름 옆에 날짜를 붙이지 않습니다.
- "*" 불릿, "ㄴ" 하위 불릿, 마크다운 강조, 코드 블록은 쓰지 않습니다.
- 대표 이미지, 설명 문장, "- " 불릿 줄, 추가 이미지는 근거가 있을 때만 넣습니다. 작은 수정은 "##" 줄과 한 문장만 씁니다.
- 항목 이름에 PR 링크를 겁니다. 한 항목에 PR이 여럿이면 첫 번째 PR만 겁니다. 따로 된 링크 줄은 쓰지 않습니다.
- 이미지 URL은 근거의 "Image:" 값을, 링크 URL은 근거의 "URL:" 값을 그대로 복사합니다. 추가 이미지에는 설명을 붙입니다.
- "file://"로 시작하는 "Image:" 값은 커밋이 타일셋 시트에서 바꾼 스프라이트만 모은 그림입니다. 선명한 그림은 새 스프라이트이고, 그 밑에 흐리게 비치는 그림은 예전 스프라이트입니다. 흐린 그림만 있는 칸은 바뀌지 않은 옆 스프라이트입니다. 스프라이트를 추가하거나 바꾼 항목이면 대표 이미지로 씁니다.
- 같은 종류의 이미지 2~6장(로딩 화면, 스프라이트 변형, 아이콘 묶음)은 2열 표로 묶습니다. 이름 행과 이미지 행을 번갈아 "| 허브 | 고속도로 |", "|---|---|", "| ![](URL) | ![](URL) |", "| 숲 | 도시 |", "| ![](URL) | ![](URL) |"처럼 씁니다. 작은 글씨를 읽어야 하는 UI 화면, 서로 다른 기능을 보여 주는 이미지, 움직이는 이미지, 가로세로 비율이 3배 넘게 다른 이미지는 묶지 않고 한 줄에 한 장씩 올립니다.
- 근거 본문에 전/후 비교 이미지가 있으면 아래 두 방식 중 항목을 더 잘 보여 주는 쪽을 고릅니다.
  - 비교 이미지: "![](전 URL 후 URL)"처럼 한 줄에 전, 후 URL을 공백으로 나란히 씁니다. 짝이 여럿이면 "![](전1 후1 전2 후2)"로 이어 씁니다. 프로그램이 왼쪽 Before, 오른쪽 After로 붙이고 짝마다 한 장씩 넘어가는 움직이는 이미지로 만듭니다. 전이나 후가 움직이는 이미지면 붙이지 않고 두 장을 차례로 그대로 올립니다. 화면 한 곳의 단순 전/후에 씁니다.
  - 표: 행이나 열 이름(타일셋, 설정값 등)이 비교의 핵심이면 근거의 표를 같은 행과 열로 옮깁니다. "| 타일셋 | 전 | 후 |", "|---|---|---|", "| HitButton_iso | ![](URL) | ![](URL) |"처럼 씁니다. 칸에는 짧은 글이나 이미지 하나만 넣고, 머리 행 글은 한국어로 씁니다.
- 문장은 "~함", "~추가"처럼 짧게 끝냅니다.
- 한국어 위주로 쓰고 필요한 경우 첫 언급에만 영어 원문을 괄호로 병기합니다.
- 플레이어가 체감하는 기능, 콘텐츠, 밸런스, UI, 버그 수정을 우선합니다.
- PR 제목만 번역하지 말고 PR 본문/파일/이미지 근거에서 Where + What + Result를 뽑아 씁니다.
- PR 근거가 내부 개발/CI/리팩터링/Lua 타입체크뿐이면 게시글에서 뺍니다. 단, 실험판 다운로드 파일, 기본 포함 모드, 플레이 가능한 모드 콘텐츠처럼 플레이어가 직접 보는 변화는 남깁니다.
- 되돌림/후속 수정 관계가 보이면 최종 플레이어 결과 하나로 합칩니다.
- "번들 배포", "레지스트리 모드", "전용 위치", "정리", "공용 팩토리", "갱신"처럼 한국 플레이어가 바로 이해 못 하는 개발자 말을 금지합니다. 예: "실험판에 기본 포함 모드 추가", "크라켄이 호수의 난파선 특수 장소에서만 스폰", "크라켄 본체가 촉수를 소환하고 촉수가 공격을 담당".
- 갤러리에서 쓰는 말은 짧고 구체적입니다: 밝밤, ㅋㅌㅋㅂㅂ, ㅂㅂ, 실험판, 안정판, 최신버전, 하늘섬, 람쥐모드, 파암, 한글패치, 시작 지점, 스폰, 타일, 줍기, 자동운전.
${translationGuide}
- 손작성 기준은 "밝밤) 1월 3일 ~ 1월 13일 패치", "밝밤) 1월 14일 ~ 2월 9일 패치"처럼 구체적 효과/수치/예시를 붙이는 방식입니다.
- 말투는 간결하고 갤러리 패치글처럼 담백하게 씁니다. 홍보 문구, 기여자 목록, 개발 과정 설명은 넣지 않습니다.
- 추측으로 내용을 만들지 말고 PR 근거가 부족한 항목은 빼거나 보수적으로 씁니다.
- "수정", "개선", "변경"만 쓰고 무엇이 달라졌는지 없는 항목은 실패입니다. 구체적 전/후, 조건, 예시를 붙입니다.
`

const indent = (text: string, prefix: string): string =>
  text
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n")

const prEvidence = (pullRequest: PullRequestDetails): string => {
  if (pullRequest.lookupError) {
    return indent(`PR lookup failed: ${pullRequest.lookupError}`, "  ")
  }

  const body = bodySummary(pullRequest.body, 18).join("\n")
  const files = pullRequest.files
    .slice(0, 20)
    .map((file) => `  - ${file}`)
    .join("\n")

  return [
    `  PR: #${pullRequest.number} ${pullRequest.title}`,
    `  URL: ${pullRequest.url}`,
    body ? `  Body evidence:\n${indent(body, "    ")}` : "  Body evidence: none",
    files ? `  Changed files:\n${files}` : "  Changed files: none",
    ...pullRequest.images.map((image) => `  Image: ${image}`),
  ].join("\n")
}

export const rewritePrompt = ({
  commits,
  title,
  includeBody = true,
  glossary,
  glossaryPo,
}: DraftOptions): string => {
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
            commit.pullRequest ? prEvidence(commit.pullRequest) : "  PR evidence: none",
          ]
            .filter((line) => line.length > 0)
            .join("\n")
        })
        .join("\n")
      return `${date}\n${entries}`
    })
    .join("\n\n")

  const glossarySection = glossary?.trim() ? `\n\n# 한국어 PO 용어 근거\n${glossary.trim()}\n` : ""

  return `${styleGuide}\n\n목표 제목: ${title ?? titleRange(commits)}\nPO 파일: ${
    glossaryPo ?? "/home/scarf/repo/cata/translations/lang/po/ko.po"
  }\n출력은 게시글 본문만 반환합니다.${glossarySection}\n\n아래 커밋/PR 근거를 읽고 위 형식의 한국어 패치글로 재작성해 주세요. 커밋 제목만 보고 쓰면 실패입니다. 플레이어가 읽고 "뭐가 어떻게 바뀌었는지" 알 수 없는 항목은 고치거나 삭제하세요.\n\n${rawEntries}\n`
}

export const reviewPrompt = ({
  draft,
  sourcePrompt,
  title,
  glossaryPo,
}: ReviewPromptOptions): string =>
  `${styleGuide}

당신은 표독한 senior 한국어 편집자 reviewer subagent입니다. 아래 초안을 0점짜리 개발자 번역이라고 의심하고, PR 근거와 대조해서 게시 가능한 밝밤 DCInside 패치글로 다시 고치세요.

검수 기준:
- 한국인이 안 쓰는 비문, 개발자 은어, 번역투를 전부 제거합니다.
- 플레이어에게 의미 없는 Lua/CI/리팩터링/팩토리/타입체크 항목은 삭제합니다.
- PR을 읽어야 알 수 있는 세부사항(무엇에서 무엇으로 바뀜, 어떤 버그가 고쳐짐, 어디서 체감됨)을 복원합니다.
- 근거의 "Image:" 이미지가 해당 항목 이해에 도움이 되면 템플릿 위치에 추가합니다.
- 후속 PR이 앞 PR을 고친 경우 최종 결과만 하나로 합칩니다.
- 템플릿 형식을 지킵니다. 초안의 "*", "ㄴ" 줄은 템플릿으로 바꾸고, 날짜 머리말은 "M월 D일" 줄로 유지합니다.
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

export type TranslatePromptOptions = {
  post: string
  title: string
  terms: { msgid: string; used: string }[]
}

const lineShape = (line: string): string => {
  if (tableSeparator.test(line)) return "table separator"
  if (tableRow.test(line)) {
    return `table ${tableCells(line)
      .map((cell) => {
        const image = cell.match(imageLine)
        return image ? `image ${image[1] ? "caption" : "bare"} ${image[2]}` : "text"
      })
      .join(" | ")}`
  }
  const image = line.match(imageLine)
  const link = line.match(linkedHeading)
  if (image) return `image ${image[1] ? "caption" : "bare"} ${image[2]}`
  if (link) return `heading ${link[2]}`
  if (dateLine.test(line)) return "date"
  return line.match(/^(?:## |# |- )/u)?.[0] ?? "text"
}

/** Rejects a translation whose lines differ in kind, link or image from the original, or that still has Hangul. */
export const assertSameLayout = (original: string, translation: string) => {
  const lines = postLines(translation)
  const hangul = lines.find((line) => /\p{Script=Hangul}/u.test(line))
  if (hangul) throw new Error(`번역에 한글이 남음: ${hangul}`)
  const expected = postLines(original).map(lineShape)
  const actual = lines.map(lineShape)
  const index = expected.findIndex((shape, i) => shape !== actual[i])
  if (index !== -1 || expected.length !== actual.length) {
    const at = index === -1 ? expected.length : index
    throw new Error(`번역 줄 구조 불일치 (${at + 1}번째 줄): ${expected[at]} -> ${actual[at]}`)
  }
}

export const translatePrompt = ({ post, title, terms }: TranslatePromptOptions): string =>
  `Translate this Korean Cataclysm: Bright Nights changelog into English for English-speaking players.

Rules:
- Return only the translated post. No code fence, preface, or notes.
- Keep every line in the same order and of the same kind: "# " title, "M월 D일" date line (write "Oct 19"), "## " heading, "![caption](url)" image (it may hold several URLs), "| ... |" table row, "- " bullet, plain text line. Do not add, drop, merge, or split lines. Keep the cells of each table row; translate text cells and keep image cells.
- Copy every URL exactly. Translate image captions; keep an empty caption empty.
- Replace the first line with: # ${title}
- Use the original English game names below for the Korean names in the post. Drop the English names that the Korean post adds in parentheses, since the English name is already in the text.
- Use short, plain patch-note sentences in Simplified Technical English. Keep numbers and "(a -> b)" values as they are.
- Do not leave any Korean text.

Game names (Korean -> English):
${terms.map(({ used, msgid }) => `- ${used} -> ${msgid}`).join("\n") || "- none"}

# Korean post
${post}
`
