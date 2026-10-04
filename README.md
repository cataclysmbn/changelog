# dc-changelog

DCInside 로그라이크 갤러리용 Cataclysm: Bright Nights 패치글 초안을 만드는 도구입니다.

## 사용법

대화형 주간 생성:

```sh
deno task tui
```

결과는 주별 폴더에 생성됩니다.

```text
dist/2026-06-15_to_2026-06-21/
├── changelog.txt
└── pr-9538-1.png
```

프롬프트와 pi 작업 디렉터리는 임시 디렉터리에만 만들고, pi는 `--no-context-files`로 전역 `AGENTS.md`를 막은 뒤 역할별 `AGENTS.md` 내용을 주입해 작성자/검수자 2회로 실행합니다. 프롬프트에는 `/home/scarf/repo/cata/translations/lang/po/ko.po`에서 문맥과 번역 상태를 보존한 용어 근거를 넣습니다. 기본 도구는 읽기 전용 `read,grep`이며, 작성자와 검수자가 필요한 PO 항목을 직접 조회할 수 있습니다. pi 인증/모델 설정은 기존 사용자 설정을 그대로 사용합니다. 최종 글에 쓰지 않은 이미지는 결과 폴더에서 지웁니다.

검수자는 수정된 본문과 게임 명칭별 `msgid`·`msgctxt`·본문 표현을 JSON으로 반환합니다. 프로그램은 실제 PO와 대조한 뒤에만 최종 `changelog.txt`를 저장합니다. 정확한 번역이 없거나 fuzzy이면 영어 이름을 유지합니다. 검증 근거와 PO/본문 해시는 `dist/.reviews/<기간>.json`에 저장되며 게시글 본문에는 포함되지 않습니다. 대조에 실패하면 같은 검수 단계에 오류를 전달해 한 번 수정하도록 합니다. 재차 실패하면 기존 변경로그와 이미지 정리를 진행하지 않고, 진단용 임시 입력·응답 경로를 표시합니다.

`--no-review`는 기존처럼 검수와 PO 대조를 명시적으로 건너뜁니다. `--pi-tools none`은 직접 조회 도구를 끄지만 기본 검수의 PO 대조는 유지합니다. `--skip-glossary`는 프롬프트에 자동 첨부하는 용어 근거만 생략합니다.

이번 주만 pi 실행 없이 프롬프트/명령 확인:

```sh
deno task tui --yes --dry-run --newest 0 --oldest 0
```

이미지 업로드만 실행하기 (`playwright-cli`와 Firefox 설치 필요):

```sh
deno task upload dist/2026-09-13_to_2026-09-29 dist/2026-09-28_to_2026-10-04
```

각 `changelog.txt`에서 파일명만 적힌 이미지 줄을 찾아 업로드하고, 내용이 같은 이미지는 한 번만 올립니다. 50개씩 나눠 처리하며 서버에서 표시되는지 확인한 뒤 각 폴더의 `uploads.json`에 파일명별 `src`·`tempno`·크기를 저장합니다. 원본 텍스트와 HTML은 수정하지 않으며 게시글도 등록하지 않습니다. 미게시 이미지의 보존 기간은 보장하지 않습니다.

기본 권한은 `dist/` 읽기·쓰기와 `playwright-cli` 실행으로 제한합니다. 다른 입력 폴더나 실행 파일은 해당 경로의 권한을 추가로 요청합니다. 기존 `uploads.json`이 있으면 업로드 전에 중단합니다. 의도적인 재업로드에는 `--force`, 다른 실행 파일에는 `--playwright /path/to/playwright-cli`를 사용하세요. CAPTCHA나 사이트 변경으로 실패하면 원본은 유지되지만, 이미 올라간 임시 이미지와 일부 폴더에 저장된 `uploads.json`은 남을 수 있습니다.

프롬프트 생성:

```sh
deno task dc --repo /home/scarf/repo/cata/Cataclysm-BN --since 2026-01-01 --until 2026-01-07 --asset-dir dist/2026-01-01_to_2026-01-07 -o /tmp/prompt.md
```

바로 편집 가능한 날짜별 초안 생성:

```sh
deno task dc --repo /home/scarf/repo/cata/Cataclysm-BN v0.10.0..HEAD --mode draft
```

작성 규칙은 `.agents/skills/dcinside-changelog/SKILL.md`에 있습니다.
