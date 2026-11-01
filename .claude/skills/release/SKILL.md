---
name: release
description: 앱 변경의 배포 경로(OTA 우선)를 판단하고, 앱·웹·익스텐션 릴리즈를 끊고 버전을 올린다. Use when shipping an app change to users, publishing an OTA update, cutting a release, bumping a version, creating a release/hotfix branch, or when asked "배포해줘 / 반영해줘 / OTA 로 내보내줘 / 릴리즈해줘 / 버전 올려줘". 커밋 자체는 /commit, PR 생성은 /pr, EAS 빌드 실행은 expo:eas-app-stores 를 쓴다.
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

## 배포 경로 판단 (가장 먼저)

앱 변경을 사용자에게 내보낼 때는 **OTA 가 기본**이다. 릴리즈를 자르기 전에 판단한다(기준표·절차: `docs/release.md` "OTA 업데이트").

1. 내보낼 변경을 모두 나열하고 하나씩 OTA 가능 여부를 본다.
   - OTA 불가: 네이티브 패키지 추가·업그레이드, `app.json`·`plugins/`·패치 변경, 권한·Info.plist, iOS 공유 익스텐션 번들(`index.share.js` 가 import 하는 전부), 앱과 익스텐션이 함께 쓰는 저장 형식·API 계약 변경.
   - 그 밖의 `src/`·`shared/`·`packages/ui` JS·스타일·번들 에셋은 OTA 가능.
2. 전부 OTA 가능 → 버전을 올리지 않고 OTA 절차로 반영한다(핫픽스 브랜치 → 테스트 → `main` 머지 → `eas fingerprint:compare` → `pnpm ota:production` 롤아웃 → 실기기 확인). 스토어 릴리즈는 하지 않는다.
3. 하나라도 OTA 불가 → 아래 스토어 릴리즈로 낸다.
4. 판단 근거(파일별 OTA 가능 여부)를 사용자에게 보여 준다. 운영 게시(`pnpm ota:production`)는 대상 버전·플랫폼·메시지를 확인받고 실행한다.

OTA 는 1.3.1 이상 설치본만 받는다. 그보다 낮은 버전 사용자까지 고쳐야 하면 스토어 릴리즈도 같이 검토한다.

## 브랜치 모델 요약

아래는 운영용 요약이다 — `docs/conventions/git.md` · `docs/release.md` 와 어긋나면 그쪽이 맞다.

- `main` — 릴리즈 브랜치. 사용자에게 실제로 나가 있는 코드. Cloudflare 프로덕션.
- `dev` — 통합 브랜치이자 기본 브랜치. 모든 feature 의 base. Cloudflare preview(스테이징).
- `release/<version>` — `dev` 에서 분기. 심사 대응.
- `hotfix/<issue#>-<slug>` — `main` 에서 분기.

**`main` 에 머지한 뒤에는 반드시 `dev` 로 백머지한다.** 워크플로가 동기화 PR 을 자동으로 열어주므로 그것을 머지하면 된다. 이 PR 은 **"Create a merge commit" 으로** 머지한다 — squash 로 머지하면 `main` 의 커밋이 `dev` 에서 도달 불가라 감지기가 영영 해제되지 않는다.

## 버전 출처

| 트랙 | 출처 | 태그 |
| --- | --- | --- |
| 앱 + 웹 | `app.json` 의 `expo.version` | `v1.1.0` |
| 익스텐션 | `extension/package.json` 의 `version` | `ext-v1.0.1` |

- `buildNumber` · `versionCode` 는 EAS 가 자동 증가시킨다 — 손대지 않는다.
- 루트 `package.json` 의 `version` 은 **읽히지 않는 값**이다. 릴리즈와 무관하다.

## 스토어 릴리즈 절차

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
- 태그를 손으로 만들지 않는다. `main` push 워크플로가 만든다 (최초 소급 태그 `v1.0.0` 은 예외).
- 버전을 올리지 않은 채 `main` 에 머지하지 않는다. 태그가 안 생겨 릴리즈가 조용히 누락된다. 예외: `public/app-release.json` 만 바꾸는 PR(스토어 롤아웃 뒤 `latestVersion` 올리기, `review` 설정) — 릴리즈가 아니라 기준 갱신이라 태그 없이 머지한다(`docs/release.md` 앱 릴리즈 6단계). OTA 핫픽스도 버전을 올리지 않고 머지한다(올리면 기존 설치본과 호환이 끊긴다).
