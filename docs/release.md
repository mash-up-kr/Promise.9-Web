# 앱 스토어 배포 가이드 (EAS)

네이티브 앱(iOS · Android)은 **EAS Build** 로 클라우드에서 빌드하고 **EAS Submit** 으로 스토어에 올린다.
웹은 별도 트랙이다 — Cloudflare Workers Builds 가 빌드한다(`main` → 프로덕션, 그 외 브랜치 → preview). 크롬 익스텐션은 `extension/README.md` 를 본다.

> **웹 빌드 설정 (Cloudflare 대시보드).** 빌드 명령은 `pnpm build:web` 이다 — `EXPO_PUBLIC_*` 누락이나 마스터 토큰 포함을 먼저 검사해 빌드를 실패시킨다. `EXPO_PUBLIC_*` 는 번들에 인라인되므로 런타임 "Variables and Secrets" 가 아니라 **빌드 변수**로 넣고, preview 빌드에도 같은 값이 있어야 한다: `EXPO_PUBLIC_API_BASE_URL` · `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` · `EXPO_PUBLIC_KAKAO_REST_API_KEY` · `EXPO_PUBLIC_APPLE_SERVICES_ID` · `EXPO_PUBLIC_EXTENSION_ID`.

> 로컬 시뮬레이터 실행 세팅은 `docs/ios-local-setup.md`. 이 문서는 **스토어에 올라가는 빌드**만 다룬다.

---

## 0. 사전 준비 (한 번만)

```bash
npm install -g eas-cli   # 또는 pnpm add -g eas-cli
eas login                 # Expo 계정
eas whoami                # 로그인 확인
```

- EAS 프로젝트: `@bokeeeey/promise9-web` (`app.json` 의 `extra.eas.projectId` · `owner`). 이 프로젝트에 접근 권한이 있는 Expo 계정이어야 한다.
- 스토어 자격증명(Android 키스토어, iOS 배포 인증서·프로비저닝 프로파일·푸시 키)은 **EAS 가 원격 보관**한다. 로컬에 `.jks`/`.p12` 를 두지 않는다.

---

## 0.5 릴리즈 절차 (브랜치·버전)

브랜치 모델의 단일 출처는 `docs/conventions/git.md`. 여기서는 릴리즈 실행만 다룬다.

### 버전은 어디서 오나

| 트랙 | 출처 | 태그 |
| --- | --- | --- |
| 앱 + 웹 | `app.json` 의 `expo.version` | `v1.1.0` |
| 익스텐션 | `extension/package.json` 의 `version` | `ext-v1.0.1` |

`buildNumber` · `versionCode` 는 EAS 가 자동 증가시킨다. 사람이 정하는 건 마케팅 버전뿐이다.
루트 `package.json` 의 `version` 은 **어디서도 읽지 않는 값**이다. 릴리즈와 무관하니 고치지 않아도 된다.

### 앱 릴리즈

1. `dev` 에서 `release/<version>` 을 자른다.
2. 그 브랜치에서 `app.json` 의 `version` 을 올린다.
3. EAS 빌드·제출한다(2장).
4. 심사 중 버그는 **`dev` 에 먼저 고치고 릴리즈 브랜치로 cherry-pick** 한다.
5. **심사 통과 후** `main` 에 머지한다 → 웹 배포 + 태그·GitHub Release 자동 생성.
6. **스토어에 실제로 풀린 것을 확인한 뒤** `public/app-release.json` 의 `latestVersion` 을 올려 `main` 에 머지한다(아래 "업데이트 안내 기준"). 이걸 빠뜨리면 구버전 사용자에게 업데이트 안내가 영영 안 뜬다.
7. 자동 생성된 `chore: main 을 dev 로 동기화` PR 을 **"Create a merge commit" 으로** 머지한다. squash 로 머지하면 `main` 의 커밋이 `dev` 에서 도달 불가라 동기화 감지기가 이후 계속 오탐한다.

심사 통과 전에 `main` 에 머지하지 않는다. 리젝되면 웹에만 새 버전이 나가 있는 상태가 된다.

### 업데이트 안내 기준 올리기 (`public/app-release.json`)

앱은 실행마다 `https://link-ding-dong.com/app-release.json` 을 읽어 업데이트 안내를 띄운다
(`src/features/app-notice/`). 웹 배포에 실려 나가는 파일이라 앱을 다시 올리지 않고도 기준을 바꿀 수 있다
— 기준을 앱 번들에 박으면 구버전이 새 기준을 영영 모르기 때문이다. 서버 API 에는 해당 엔드포인트가 없다.

플랫폼별로 나뉘어 있다(심사 통과 시점과 Play 롤아웃 시점이 다르다). 앱은 자기 플랫폼 블록만 읽는다:

```json
{ "ios": { "latestVersion": "1.1.0", "minSupportedVersion": "1.0.0" }, "android": { ... } }
```

**무엇이 뜨는지** (설치 버전 = `app.json` 의 `version`):

| 조건 | 사용자가 보는 것 |
|------|------------------|
| 설치 < `minSupportedVersion` | 차단 안내 — 버튼은 "업데이트" 하나, 배경·뒤로 가기로 닫히지 않는다 |
| `minSupportedVersion` ≤ 설치 < `latestVersion` | 권장 안내 — "나중에" 로 건너뛸 수 있다 |
| 설치 ≥ `latestVersion` | 아무것도 안 뜬다 |
| 기준을 못 읽음(오프라인·404·깨진 JSON) | 아무것도 안 뜬다 (안내 때문에 앱을 막지 않는다) |

- `latestVersion` — **스토어에 실제로 풀린 뒤** 올린다. 심사 통과 전에 올리면 받을 수 없는 버전으로
  업데이트를 유도한다(`appRelease.manifest.test.ts` 가 `app.json` 버전을 넘지 못하게 막는다).
- `minSupportedVersion` — 구버전을 더는 받을 수 없을 때만 올린다. 올리면 그보다 낮은 버전은
  **닫을 수 없는** 안내로 막힌다.
- 프로덕션 웹은 `main` 에서 빌드된다 — `main` 에서 `chore/app-release-<version>` 브랜치를 내 이 파일만 바꾸고
  `main` 으로 PR·머지한다(앱 버전이 그대로라 태그 워크플로는 건너뛴다). 열린 동기화 PR 이 있으면 **먼저**
  머지한다 — 워크플로는 열린 동기화 PR 이 있으면 새 커밋을 올리지 않는다. 머지 뒤 열리는 동기화 PR 을 머지한다.
  로컬 `pnpm deploy` 는 프로덕션 워커를 직접 덮어쓰므로 쓰지 않는다.

**후기(인앱 리뷰) 요청 설정** — 같은 파일의 `review` 블록. 앱 안에서 링크 저장에 성공한 뒤 조건이 맞으면
OS 리뷰 창을 띄운다(자체 모달 없음 — Apple 심사 가이드 5.6.1 이 자체 프롬프트를 거절한다).

```json
{ "review": { "enabled": true, "minSaveCount": 5, "cooldownDays": 90 } }
```

- 사용자가 받는 조건: 네이티브 앱에서 저장 성공 → 이 기기 누적 저장 `minSaveCount` 회 이상 → 지금 앱 버전에서 아직 안 띄움
  → 마지막 요청으로부터 `cooldownDays` 일 경과 → 4초 뒤 OS 에 요청. 띄울지는 OS 가 최종 결정한다(iOS 365일 3회·같은 버전 재노출 없음, Android 할당량).
- `enabled: false` 로 배포 없이 멈춘다. 블록이 없으면 앱 기본값(위와 같은 값)으로 동작하고, 블록이 있는데 깨져
  있으면(타입 오타 등) 후기 요청을 **멈춘다** — 끄려던 스위치가 열리지 않게. 업데이트 안내는 어느 쪽도 영향받지 않는다.
  레포의 파일은 `appRelease.manifest.test.ts` 가 오타를 잡는다.
- 바꾸는 절차는 `latestVersion` 과 같다(`main` 으로 PR). 앱은 실행 때 읽은 값을 쓰므로 다음 실행부터 적용된다.

**시뮬·에뮬에서 안내를 재현하려면** 기준 파일을 로컬에서 서빙하고 주소를 갈아끼운다
(`.env.local` 의 `EXPO_PUBLIC_APP_RELEASE_URL` — 개발 빌드에서만 먹는다):

```bash
python3 -m http.server 8788 -d public
# .env.local — iOS 시뮬: localhost / Android 에뮬: 10.0.2.2
EXPO_PUBLIC_APP_RELEASE_URL=http://localhost:8788/app-release.json
```

그 파일의 `latestVersion` 을 `app.json` 버전보다 높이면 권장 안내, `minSupportedVersion` 을 높이면
필수(차단) 안내가 뜬다.

**안내가 안 뜰 때 확인할 것**

- 기준 조회는 **실행당 1회**다(쓰는 도중에 모달이 끼어들지 않게). 기준을 바꿨으면 앱을 완전히 다시 켠다 — Fast Refresh 로는 안 바뀐다.
- "나중에" 는 그때의 `latestVersion` 을 기기에 적어두고 **그 버전 동안** 다시 띄우지 않는다. 다음 릴리즈로 `latestVersion` 이 올라가면 다시 뜬다. 검증 중이라면 앱을 지우고 다시 설치한다(`xcrun simctl uninstall booted com.mashup.promise9` · `adb uninstall com.mashup.promise9`).
- 차단 안내에는 스누즈가 없다 — "나중에" 로 건너뛴 기록이 있어도 뜬다.
- 웹·공유 익스텐션에서는 아무것도 뜨지 않는다(스토어가 없다).
- 기준 파일을 바꾸고 배포를 안 했는지 본다. 앱이 읽는 건 배포된 `https://link-ding-dong.com/app-release.json` 이지 레포의 파일이 아니다.

**실수를 막는 장치** (CI 에서 돈다)

- `src/features/app-notice/appRelease.manifest.test.ts` — `latestVersion` 이 `app.json` 버전을 넘으면 실패(아직 받을 수 없는 버전으로 유도 금지), `minSupportedVersion` > `latestVersion` 도 실패. 심사 중이라 `app.json` 만 앞서 있는 상태는 정상이다.
- `app.config.test.js` — `app.json` 에 스토어 주소(`ios.appStoreUrl` · `android.playStoreUrl`)가 있는지. 빠지면 업데이트 버튼과 인앱 리뷰가 둘 다 조용히 아무 일도 안 한다.

**지금 방식 한 줄 요약**

> 서버 API·Remote Config 없이, 웹 배포에 실어 보내는 **원격 정적 JSON 기반 클라이언트 버전 게이트**.
> (대안이던 Firebase Remote Config 는 분석 SDK 를 하나도 안 쓰는 현 구성에 SDK 를 들이게 돼 뺐고,
> 스토어 조회 API 방식은 Play 에 공식 API 가 없어 뺐다.)

**나중에 서버로 옮길 때 — 서버에 이렇게 요청한다**

기준을 바꾸려면 웹 배포가 필요하고, 차단이 클라이언트 판단이라 오프라인이면 지나간다(fail-open).
서버가 구버전을 **정말로** 못 받는 시점(응답 계약 변경·보안 패치)이 오면 아래 둘을 요청한다:

1. `GET /app/version?platform=ios|android` — `latestVersion` · `minSupportedVersion` 을 내려준다.
   값의 의미는 지금 JSON 과 같게 가져간다.
2. **모든 요청의 `X-App-Version` 헤더를 보고 지원하지 않는 버전은 서버가 거부**(전용 `errorCode`).
   1번만으로는 안내만 하고 실제 차단은 못 한다 — 차단은 서버가, 이유 설명은 모달이 맡는 구조가 맞다.

클라이언트에서 바꿀 곳은 조회 한 군데(`src/features/app-notice/api/appNotice.queries.ts`)와 그 errorCode
판별(`shared/entities/`)뿐이다. 판정 로직·모달·스누즈는 그대로 쓴다.

### 익스텐션 릴리즈

`release/ext-<version>` 에서 `extension/package.json` 의 `version` 을 올리고, zip 을 만들어 업로드한 뒤 심사 통과 후 `main` 에 머지한다.

### 핫픽스

`main` 에서 `hotfix/<issue#>-<slug>` 를 자르고 패치 버전을 올려 `main` 에 머지한다. 백머지 PR 을 반드시 머지한다.

앱까지 고치는 핫픽스라면 태그는 `main` 머지 즉시 생기지만 앱은 아직 심사 중이다 — 이 태그는 웹 릴리즈 기준이고 앱은 뒤따른다.

JS 만 고치는 앱 핫픽스는 아래 OTA 로 보낸다 — 이때는 **버전을 올리지 않는다**.

### OTA 업데이트 (EAS Update)

스토어 심사 없이 이미 설치된 앱에 JS 번들을 내려보낸다. 호환 기준(`runtimeVersion`)은 **앱 버전**(`appVersion` 정책)이라
1.3.1 설치본은 1.3.1 로 게시한 업데이트만 받는다. `expo-updates` 가 들어간 빌드(1.3.1)부터 받을 수 있다.

**버전 규칙** — 앱 버전 정책은 "같은 버전이면 네이티브도 같다" 가 지켜질 때만 안전하다.

- 네이티브를 바꾸는 변경(아래 표 오른쪽)은 반드시 버전을 올려 스토어로 낸다.
- 한 버전의 스토어 빌드(iOS·Android)는 같은 `release/*` 커밋에서 만든다. 네이티브가 다른 커밋으로 같은 버전을 다시 빌드하지 않는다.
- 지켜졌는지는 게시 직전 `eas fingerprint:compare` 로 확인한다(절차 4).

**OTA 로 보낼 수 있는 것 / 없는 것**

| OTA 가능 | 스토어 빌드 필요 |
| --- | --- |
| `src/`·`shared/`·`packages/ui` 의 JS·스타일, 번들 이미지·폰트 | 네이티브 패키지 추가·업그레이드, `app.json`·`plugins/`·패치 변경, 권한·Info.plist |
| Android 공유 시트(앱과 같은 번들) | **iOS 공유 익스텐션**(별도 번들이라 OTA 가 닿지 않는다) |

iOS 공유 익스텐션 번들은 `index.share.js` 가 import 하는 전부다 — `src/features/share/` 뿐 아니라 `shared/api`(API 클라이언트·토큰 갱신)·`src/lib/tokenStorage`·`packages/ui`·`src/global.css` 도 들어간다.
OTA 뒤에는 앱은 새 JS, iOS 익스텐션은 옛 JS 로 같은 키체인·App Group 을 쓴다. 그래서 **앱과 익스텐션이 함께 쓰는 저장 형식(토큰 키·형식)이나 API 계약을 바꾸는 변경은 OTA 로 보내지 않는다** — 익스텐션의 로그인·저장이 깨진다.

**절차** — 브랜치 규칙은 `docs/conventions/git.md` 의 핫픽스와 같고, 버전만 올리지 않는다.

1. 고칠 설치본의 버전 태그(`v<버전>`, 보통 `main` 과 같다)에서 `hotfix/<issue#>-<slug>` 를 자른다. **`app.json` 의 `version` 은 그대로 둔다**(올리면 기존 설치본과 호환이 끊긴다).
   - `node -p "require('./app.json').expo.version"` 이 대상 설치본 버전과 같은지 확인한다. 심사 중인 스토어 핫픽스가 먼저 머지돼 `main` 버전이 앞서 있으면 `main` 이 아니라 사용자 버전 태그에서 자른다.
   - iOS·Android 출시 버전이 다르면 게시할 때 `--platform ios|android` 로 한정한다.
2. PR 을 `main` 에 merge commit 으로 머지한다(웹도 함께 배포된다). 버전이 그대로라 새 태그는 생기지 않는다. 열린 `release/*` 가 있으면 같은 수정을 거기에도 cherry-pick 한다(빠뜨리면 다음 스토어 버전에서 다시 깨진다).
3. 게시할 커밋을 깨끗한 작업 트리로 체크아웃하고 검사한다. 앱 테스트·lint·타입은 CI 에서 돌지 않는다.
   ```bash
   pnpm install --frozen-lockfile
   pnpm test && pnpm check && pnpm exec tsc --noEmit
   ```
4. 사용자가 가진 스토어 빌드와 네이티브가 같은지 플랫폼마다 확인한다. 다르면 **게시하지 않고** 버전을 올려 스토어로 낸다.
   ```bash
   eas build:list -p ios --limit 5              # 스토어에 나간 빌드 ID 확인(android 도 같은 방법)
   eas fingerprint:compare --build-id <빌드 ID>
   ```
   같은 커밋이면 로컬과 EAS 의 지문이 정확히 일치한다(1.3.0 iOS 빌드로 확인함).
5. 게시는 **반드시 스크립트로** 한다. `eas update` 를 직접 부르다 `--environment` 를 빠뜨리면 로컬 `.env.local`(로컬 API 주소 등)이 운영 번들에 들어간다.
   ```bash
   pnpm ota:production --message "<요약> (#PR번호)" --rollout-percentage 10
   ```
   스크립트는 의존성을 lockfile 대로 다시 깔고 `--channel production --environment production --clear-cache` 로 게시한다(EAS 환경변수만 쓰고 `.env.local` 은 읽지 않는다).
6. 실기기에서 앱을 **완전히 종료했다가 다시 여는 것을 최대 두 번** 반복해 반영을 확인한다(첫 실행에 받고, 다음 실행에 적용). 롤아웃 중이면 내 기기가 대상에서 빠질 수 있으니 `eas update:insights` 로 적용 수·크래시를 함께 본다.
7. 이상이 없으면 롤아웃을 끝까지 올린다: `eas update:edit <업데이트 그룹 ID> --rollout-percentage 100`. 거두려면 `eas update:revert-update-rollout --channel production`.
8. 자동 생성된 동기화 PR 을 merge commit 으로 머지한다. 이미 열린 동기화 PR 이 있으면 새 커밋이 반영되지 않으니 그것부터 머지한다.

**롤백** — `eas update:rollback` 으로 직전 업데이트나 스토어 빌드에 들어 있던 번들로 되돌린다. 되돌아가는 건 OTA 뿐이라
`main`(웹 포함)·`dev` 에는 문제 코드가 남는다 → revert 핫픽스 PR 을 `main` 에 머지하고 동기화 PR 까지 머지한다.

**알아둘 것**

- 사전 검증용 채널이 없다. TestFlight·Play 테스트 빌드도 스토어 빌드와 같은 `production` 채널이라 테스터와 사용자가 동시에 받는다. 단계적 배포는 롤아웃 비율뿐이다. `preview` 채널은 내부 배포(`preview` 프로필) 빌드용이다.
- EAS 프로젝트가 개인 계정(`bokeeeey`) 소유라 그 계정만 게시·롤백할 수 있다. 여러 사람이 대응하려면 Expo 조직으로 옮겨야 한다.
- 업데이트에 코드 서명이 없다(무료 플랜 미지원). 게시 권한이 곧 모든 설치본의 JS 를 바꾸는 권한이니 Expo 계정 2단계 인증을 켜고, 오래 가는 `EXPO_TOKEN` 을 CI 등에 두지 않는다.
- 무료 플랜은 OTA 를 받는 월간 사용자 1,000명·대역폭 100GiB 까지다(계정 단위, 초과 과금 없이 한도로 제한).
- 스토어 빌드 점검 때 내장 업데이트 정보가 들어갔는지 본다 — Android AAB 의 `base/assets/app.manifest`, iOS 앱의 `EXUpdates.bundle/app.manifest`. 로컬 Android 빌드에서 한 번 빠진 적이 있는데(멈춘 Gradle 데몬 정리 직후, 원인 미확인), 그 빌드는 실행은 됐지만 `expo-updates` 가 동작하지 않았다.

### 릴리즈 노트

GitHub Release 가 직전 같은 계열 태그 이후의 PR 목록으로 자동 생성한다. 별도 CHANGELOG 파일은 두지 않는다.

---

## 1. 설정 파일이 하는 일

| 파일 | 역할 |
| --- | --- |
| `eas.json` | 빌드 프로필. `base`(pnpm 버전·공통 env) 를 `preview`(내부 배포)·`production`(스토어, 빌드번호 자동 증가) 이 상속. 각 프로필의 `channel` 이 빌드에 박혀 OTA 를 받을 채널이 된다 |
| `app.json` | `extra.eas.projectId`, `owner`, `ios.config.usesNonExemptEncryption=false`(TestFlight 수출 규정 질문 생략), `runtimeVersion`·`updates.url`(OTA) |
| `package.json` `eas-build-pre-install` | 빌드 전에 `assert-no-master-token` 실행 — EAS 환경에 마스터 토큰이 있으면 빌드 중단 |

### 버전

`appVersionSource: remote` 라서 iOS `buildNumber` · Android `versionCode` 는 **EAS 서버가 관리**하고 빌드마다 자동 증가한다.
사람이 올리는 건 `app.json` 의 `version`(마케팅 버전) 뿐이다.

```bash
eas build:version:get -p all   # 현재 원격 빌드 번호 확인
```

### 환경변수

`EXPO_PUBLIC_*` 는 빌드 타임에 번들로 인라인되므로 **EAS 환경변수**에 있어야 한다(`.env.local` 은 gitignore 라 업로드되지 않는다).

| 환경 | 변수 |
| --- | --- |
| `production` · `preview` | `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` |

```bash
eas env:list production                       # 확인
eas env:set production --name KEY --value V   # 추가·수정 (preview 도 같이)
```

- 카카오 REST 키 · 익스텐션 ID 는 웹 전용 코드에서만 읽으므로 네이티브 빌드엔 넣지 않는다.
- **`EXPO_PUBLIC_API_MASTER_TOKEN` 은 절대 올리지 않는다.** 올리면 pre-install 훅이 빌드를 중단시킨다.
- 프로필별 환경은 자동 매핑된다: `distribution: store` → `production`, 그 외 → `preview`.

---

## 2. 빌드

```bash
eas build -p android --profile production
eas build -p ios --profile production
```

- **자격증명을 새로 만들어야 하는 첫 실행은 대화형 터미널**(Terminal.app · iTerm 등)에서 한다. iOS 는 Apple 로그인(2FA) 이 필요하고, Claude Code 의 `!` 실행처럼 TTY 가 없는 환경에선 실패한다. 자격증명이 EAS 에 저장된 뒤엔 `--non-interactive` 로 어디서든 올릴 수 있다.
- iOS 는 타겟이 2개(`com.mashup.promise9`, `com.mashup.promise9.ShareExtension`)라 프로파일도 2개 생성된다. App Groups · Sign in with Apple · Push 캐퍼빌리티는 Apple 포털에 자동 동기화된다.
- 업로드 범위는 **git 이 무시하지 않는 파일 전부**(untracked 포함) 다. eas-cli 는 `.gitignore`(또는 `.easignore`)만 읽고 `.git/info/exclude` 는 보지 않으므로, 로컬 전용 폴더는 `.gitignore` 에 넣는다.
- 무료 플랜은 월 iOS 15회 · Android 15회, 저우선 큐라 20~30분 걸린다.

```bash
eas build:list                 # 최근 빌드
eas build:view <build-id>      # 상태 · 산출물 URL (`--json` 에 logFiles 도 있음)
```

---

## 3. 제출

### Android

- **첫 업로드는 Play Console 에서 수동**이다. 앱 만들기 → 테스트 → 내부 테스트 → AAB 업로드(Play 앱 서명은 기본값 유지).
- 업로드 후 **설정 → 앱 서명** 의 앱 서명 키 SHA-1 을 Google Cloud(Android OAuth 클라이언트)와 카카오 콘솔(키 해시)에 등록해야 스토어 배포본에서 구글·카카오 로그인이 된다.
- 이후 제출은 `eas submit -p android`(Google 서비스 계정 키 필요).

### iOS

```bash
eas submit -p ios --latest   # 가장 최근 production 빌드를 TestFlight 로 업로드
```

- 첫 제출 때 App Store Connect 앱 레코드(`링띵동`, 기본 언어 ko)와 TestFlight 내부 그룹 `Team (Expo)` 이 자동 생성됐고, 제출용 App Store Connect API 키(App Manager 권한)는 EAS 서버에 저장됐다. 그래서 이후 제출은 Apple 로그인 없이 `--non-interactive` 로 가능하다.
- `submit.production.ios.ascAppId`(6808223727) 가 있어 "앱 존재 확인" 단계를 건너뛴다.
- 업로드 후 Apple 처리에 5~15분 걸린다. 처리가 끝나면 TestFlight 탭에서 내부 테스터에게 배포되고, 수출 규정 질문은 `usesNonExemptEncryption=false` 덕에 뜨지 않는다.
- 내부 테스터 추가: App Store Connect → 사용자 및 액세스에서 팀원을 초대한 뒤 TestFlight → 내부 테스트 → `Team (Expo)` 그룹에 넣는다.

### 스토어 메타데이터 (EAS Metadata)

- 설정은 `store.config.js`(동적) + `store.config.base.json`(이름·설명·키워드·심사 노트·연락처 이름/이메일). 공개 레포라 **심사 연락처 전화번호만 `.env.local` 의 `EAS_METADATA_REVIEW_PHONE`** 에서 읽는다 — 없으면 `metadata:push`·`metadata:lint` 가 바로 실패한다.
- `eas metadata:lint` 로 검증하고 `eas metadata:push` 로 올린다. `eas metadata:pull` 은 동적 설정을 갱신하지 못해 `store.config.json`(gitignore) 을 새로 만들고 스크린샷 사본을 `store/` 에 받는다 — 필요한 값만 `store.config.base.json` 으로 옮긴다.

---

## 알려진 함정 (실제로 겪은 것)

| 증상 | 원인 / 해결 |
| --- | --- |
| `Failed to install pnpm` (`EEXIST … bin/pnpm`) | `corepack: true` 를 켜면 `.nvmrc` 기반 커스텀 Node 설치 뒤 EAS 가 pnpm 을 재설치하다 corepack 심과 충돌한다. **`pnpm` 필드로 버전을 직접 지정**한다(현재 방식). |
| iOS 만 `Pre-install hook` 단계 `Unknown error`, 로그에 `sharp: Attempting to build from source` | macOS 워커에 전역 libvips 가 있어 `sharp`(wrangler 의존성)가 소스 빌드로 빠진다. `base.env` 의 `SHARP_IGNORE_GLOBAL_LIBVIPS=1` 이 막는다. |
| `Cannot find module '@expo/plist'` | `plugins/` 의 커스텀 config plugin 이 쓰는 패키지는 `devDependencies` 에 선언해야 한다. `pnpm exec` 은 NODE_PATH 로 가려주지만 eas-cli · EAS 워커는 못 찾는다. |
| 훅 단계에 `pnpm install` 로그가 통째로 보임 | pnpm 11 은 `pnpm run` 전에 의존성을 자동 설치한다(`verifyDepsBeforeRun` 기본값). 정상이며 EAS 의 설치 단계는 그만큼 짧아진다. |
| iOS 만 Xcode 번들 단계 `Chunk containing module not found: …react-native-css/dist/commonjs/components/index.cjs` (실패 엔트리는 `index.share.js`) | react-native-worklets 의 `require.resolveWeak("react-native")` 를 react-native-css 리졸버가 자기 컴포넌트 CJS 진입점으로 바꾸는데, 약한 참조는 그래프에 안 실려 익스텐션 번들에서만 깨진다. `metro.config.js` 가 약한 `react-native` 참조를 원본으로 되돌린다(테스트 `metro.config.test.js`). 로컬 재현: `expo export:embed --platform ios --dev false --entry-file index.share.js`. |
| `Detected that your app uses Expo Go` 경고 | `expo-dev-client` 가 없어서 나오는 안내. 빌드에 영향 없다. |
