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

프롬프트와 pi 작업 디렉터리는 임시 디렉터리에만 만들고, pi는 `--no-context-files`로 전역 `AGENTS.md`를 막은 뒤 역할별 `AGENTS.md` 내용을 주입해 작성자/검수자 2회로 실행합니다. pi 인증/모델 설정은 기존 사용자 설정을 그대로 사용합니다. 최종 글에 쓰지 않은 이미지는 결과 폴더에서 지웁니다.

이번 주만 pi 실행 없이 프롬프트/명령 확인:

```sh
deno task tui --yes --dry-run --newest 0 --oldest 0
```

프롬프트 생성:

```sh
deno task dc --repo /home/scarf/repo/cata/Cataclysm-BN --since 2026-01-01 --until 2026-01-07 --asset-dir dist/2026-01-01_to_2026-01-07 -o /tmp/prompt.md
```

바로 편집 가능한 날짜별 초안 생성:

```sh
deno task dc --repo /home/scarf/repo/cata/Cataclysm-BN v0.10.0..HEAD --mode draft
```

작성 규칙은 `.agents/skills/dcinside-changelog/SKILL.md`에 있습니다.
