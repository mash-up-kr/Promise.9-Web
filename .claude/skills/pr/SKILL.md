---
name: pr
description: |
  Creates a GitHub Pull Request by analyzing branch changes and filling in the project PR template.
  TRIGGER when: user invokes /pr directly, or says 'PR 만들어줘', 'PR 작성해줘'.
---

# PR 생성

현재 브랜치의 변경사항을 분석하여 프로젝트 PR 템플릿(.github/PULL_REQUEST_TEMPLATE.md)에 맞는 Pull Request를 생성합니다.

## 작업 절차

1. `git branch --show-current` 로 브랜치명을 확인하고 **이슈 번호를 추출**한다.
   - 패턴 `<type>/<issue#>-<slug>` (예: `feat/2-init-setup`) 에서 첫 `/` 와 다음 `-` 사이의 숫자가 이슈 번호.
   - 숫자가 없으면(`chore/<slug>` 형태) **묻지 말고 이슈 번호 없이** 작성한다.
2. `git log <base>...HEAD --oneline` 과 `git diff <base>...HEAD` 로 변경사항 전체를 파악한다.
3. **앱 E2E 사전 체크** — 네이티브 앱 E2E 는 CI 에 없으므로 PR 생성 전 로컬 통과를 확인한다.
   - 변경이 **md·웹 전용**(`*.md` · `docs/**` · `e2e/**` · `playwright.config.ts` 등)뿐이면 생략.
   - 네이티브 관련 변경(컴포넌트·라우팅·네이티브 모듈 등)이 있으면, `.maestro/README.md` 의 "PR 전 로컬 체크" 절차대로 **iOS·Android 둘 다 `pnpm test:e2e:app` 통과**를 사용자에게 확인한다(시뮬레이터/Metro 필요 — 자동 실행 불가 시 사용자에게 실행을 요청). **미통과·미확인이면 PR 을 만들지 않고 멈춘다.**
4. 아래 형식으로 제목/본문을 작성한다.
5. push가 필요하면 먼저 push한 뒤 `gh pr create` 로 생성한다.

## 제목 형식

```
<type>(<scope>): <한 줄 요약 (한글)>
```

- 예: `feat(app): 로그인 화면 추가`, `chore: 프로젝트 초기 셋업 보강`
- type 소문자, scope 선택.
- **이슈 번호는 제목에 박지 않는다** — 본문 `Resolves : #<번호>` 가 자동 link/close 처리.

## 본문 형식

**섹션 제목 + 내용만** 넣는다. 안내용 HTML 주석(`<!-- -->`)은 본문에 포함하지 않는다.

```
## 관련 이슈

- Resolves : #<이슈번호>     <!-- 이슈 번호가 없으면 `- 해당 없음` -->

## 작업 사항

- <이 PR에서 수행한 작업을 bullet 으로, 한글로>

## 참고 사항

- <리뷰어가 알아야 할 맥락/주의사항. 없으면 `-` 그대로 둔다>
```

- 모든 내용 **한글**로 작성.
- 추측하지 말고 코드와 커밋 이력에서 파악된 사실만 기재한다.
- 이슈 번호가 없으면 `관련 이슈` 섹션을 `- 해당 없음` 으로 두고 그대로 진행한다(묻지 않는다).

## 실행

```bash
gh pr create --title "<title>" --body "<filled template>"
```

- base 브랜치는 `main`.

상세 컨벤션 (Branch · Commit · PR · Issue 통합): `docs/conventions/git.md`
