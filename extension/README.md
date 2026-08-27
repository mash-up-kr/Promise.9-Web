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

## 구글 로그인 설정

확장 ID 는 `manifest.config.ts` 의 `key` 로 고정돼 있어 **모든 팀원이 같은 ID** 를 쓴다.

```
확장 ID       mniefhlffindhhfnpkbmndbgjdkdkjml
리디렉션 URI   https://mniefhlffindhhfnpkbmndbgjdkdkjml.chromiumapp.org/
```

로그인이 동작하려면 두 가지가 필요하다.

1. Google Cloud Console → 사용자 인증 정보 → **웹 애플리케이션** 클라이언트(앱/웹이 쓰는 것과 동일)
   → **승인된 리디렉션 URI** 에 위 주소 등록 (한 번만, 전원 공용)
2. `extension/.env.local` 의 `VITE_GOOGLE_WEB_CLIENT_ID` 에 그 클라이언트 ID 를 채우고 다시 빌드

`extension/key.pem` 은 ID 를 고정하는 개인키다. **gitignore 대상이고 압축해제 로드에는 필요 없다**
(자체 배포용 `.crx` 서명에만 쓰인다). 팀 비밀번호 관리자 등에 보관한다.
스토어 배포 시에는 웹 스토어가 자체 ID 를 부여하므로 그때 리디렉션 URI 를 한 번 더 등록해야 한다.

## 아직 없는 것

- **중복 저장 시 '링크 보러가기'**: 서버가 중복 응답에 기존 `linkId` 를 주지 않아 웹앱 홈으로 보낸다.
- **앱의 리마인드**: 익스텐션은 서버 계약(`reminderAt`)대로 보내지만, 앱 저장 시트는 서버가
  모르는 `remindType` 을 보내고 있어 저장되지 않는다. 앱 쪽 정리는 별도 작업이다.
