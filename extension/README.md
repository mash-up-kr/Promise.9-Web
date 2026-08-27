# 링딩동 크롬 익스텐션

보고 있는 페이지를 링딩동에 저장하는 MV3 익스텐션. **사이드패널 형태**이며 시안은
Figma `크롬 웹 스토어 익스텐션 (Chrome Extension)` 섹션이다.

> 이 브랜치는 팝업(`chore/extension-popup-scaffold`)과 비교하기 위한 사이드패널 버전이다.
> 화면·저장 로직은 같고, 진입점과 아래 두 가지가 다르다.
>
> - **탭을 따라간다**: 패널이 열린 채 탭을 옮기거나 페이지를 이동하면 저장 대상도 바뀐다.
>   그래서 권한이 `activeTab` 대신 상시 `tabs` 다.
> - **가로가 가변이다**: 사용자가 드래그로 폭을 바꾸므로 400px 고정을 걷어내고
>   내용이 폭을 따라 늘어나게 했다(짧은 화면은 읽기 폭 상한 + 세로 가운데 정렬).

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

## 아직 없는 것

- **리마인드**: 서버 `POST /links` 계약에 리마인드 필드가 없어 시안의 날짜·시간 선택은 미구현.
- **실제 로그인**: 소셜 로그인 연동 전까지 인증은 앱·웹과 같은 마스터 토큰을 쓰고,
  로그인 화면은 로컬 플래그로만 흐름을 태운다(`src/lib/storage.ts`).
- **중복 저장 시 '링크 보러가기'**: 서버가 중복 응답에 기존 `linkId` 를 주지 않아 웹앱 홈으로 보낸다.
