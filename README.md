# changelog

DCInside 로그라이크 갤러리용 Cataclysm: Bright Nights 패치글 초안을 만드는 도구입니다.

## 사용법

대화형 생성:

```sh
deno task tui
```

고른 주들을 기간 하나로 합쳐 글 하나를 만듭니다. 결과는 `<시작일>_to_<종료일>` 폴더에 생성됩니다.

```text
dist/2026-05-25_to_2026-06-21/
├── changelog.txt
├── changelog.html
├── changelog.en.txt
├── changelog.en.html
└── commits.txt
```

`commits.txt`에는 글에 넣은 커밋 해시가 있습니다. 다음 글을 만들 때 직전 글 시작일부터 새 글 시작일 전까지의 커밋 중 이 목록에 없는 커밋도 함께 넣고, 글 기간을 그 커밋 날짜부터로 늘립니다. `commits.txt`가 없는 글은 마지막 날 전까지의 커밋과, 마지막 날에는 글에 PR 링크가 있는 커밋만 넣은 것으로 봅니다.

`changelog.en.*`는 검수를 마친 한국어 글을 줄 단위로 옮긴 영문본입니다. 게임 명칭은 검수에서 확인한 PO 원문(`msgid`)을 씁니다. 줄 종류, 링크, 이미지가 한국어 글과 다르거나 한글이 남으면 한 번 다시 번역하고, 그래도 다르면 저장하지 않습니다.

`changelog.html`을 DCInside 글쓰기의 HTML 모드에 붙여 넣고, `changelog.txt` 첫 줄의 제목을 제목 칸에 넣습니다. 이미지는 PR 본문에 적힌 GitHub 영구 주소(`https://github.com/user-attachments/assets/...`)에서 가져옵니다. 익명으로 내려받을 수 없는 이미지와 GitHub 밖의 이미지는 쓰지 않습니다. DCInside가 GitHub 이미지 주소를 지우므로, `changelog.html`에는 이미지 사본을 이 저장소의 `images` 브랜치에 push한 뒤 jsDelivr 주소를 넣습니다. 모든 이미지를 WebP로 변환해 보고 원본보다 작을 때만 WebP를 올립니다. 픽셀 아트(긴 변 128 px 이하 또는 256색 이하)는 무손실, 나머지는 품질 50입니다(ImageMagick 필요). 이미지는 최대 425 px 폭으로 보이고, 가로가 세로의 2배 이상인 이미지(변경 전후 비교 등)는 850 px까지 보입니다. `changelog.txt`에는 GitHub 주소가 남습니다.

`changelog.txt`나 `changelog.en.txt`를 고친 뒤 옆의 HTML만 다시 만들 때:

```sh
deno task html dist/2026-05-25_to_2026-06-21/changelog.txt gpt-5.6-terra
deno task html dist/2026-05-25_to_2026-06-21/changelog.en.txt gpt-5.6-terra
```

HTML 끝에는 글을 쓴 AI 모델을 밝히는 줄(`이 변경 내역은 AI(gpt-5.6-terra)로 자동 생성되었습니다.`)이 붙습니다. `deno task tui`는 실행에 쓴 모델 이름을 넣고, `deno task html`은 두 번째 인자로 받은 이름을 넣습니다.

`deno task tui`는 HTML을 만든 뒤 한국어와 영문 글을 GitHub Pages(<https://cataclysmbn.github.io/changelog/>)에 올립니다. 한국어 글은 `<기간>/`, 영문 글은 `<기간>/en.html`에 있습니다. 글을 고친 뒤 다시 올릴 때:

```sh
deno task pages dist/2026-05-25_to_2026-06-21
```

PR에 변경 전후 스크린샷 묶음이 있으면 짝마다 왼쪽에 변경 전, 오른쪽에 변경 후를 놓고 1초마다 다음 짝으로 넘어가는 animated WebP를 만들 수 있습니다. 인자는 `변경 전 변경 후` 순서의 짝이고 URL이나 파일 경로입니다.

```sh
deno task compare -o dist/2026-11-09_to_2026-11-14/10834-before-after.webp <전1> <후1> <전2> <후2>
```

만든 파일은 `changelog.txt`와 `changelog.en.txt`의 이미지 줄에 `file:///절대/경로.webp`로 넣고 `deno task html`로 HTML을 다시 만듭니다. 짝 맞추는 방법은 `.agents/skills/before-after/SKILL.md`에 있습니다.

`changelog.txt` 템플릿:

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

프롬프트와 pi 작업 디렉터리는 임시 디렉터리에만 만들고, pi는 `--no-context-files`로 전역 `AGENTS.md`를 막은 뒤 역할별 `AGENTS.md` 내용을 주입해 작성자, 검수자, 영문 번역자 순서로 실행합니다. 프롬프트에는 `/home/scarf/repo/cata/translations/lang/po/ko.po`에서 문맥과 번역 상태를 보존한 용어 근거를 넣습니다. 기본 도구는 읽기 전용 `read,grep`이며, 작성자와 검수자가 필요한 PO 항목을 직접 조회할 수 있습니다. pi 인증/모델 설정은 기존 사용자 설정을 그대로 사용합니다.

검수자는 수정된 본문과 게임 명칭별 `msgid`·`msgctxt`·본문 표현을 JSON으로 반환합니다. 프로그램은 실제 PO, 템플릿, PR 근거의 URL과 대조한 뒤에만 최종 `changelog.txt`와 `changelog.html`을 저장합니다. 정확한 번역이 없거나 fuzzy이면 영어 이름을 유지합니다. 검증 근거와 PO/본문 해시는 `dist/.reviews/<기간>.json`에 저장되며 게시글 본문에는 포함되지 않습니다. 대조에 실패하면 같은 검수 단계에 오류를 전달해 한 번 수정하도록 합니다. 재차 실패하면 기존 변경로그를 덮어쓰지 않고, 진단용 임시 입력·응답 경로를 표시합니다.

`--no-review`는 기존처럼 검수와 PO 대조를 명시적으로 건너뜁니다. `--pi-tools none`은 직접 조회 도구를 끄지만 기본 검수의 PO 대조는 유지합니다. `--skip-glossary`는 프롬프트에 자동 첨부하는 용어 근거만 생략합니다.

`--agent claude`를 주면 pi 대신 `claude -p`로 같은 세 단계를 실행합니다. 사용자 설정·MCP·슬래시 명령을 끄고 `Read,Grep`만 허용하며, 모델은 `--model`로 지정합니다. `--agent`와 `--model`을 둘 다 주지 않으면 `claude auth status`의 요금제를 보고 고릅니다.

| 요금제              | 실행                                 |
| ------------------- | ------------------------------------ |
| Claude Max 10x 이상 | `claude -p`, `claude-opus-5-5`       |
| Claude Max 5x       | `claude -p`, `claude-sonnet-5-5`     |
| 그 밖               | pi, `openai-codex/gpt-6-luna:medium` |

이번 주만 pi 실행 없이 프롬프트/명령 확인:

```sh
deno task tui --yes --dry-run --newest 0 --oldest 0
```

프롬프트 생성:

```sh
deno task dc --repo /home/scarf/repo/cata/Cataclysm-BN --since 2026-01-01 --until 2026-01-07 -o /tmp/prompt.md
```

바로 편집 가능한 날짜별 초안 생성:

```sh
deno task dc --repo /home/scarf/repo/cata/Cataclysm-BN v0.10.0..HEAD --mode draft
```

작성 규칙은 `.agents/skills/dcinside-changelog/SKILL.md`에 있습니다.
