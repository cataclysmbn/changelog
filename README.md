# dc-changelog

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
└── changelog.html
```

`changelog.html`을 DCInside 글쓰기의 HTML 모드에 붙여 넣고, `changelog.txt` 첫 줄의 제목을 제목 칸에 넣습니다. 이미지는 PR 본문에 적힌 GitHub 영구 주소(`https://github.com/user-attachments/assets/...`)를 그대로 씁니다. 익명으로 내려받을 수 없는 이미지와 GitHub 밖의 이미지는 쓰지 않습니다.

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

프롬프트와 pi 작업 디렉터리는 임시 디렉터리에만 만들고, pi는 `--no-context-files`로 전역 `AGENTS.md`를 막은 뒤 역할별 `AGENTS.md` 내용을 주입해 작성자/검수자 2회로 실행합니다. 프롬프트에는 `/home/scarf/repo/cata/translations/lang/po/ko.po`에서 문맥과 번역 상태를 보존한 용어 근거를 넣습니다. 기본 도구는 읽기 전용 `read,grep`이며, 작성자와 검수자가 필요한 PO 항목을 직접 조회할 수 있습니다. pi 인증/모델 설정은 기존 사용자 설정을 그대로 사용합니다.

검수자는 수정된 본문과 게임 명칭별 `msgid`·`msgctxt`·본문 표현을 JSON으로 반환합니다. 프로그램은 실제 PO, 템플릿, PR 근거의 URL과 대조한 뒤에만 최종 `changelog.txt`와 `changelog.html`을 저장합니다. 정확한 번역이 없거나 fuzzy이면 영어 이름을 유지합니다. 검증 근거와 PO/본문 해시는 `dist/.reviews/<기간>.json`에 저장되며 게시글 본문에는 포함되지 않습니다. 대조에 실패하면 같은 검수 단계에 오류를 전달해 한 번 수정하도록 합니다. 재차 실패하면 기존 변경로그를 덮어쓰지 않고, 진단용 임시 입력·응답 경로를 표시합니다.

`--no-review`는 기존처럼 검수와 PO 대조를 명시적으로 건너뜁니다. `--pi-tools none`은 직접 조회 도구를 끄지만 기본 검수의 PO 대조는 유지합니다. `--skip-glossary`는 프롬프트에 자동 첨부하는 용어 근거만 생략합니다.

`--agent claude`를 주면 pi 대신 `claude -p`로 같은 작성자/검수자 2회를 실행합니다. 사용자 설정·MCP·슬래시 명령을 끄고 `Read,Grep`만 허용하며, 모델은 `--model`로 지정합니다. 기본값은 `--agent pi`(모델 `openai-codex/gpt-5.6-terra:medium`)입니다.

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
