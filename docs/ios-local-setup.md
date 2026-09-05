# iOS 로컬 실행 세팅 가이드

카카오·애플·구글 **네이티브 로그인**은 네이티브 모듈이라 **Expo Go 로는 실행할 수 없고**, dev client 를 직접 빌드해야 한다. 이 문서는 새로 합류한 사람이 iOS 시뮬레이터에서 앱을 빌드·실행하기까지의 단계다. (Android 는 서명이 필요 없어 `pnpm android` 만으로 된다.)

> 대상: macOS + Xcode. 번들 ID `com.mashup.promise9`.

---

## 0. 사전 준비 (한 번만)

- **Xcode** 설치 (App Store) + 최초 실행 후 라이선스 동의.
- **CocoaPods**: prebuild(1번)가 자동 설치하지만, 없다면 `brew install cocoapods`.
- 저장소 클론 후 의존성 설치:
  ```bash
  pnpm install
  ```
- **`.env.local`** 준비 — 팀에서 공유받아 저장소 루트에 둔다. 최소 필요 키:
  ```
  EXPO_PUBLIC_API_BASE_URL=...
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...
  EXPO_PUBLIC_KAKAO_REST_API_KEY=...   # 웹 카카오용(네이티브만 볼 거면 없어도 됨)
  ```
  > `EXPO_PUBLIC_*` 는 빌드 타임에 번들로 인라인된다 — 값 바꾸면 **앱 재빌드/재시작** 필요.

---

## 1. 네이티브 프로젝트 생성 (prebuild)

`ios/`·`android/` 는 git 에 커밋되지 않는 **생성물**이다. 아래로 만든다:

```bash
pnpm exec expo prebuild --clean
```

이 과정에서 config plugin 이 자동 반영하는 것:
- 애플: `com.apple.developer.applesignin` entitlement + `ios.usesAppleSignIn`
- 카카오: URL scheme(`kakao{앱키}`), 조회 scheme
- 구글: `iosUrlScheme`

> ⚠️ prebuild 를 다시 돌리면 `ios/` 가 새로 생성되므로 **3번 서명 설정을 다시** 해야 한다.

---

## 2. 카카오 네이티브 앱 키 (카카오 네이티브 테스트 시)

`app.json` 의 카카오 플러그인 `kakaoAppKey` 가 실제 **네이티브 앱 키**여야 카카오 네이티브 로그인이 뜬다. placeholder(`KAKAO_NATIVE_APP_KEY_PLACEHOLDER`) 상태면 실패한다.

- 값: [Kakao Developers](https://developers.kakao.com) 콘솔 › 내 애플리케이션 › **앱 키 › 네이티브 앱 키**.
- 이 값을 넣었다면 **1번 prebuild 를 다시** 돌려 네이티브에 반영한다.

> 네이티브 앱 키는 앱 번들에 임베드되는 공개성 값이라 `app.json` 에 둔다(구글 `iosUrlScheme` 과 동일).

---

## 3. Xcode 코드 서명 (iOS 필수) 🔑

iOS 는 시뮬레이터 빌드도 서명이 필요하다. **유료·무료 Apple 계정 모두 시뮬레이터까지는 가능**하다(실기기·배포는 유료 필요).

### 3-1. Apple 계정 등록
1. **Xcode ▸ Settings…**(⌘,) ▸ **Accounts** 탭
2. 좌하단 **`+` ▸ Apple ID** 로 로그인
3. 로그인 후 **Team** 에 팀이 보이는지 확인

### 3-2. 워크스페이스 열고 팀 지정
```bash
open ios/Promise9Web.xcworkspace     # 반드시 .xcworkspace (.xcodeproj 아님)
```
4. 좌측 네비게이터 최상단 **Promise9Web** ▸ **TARGETS ▸ Promise9Web**
5. **Signing & Capabilities** 탭
6. **Automatically manage signing** 체크
7. **Team** 드롭다운에서 본인 팀 선택 → **Signing Certificate: Apple Development** 가 뜨면 성공
8. 하단에 **Sign In with Apple** capability 가 보이는지 확인(자동 반영됨)

### 3-3. 자주 나오는 경고 — 무시해도 되는 것
시뮬레이터만 쓸 거면 아래 경고는 **무시해도 된다** — 물리 기기 프로파일 관련이라 시뮬 빌드와 무관하다:
- `Communication with Apple failed / Your team has no devices …`
- `No profiles for 'com.mashup.promise9' were found`

핵심은 **Signing Certificate 에 "Apple Development" 가 생성**됐는지다. 확인:
```bash
security find-identity -v -p codesigning | grep "Apple Development"
```
한 줄이라도 나오면 서명 준비 완료.

---

## 4. 시뮬레이터에 Apple ID 로그인 (애플 로그인 테스트 시)

애플 로그인은 시뮬레이터 자체가 Apple 계정에 로그인돼 있어야 계정 선택 창이 뜬다.
- 시뮬레이터 **설정 앱 ▸ 맨 위 "Sign in to your iPhone"** → Apple ID 로그인.

---

## 5. 빌드 & 실행

```bash
pnpm ios         # = expo run:ios (booted 시뮬에 빌드·설치·실행)
```
- 특정 시뮬 지정: `pnpm exec expo run:ios --device "iPhone 17"`
- 첫 빌드는 몇 분 걸린다. `Build Succeeded` 후 앱이 시뮬에 자동 설치·실행된다.
- JS 는 Metro 가 서빙한다. 꺼져 있으면 별도 터미널에서:
  ```bash
  pnpm exec expo start --dev-client --port 8081
  ```

---

## 6. 테스트 체크리스트

| provider | iOS 시뮬 | 비고 |
| --- | --- | --- |
| 구글 | ✅ | Google Cloud 콘솔에 iOS 클라이언트 등록돼 있어야 함 |
| 카카오 | ✅ | 카카오톡 미설치 시 카카오계정(웹뷰)으로 진행 — 정상 |
| 애플 | ✅ | 4번 시뮬 Apple ID 로그인 필요. iOS 만 버튼 활성(웹·안드는 비활성) |

- 로그인 실패 시 **Metro 콘솔에 `소셜 로그인 실패 <원인>`** 이 찍힌다 — 원인 진단용.
- 실패 원인이 미설정(env·앱키)인지, 콘솔 등록(redirect·SHA·클라이언트ID)인지부터 확인한다.

---

## 트러블슈팅

| 증상 | 원인 / 해결 |
| --- | --- |
| `No code signing certificates are available` | 3번 미완료. Xcode 에서 Team 선택 → Apple Development 인증서 생성 |
| 애플 버튼이 비활성 | 정상 — 애플은 iOS 네이티브만 지원(`apple.enabled = isIOS`) |
| 카카오 로그인 즉시 실패 | `kakaoAppKey` placeholder(2번) 또는 카카오 콘솔 설정 미완 |
| 구글 로그인 실패 | Google Cloud 콘솔의 iOS 클라이언트/URL scheme 불일치 |
| `.env` 바꿨는데 반영 안 됨 | `EXPO_PUBLIC_*` 은 빌드 타임 인라인 — 앱 재빌드/재시작 |
| prebuild 후 서명 사라짐 | `ios/` 가 재생성됨 — 3번 서명 설정 다시 |
