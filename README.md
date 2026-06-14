# dc-changelog

DCInside 로그라이크 갤러리용 Cataclysm: Bright Nights 패치글 초안을 만드는 도구입니다.

## 사용법

대화형 주간 생성:

```sh
deno task tui
```

이번 주만 pi 실행 없이 프롬프트/명령 확인:

```sh
deno task tui --yes --dry-run --newest 0 --oldest 0
```

프롬프트 생성:

```sh
deno task dc --repo /home/scarf/repo/cata/Cataclysm-BN --since 2026-01-01 --until 2026-01-07 -o out/prompt.md
```

바로 편집 가능한 날짜별 초안 생성:

```sh
deno task dc --repo /home/scarf/repo/cata/Cataclysm-BN v0.10.0..HEAD --mode draft
```

작성 규칙은 `.agents/skills/dcinside-changelog/SKILL.md`에 있습니다.
