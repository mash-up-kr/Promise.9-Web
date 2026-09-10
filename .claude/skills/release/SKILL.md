---
name: release
description: 앱·웹·익스텐션 릴리즈를 끊고 버전을 올린다. Use when cutting a release, bumping a version, creating a release/hotfix branch, or when asked "배포해줘 / 릴리즈해줘 / 버전 올려줘". 커밋 자체는 /commit, PR 생성은 /pr, EAS 빌드 실행은 expo:eas-app-stores 를 쓴다.
---

# release — 릴리즈 · 버전 올리기

## 경계 (먼저 읽는다)

이 스킬은 **릴리즈 모델과 절차**만 담당한다. 아래는 다른 곳이 단일 출처다.

| 알고 싶은 것 | 어디 |
| --- | --- |
| 브랜치·커밋·PR·이슈 규칙의 사실 정의 | `docs/conventions/git.md` |
| EAS 빌드·제출 실행 방법 | `docs/release.md` + `expo:eas-app-stores` 스킬 |
| 커밋을 관심사별로 나누기 | `/commit` |
| PR 본문 작성 | `/pr` |
| 일반 커밋 규율(atomic·크기·메시지) | `agent-skills:git-workflow-and-versioning` |

`agent-skills:git-workflow-and-versioning` 은 trunk-based 를 권하며 "dev 브랜치는 비용"이라고 적는다. **커밋 규율만 인용하고 브랜치 전략은 인용하지 않는다** — 이 프로젝트는 앱 스토어 심사 때문에 릴리즈 브랜치 모델을 쓴다(근거: `docs/superpowers/specs/2026-09-11-versioning-branching-design.md`).

## 브랜치 모델 요약

- `main` — 릴리즈 브랜치. 사용자에게 실제로 나가 있는 코드. Cloudflare 프로덕션.
- `dev` — 통합 브랜치이자 기본 브랜치. 모든 feature 의 base. Cloudflare preview(스테이징).
- `release/<version>` — `dev` 에서 분기. 심사 대응.
- `hotfix/<issue#>-<slug>` — `main` 에서 분기.

**`main` 에 머지한 뒤에는 반드시 `dev` 로 백머지한다.** 워크플로가 동기화 PR 을 자동으로 열어주므로 그것을 머지하면 된다.

## 버전 출처

| 트랙 | 출처 | 태그 |
| --- | --- | --- |
| 앱 + 웹 | `app.json` 의 `expo.version` | `v1.1.0` |
| 익스텐션 | `extension/package.json` 의 `version` | `ext-v1.0.1` |

- `buildNumber` · `versionCode` 는 EAS 가 자동 증가시킨다 — 손대지 않는다.
- 루트 `package.json` 의 `version` 은 **읽히지 않는 값**이다. 릴리즈와 무관하다.

## 릴리즈 절차

전체 형태는 `docs/release.md` 의 "0.5 릴리즈 절차" 를 따른다. 핵심만 옮기면:

1. `dev` 에서 `release/<version>` 을 자른다.
2. 그 브랜치에서 버전 파일을 올린다.
3. EAS 빌드·제출(앱) 또는 zip 업로드(익스텐션).
4. 심사 중 버그는 **`dev` 우선 수정 → 릴리즈 브랜치로 cherry-pick.**
5. **심사 통과 후** `main` 머지 → 태그·Release·웹 배포가 자동으로 일어난다.
6. 동기화 PR 머지.

릴리즈 노트는 GitHub 이 직전 태그 이후의 PR 로 자동 생성한다. PR 제목이 곧 릴리즈 노트가 되므로 제목을 사용자가 읽을 문장으로 쓴다.

## 하지 말 것

- 심사 통과 전에 `main` 에 머지하지 않는다. 리젝되면 웹에만 새 버전이 나간다.
- 릴리즈 브랜치에서만 버그를 고치지 않는다. 다음 릴리즈에 재발한다.
- 태그를 손으로 만들지 않는다. `main` push 워크플로가 만든다.
- 버전을 올리지 않은 채 `main` 에 머지하지 않는다. 태그가 안 생겨 릴리즈가 조용히 누락된다.
