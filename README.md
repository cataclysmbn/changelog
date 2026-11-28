# changelog

로그라이크 갤러리에 올릴 Cataclysm: Bright Nights 패치글 초안을 만들고 <https://changes.cataclysmbn.org/>에 올립니다.

## 설치

Node.js 26, [Vite+](https://viteplus.dev/guide/), ImageMagick이 필요합니다.

```sh
curl -fsSL https://vite.plus | bash
vp install
```

## 글 만들기

```sh
vp run tui
```

고른 주를 글 하나로 묶어 `dist/<시작일>_to_<종료일>/`에 저장하고 사이트에 올립니다.

| 파일                 | 내용                                              |
| -------------------- | ------------------------------------------------- |
| `changelog.txt`      | 원고. 첫 줄이 제목이고 이미지는 GitHub 주소       |
| `changelog.md`       | 이미지를 jsDelivr 주소로 바꾼 사이트용 글         |
| `changelog.html`     | `changelog.md`로 만든 DCInside용 HTML             |
| `changelog.en.*`     | 영문본                                            |
| `commits.txt`        | 글에 넣은 커밋 해시                               |
| `description.txt`    | 링크 미리보기에 나올 큰 변경 5~10개, 한 줄에 하나 |
| `description.en.txt` | 영문 미리보기                                     |

DCInside에 올릴 때는 `changelog.html`을 HTML 모드에 붙여 넣고, `changelog.txt` 첫 줄을 제목 칸에 넣습니다.

다음 글에는 직전 글 시작일부터 새 글 시작일 전까지의 커밋 중 `commits.txt`에 없는 커밋도 들어가고, 글 기간은 그 커밋 날짜부터로 늘어납니다. `commits.txt`가 없는 글은 마지막 날 전의 커밋 전부와, 마지막 날 커밋 중 글에 PR 링크가 있는 커밋을 넣은 것으로 봅니다.

이미지는 PR 본문의 GitHub 이미지 주소(`https://github.com/user-attachments/assets/...` 등)에서 가져옵니다. 로그인해야 받을 수 있는 이미지와 GitHub 밖의 이미지는 뺍니다. DCInside가 GitHub 이미지 주소를 지우기 때문에 사본을 이 저장소의 `images` 브랜치에 push하고 jsDelivr 주소를 씁니다. WebP로 바꿔서 원본보다 작을 때만 WebP를 올립니다. 픽셀 아트(긴 변 128 px 이하 또는 256색 이하)는 무손실, 나머지는 품질 50입니다. 이미지는 폭 425 px까지 보이고, 가로가 세로의 2배 이상이면 850 px까지 보입니다.

영문본은 검수한 한국어 글을 줄마다 옮긴 글이고, 게임 명칭은 PO 원문(`msgid`)을 씁니다. 줄 종류, 링크, 이미지가 한국어 글과 다르거나 한글이 남으면 한 번 더 번역하고, 그래도 다르면 저장하지 않습니다.

HTML 끝에는 `이 변경 내역은 AI(gpt-5.6-terra)로 자동 생성되었습니다.` 줄이 붙습니다. 모델 이름은 `vp run tui`에서는 실행한 모델이고, `vp run html`에서는 두 번째 인자입니다.

## 고친 글 다시 올리기

`changelog.txt`나 `changelog.en.txt`를 고쳤으면 옆의 Markdown과 HTML을 다시 만들고, 사이트에 다시 올립니다. `vp run pages`에는 기간 여러 개를 한 번에 줄 수 있습니다.

```sh
vp run html dist/2026-05-25_to_2026-06-21/changelog.txt gpt-5.6-terra
vp run html dist/2026-05-25_to_2026-06-21/changelog.en.txt gpt-5.6-terra
vp run pages dist/2026-05-25_to_2026-06-21
```

## 변경 전후 비교 이미지

PR에 변경 전후 스크린샷이 여러 짝 있으면 animated WebP 하나로 합칠 수 있습니다. 짝마다 왼쪽에 변경 전, 오른쪽에 변경 후가 나오고 1초마다 다음 짝으로 넘어갑니다. 인자는 `변경 전 변경 후` 순서의 URL이나 파일 경로입니다. 움직이는 이미지는 첫 장면만 남기 때문에 `vp run compare`가 거부하고, 글의 비교 이미지 줄에 있으면 `vp run html`이 합치지 않고 두 장을 그대로 올립니다.

```sh
vp run compare -o dist/2026-11-09_to_2026-11-14/10834-before-after.webp <전1> <후1> <전2> <후2>
```

만든 파일을 `changelog.txt`와 `changelog.en.txt`의 이미지 줄에 `file:///절대/경로.webp`로 넣고 `vp run html`을 다시 실행합니다. 짝 맞추는 방법은 `.agents/skills/before-after/SKILL.md`에 있습니다.

## 원고 형식

```text
# 밝밤) 10월 26일 ~ 11월 1일 패치

## [변경 항목 이름](PR URL)
![](대표 이미지 URL)
무엇이 바뀌었는지 한 문장
어떻게 달라지는지 조건, 수치, 예시를 붙인 1~2문장
- 핵심 1
- 핵심 2
- 핵심 3
![이미지 설명](추가 이미지 URL)
```

작성 규칙은 `.agents/skills/dcinside-changelog/SKILL.md`에 있습니다.

## 작성과 검수

pi가 작성자, 검수자, 영문 번역자 순서로 글을 쓰고, 마지막에 큰 변경 5~10개를 골라 `description.txt`와 `description.en.txt`에 씁니다. 관련된 항목은 하나로 묶고 수치를 합칩니다(대기 1.2배, 3배, 1.4배 빨라짐 → 대기 약 5배 빨라짐).

- 프롬프트와 pi 작업 디렉터리는 임시 디렉터리에만 만들고, 전역 `AGENTS.md` 대신 역할별 지침을 줍니다(`--no-context-files`).
- 프롬프트에 `/home/scarf/repo/cata/translations/lang/po/ko.po`의 용어 번역을 문맥(`msgctxt`), 번역 상태와 함께 넣습니다. 작성자와 검수자는 기본 도구인 읽기 전용 `read,grep`으로 PO를 직접 찾아볼 수 있습니다.
- pi 인증과 모델은 사용자 설정을 씁니다.

검수자는 고친 본문과 게임 명칭별 `msgid`, `msgctxt`, 본문 표현을 JSON으로 돌려줍니다. 게임 명칭은 PO와, 본문은 템플릿, PR 근거 URL과 맞춰 본 뒤에 글을 저장합니다. 정확한 번역이 없거나 fuzzy이면 영어 이름을 씁니다. 맞지 않으면 검수자에게 오류를 보내 한 번 더 고치게 하고, 또 틀리면 기존 글을 그대로 두고 진단용 임시 입력과 응답 경로를 출력합니다. 검증 근거와 PO·본문 해시는 글이 아닌 `dist/.reviews/<기간>.json`에 남습니다.

| 옵션              | 동작                                                                              |
| ----------------- | --------------------------------------------------------------------------------- |
| `--no-review`     | 검수와 PO 대조를 건너뜀                                                           |
| `--pi-tools none` | PO 조회 도구를 끔. PO 대조는 그대로 함                                            |
| `--skip-glossary` | 프롬프트에 용어 번역만 넣지 않음. PO 대조는 그대로 함                             |
| `--agent claude`  | pi 대신 `claude -p`로 실행. 사용자 설정, MCP, 슬래시 명령을 끄고 `Read,Grep`만 씀 |
| `--model`         | 모델                                                                              |

`--agent`와 `--model`을 둘 다 주지 않으면 `claude auth status`의 요금제로 고릅니다.

| 요금제              | 실행                                 |
| ------------------- | ------------------------------------ |
| Claude Max 10x 이상 | `claude -p`, `claude-opus-5-5`       |
| Claude Max 5x       | `claude -p`, `claude-sonnet-5-5`     |
| 그 밖               | pi, `openai-codex/gpt-6-luna:medium` |

pi를 실행하지 않고 이번 주 프롬프트와 명령만 보기:

```sh
vp run tui --yes --dry-run --newest 0 --oldest 0
```

프롬프트만 만들기:

```sh
vp run dc --repo /home/scarf/repo/cata/Cataclysm-BN --since 2026-01-01 --until 2026-01-07 -o /tmp/prompt.md
```

날짜별 초안 만들기:

```sh
vp run dc --repo /home/scarf/repo/cata/Cataclysm-BN v0.10.0..HEAD --mode draft
```

## 사이트

| 주소           | 내용                                        |
| -------------- | ------------------------------------------- |
| `/`            | 가장 최근 글                                |
| `/<기간>/`     | 그 기간의 글                                |
| `/<기간>.html` | 같은 글의 DCInside용 HTML(그대로 붙여 넣기) |
| `/archive/`    | 전체 목록                                   |
| `/en/...`      | 영문 책의 같은 주소                         |

- 왼쪽 목록에 모든 글이 최신순으로 나옵니다.
- 브라우저 언어가 한국어가 아니면 영문 글이 열립니다. 주소에 `?ko`를 붙이면 한국어 글이 열립니다.
- 위쪽 막대 왼쪽의 아이콘으로 언어와 날짜 순서(오래된 날짜부터, 최근 날짜부터)를 바꿉니다. 고른 값은 브라우저에 남습니다.
- 위쪽 막대 오른쪽의 공유 버튼에서 디시인사이드를 누르면 그 글의 `/<기간>.html`이 클립보드에 복사됩니다.
- 링크 미리보기 설명(`og:description`)은 `book/<언어>/src/<기간>/description.txt`의 줄을 `·`로 이은 것입니다. 설명이 없는 글에는 `vp run describe`로 만들고, 기간을 주면 그 글만 만듭니다.

사이트는 mdBook 책 두 권입니다. 한국어 책은 `book/ko/`, 영문 책은 `book/en/`이고, 글은 `book/<언어>/src/<기간>/index.md`입니다. `vp run tui`는 두 책에 글을 넣고 목록(`SUMMARY.md`, `archive/index.md`)을 다시 써서 `main`에 push합니다. `vp run pages`나 책을 직접 고친 커밋도 `main`에 push하면 GitHub Actions가 사이트를 GitHub Pages에 올립니다. 로컬 저장소는 `git pull`로 맞춥니다.

책을 직접 고쳐도 됩니다. 미리 보기와 사이트 빌드에는 `mdbook`이 필요합니다.

```sh
vp run serve
vp run site _site
```

## 개발

```sh
vp check
vp test
```
