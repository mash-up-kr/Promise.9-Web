# Git 컨벤션 (브랜치 · 커밋 · PR · 이슈)

앱/웹/익스텐션 전 영역 적용. **단일 출처** — 다른 곳에 중복하지 않는다.

## 공통

- type 은 **소문자**: `feat` `fix` `chore` `docs` `refactor` `test` `perf` `style` `ci` `build` `revert` (Conventional Commits 표준).
- 요약·본문은 한글 OK.

## Branch

- 패턴: **`<type>/<issue#>-<kebab-slug>`**
  - 예: `feat/2-init-setup`, `fix/15-link-card-crash`, `chore/7-eslint-rules`
- 이슈 없는 잡일은 `chore/<slug>` 허용.
- monorepo scope 는 slug prefix 로 녹임: `feat/2-app-link-card`, `chore/3-extension-build`.
- slug: kebab-case 영문, ~50자 권장. 짧고 의도 명확하게.
- 머지된 브랜치는 즉시 삭제.
- `main` 직접 push 금지.

## Commit · PR · Issue 제목 (통일)

- 형식: **`<type>(<scope>): <요약>`**
- scope (선택):
  - 영역: `app` · `web` · `extension` · `shared`
  - 설정: `deps` · `ci` · `lint` · `config` · `docs`
  - 기능: `auth` · `link` · `library` · … (자유)
  - 단일 영역이 명확하거나 다영역에 걸치면 생략: `chore: 프로젝트 초기 셋업 보강`.
- 예:
  - `feat(app): 로그인 화면 추가`
  - `fix(extension): popup 렌더링 버그`
  - `chore(deps): expo 56 업그레이드`
  - `chore: 프로젝트 초기 셋업 보강`

## Commit

- 메시지 = 위 통일 제목 + 필요 시 본문 bullet.
- 본문은 빈 줄 한 칸 띄우고 한글 bullet.
- **Co-authored-by 줄 절대 포함하지 않는다.**

## Pull Request

- 제목: 위 통일 형식 그대로 (이슈 번호 박지 않음 — 본문 `Resolves` 가 처리).
- 본문은 `.github/PULL_REQUEST_TEMPLATE.md` 와 일치:

  ```
  ## 관련 이슈
  - Resolves : #<번호>     <!-- 없으면 `- 해당 없음` -->

  ## 작업 사항
  - <bullet, 한글>

  ## 참고 사항
  - <맥락/주의사항, 없으면 `-`>
  ```

- 이슈 자동 close 는 본문의 `Resolves : #<번호>` 가 트리거.

## Issue

- 제목: 위 통일 형식 그대로. 다영역/추상 이슈는 scope 생략.
- 본문은 `.github/ISSUE_TEMPLATE.md` 와 일치:

  ```
  ## 배경 / 목적
  - <왜 필요한지>

  ## 할 일
  - [ ] <체크박스로 완료 조건>

  ## 참고 사항
  - <맥락/주의사항, 없으면 `-`>
  ```
