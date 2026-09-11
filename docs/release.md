# 앱 스토어 배포 가이드 (EAS)

네이티브 앱(iOS · Android)은 **EAS Build** 로 클라우드에서 빌드하고 **EAS Submit** 으로 스토어에 올린다.
웹은 별도 트랙이다 — Cloudflare Workers Builds 가 빌드한다(`main` → 프로덕션, 그 외 브랜치 → preview). 크롬 익스텐션은 `extension/README.md` 를 본다.

> **웹 빌드 설정 (Cloudflare 대시보드).** 빌드 명령은 `pnpm build:web` 이다 — `EXPO_PUBLIC_*` 누락이나 마스터 토큰 포함을 먼저 검사해 빌드를 실패시킨다. `EXPO_PUBLIC_*` 는 번들에 인라인되므로 런타임 "Variables and Secrets" 가 아니라 **빌드 변수**로 넣고, preview 빌드에도 같은 값이 있어야 한다: `EXPO_PUBLIC_API_BASE_URL` · `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` · `EXPO_PUBLIC_KAKAO_REST_API_KEY` · `EXPO_PUBLIC_EXTENSION_ID`.

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
6. 자동 생성된 `chore: main 을 dev 로 동기화` PR 을 **"Create a merge commit" 으로** 머지한다. squash 로 머지하면 `main` 의 커밋이 `dev` 에서 도달 불가라 동기화 감지기가 이후 계속 오탐한다.

심사 통과 전에 `main` 에 머지하지 않는다. 리젝되면 웹에만 새 버전이 나가 있는 상태가 된다.

### 익스텐션 릴리즈

`release/ext-<version>` 에서 `extension/package.json` 의 `version` 을 올리고, zip 을 만들어 업로드한 뒤 심사 통과 후 `main` 에 머지한다.

### 핫픽스

`main` 에서 `hotfix/<issue#>-<slug>` 를 자르고 패치 버전을 올려 `main` 에 머지한다. 백머지 PR 을 반드시 머지한다.

앱까지 고치는 핫픽스라면 태그는 `main` 머지 즉시 생기지만 앱은 아직 심사 중이다 — 이 태그는 웹 릴리즈 기준이고 앱은 뒤따른다.

### 릴리즈 노트

GitHub Release 가 직전 같은 계열 태그 이후의 PR 목록으로 자동 생성한다. 별도 CHANGELOG 파일은 두지 않는다.

---

## 1. 설정 파일이 하는 일

| 파일 | 역할 |
| --- | --- |
| `eas.json` | 빌드 프로필. `base`(pnpm 버전·공통 env) 를 `preview`(내부 배포)·`production`(스토어, 빌드번호 자동 증가) 이 상속 |
| `app.json` | `extra.eas.projectId`, `owner`, `ios.config.usesNonExemptEncryption=false`(TestFlight 수출 규정 질문 생략) |
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
