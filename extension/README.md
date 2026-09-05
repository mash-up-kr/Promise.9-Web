# 링딩동 크롬 익스텐션

보고 있는 페이지를 링딩동에 저장하는 MV3 익스텐션. **사이드패널 형태**이며 시안은
Figma `크롬 웹 스토어 익스텐션 (Chrome Extension)` 섹션이다.

팝업이 아니라 사이드패널을 고른 결과, 시안(400x600 고정 팝업)과 두 가지가 다르다.

- **탭을 따라간다**: 패널이 열린 채 탭을 옮기거나 페이지를 이동하면 저장 대상도 바뀐다.
  그래서 권한이 `activeTab` 이 아니라 상시 `tabs` 다.
- **가로가 가변이다**: 사용자가 드래그로 폭을 바꾸므로 고정 크기를 걷어내고
  내용이 폭을 따라 늘어나게 했다(짧은 화면은 읽기 폭 상한 + 세로 가운데 정렬).

## 준비

```bash
cp extension/.env.example extension/.env.local   # 값 채우기
pnpm install                                     # 레포 루트에서
```

`.env.local` 에 최소한 `VITE_API_BASE_URL` 이 있어야 빌드된다(없으면 빌드가 먼저 알려준다).

## 로컬에서 확인하는 두 가지 방법

### 1. 브라우저 탭에서 UI 만 빠르게 (가장 빠름)

```bash
pnpm --filter promise9-extension dev
# http://localhost:5173/src/sidepanel/index.html 를 일반 탭에서 연다
```

확장으로 설치하지 않아도 패널 화면이 그대로 뜬다. 창 폭을 줄였다 늘리면 가변 대응도 볼 수 있다. `chrome.*` 는 dev 전용 스텁
(`src/dev/chromeStub.ts`)이 대신하므로 **실제 저장은 되지 않고**, 활성 탭 정보도 고정값이다.
UI·레이아웃·문구를 손보며 HMR 로 확인할 때 쓴다.

결과 화면처럼 특정 상태를 보려면 콘솔에서 상태를 직접 넣으면 된다:

```js
const [tab] = await chrome.tabs.query({ active: true });
await chrome.storage.session.set({
  save: {
    session: { url: tab.url, phase: "success", linkId: 42, failureCount: 0 },
    request: { url: tab.url, folderId: null, memo: null },
  },
});
// phase: "success" | "duplicate" | "failed" | "retry-limit"
```

### 2. 실제 익스텐션으로 설치 (동작까지 확인)

```bash
pnpm --filter promise9-extension dev     # 또는 build
```

1. 크롬에서 `chrome://extensions` 열기
2. 우측 상단 **개발자 모드** 켜기
3. **압축해제된 확장 프로그램을 로드** → `extension/dist` 선택
4. 툴바 퍼즐 아이콘에서 확장을 고정한 뒤 아이콘 클릭 → 우측에 패널이 열린다

`dev` 로 띄우면 패널 코드는 저장 즉시 반영된다. `manifest` · service worker 를 고치면
확장 프로그램 목록에서 새로고침 아이콘을 눌러야 한다.

## 스크립트

| 명령 | 하는 일 |
| --- | --- |
| `pnpm dev` | 개발 서버 + `dist` 갱신 |
| `pnpm build` | 타입 검사 후 프로덕션 빌드 |
| `pnpm test` | vitest 실행 |

## 구조

```
src/
├─ background/   service worker — 저장 실행(패널이 닫혀도 계속된다) · 아이콘 클릭 시 패널 열기
├─ sidepanel/   패널 UI (screens · components · hooks)
├─ lib/          chrome 래퍼 · 활성 탭 추적 · 메시지 타입 · 저장 상태 · URL 판정
├─ dev/          dev 전용 chrome 스텁
└─ assets/       시안에서 내려받은 일러스트
```

서버 계약(`GET/POST /folders`, `POST /links`)과 디자인 토큰은 앱·웹과 공유한다
(`shared/entities`, `shared/styles/tokens.css`).

## 로그인 — 웹앱에 위임

익스텐션에는 로그인 UI 가 없다. 로그인 버튼은 웹앱 `/login?return=extension` 을 새 탭으로 열고,
웹앱이 `POST /auth/extension-token` 으로 발급받은 **익스텐션 전용 토큰쌍**을
`chrome.runtime.sendMessage(확장 ID, …)` 로 넘겨준다. background 는 받은 쌍을 저장하고,
웹앱은 완료 안내와 "원래 탭으로 돌아가기" 버튼을 보여준다. 웹에 이미 로그인돼 있으면
소셜 로그인 없이 즉시 연결된다.
(Pocket · Instapaper · Raindrop 과 같은 방식.)

- 웹의 리프레시 토큰을 복사하지 않는 이유: 서버가 Refresh Token Rotation 을 써서 같은 토큰을
  두 표면이 나눠 가지면 한쪽이 갱신할 때 다른 쪽이 로그아웃된다. `/auth/extension-token` 은
  웹 세션과 **별개의 tokenFamily** 로 발급해 서로 독립이다.
- 메시지 계약은 `shared/extension/extensionLogin.contracts.ts` 하나를 웹·익스텐션이 같이 쓴다.
- 구글 클라이언트 ID · Cloud Console 등록이 **익스텐션에는 필요 없다** — 구글 인증은 웹앱이 한다.

이 흐름이 동작하려면 세 가지가 맞아야 한다.

| 어디 | 무엇 | 왜 |
| --- | --- | --- |
| `manifest.config.ts` | `key` 로 확장 ID 고정 (`mniefhlffindhhfnpkbmndbgjdkdkjml`) | 웹앱이 보낼 대상 ID 가 사람마다 달라지면 안 된다 |
| `manifest.config.ts` | `externally_connectable.matches` 에 웹앱 도메인 | 그 도메인 페이지만 이 익스텐션에 메시지를 보낼 수 있다 |
| 루트 `.env.local` | `EXPO_PUBLIC_EXTENSION_ID` = 위 ID | 웹앱이 `sendMessage` 에 넘길 대상 |

`extension/key.pem` 은 ID 를 고정하는 개인키다. **gitignore 대상이고 압축해제 로드에는 필요 없다**
(자체 배포용 `.crx` 서명에만 쓰인다). 팀 비밀번호 관리자 등에 보관한다.
스토어 배포 시에는 웹 스토어가 자체 ID 를 부여하므로 `EXPO_PUBLIC_EXTENSION_ID` 를 그 값으로 바꾼다.

로컬 웹앱(`localhost:8090`)에서는 인계가 되지 않는다 — `externally_connectable` 이 배포 도메인만
허용한다. 로그인 확인은 배포된 웹앱으로 한다.

## 아직 없는 것

- **중복 저장 시 '링크 보러가기'**: 서버가 중복 응답에 기존 `linkId` 를 주지 않아 웹앱 홈으로 보낸다.
- **앱의 리마인드**: 익스텐션은 서버 계약(`reminderAt`)대로 보내지만, 앱 저장 시트는 서버가
  모르는 `remindType` 을 보내고 있어 저장되지 않는다. 앱 쪽 정리는 별도 작업이다.
