# 폴더 구조 (Folder Structure)

> **기능 기반(feature-based)** 구조다. FSD 아님 — 레이어/import 린터/public API 격식 없음.
> 목적: "어디 둘지" 규칙 하나로 3명 + AI 가 일관되게 만들고 **중복을 막는 것**.

## 서비스 맥락
링크 저장 · 분류 · 검색 · 리마인드 서비스. **앱 · 웹 · 익스텐션 세 표면이 같은 도메인(링크)을 공유**한다.
그래서 중복이 가장 터지기 쉬운 곳이 **표면 간 경계** → 공유 코어 `shared/` 로 막는다.

## 3-Zone 레포 구조

```
/                          # Expo 앱+웹 (루트 package.json = Expo)
├─ src/
│   ├─ app/                # expo-router 라우팅 껍데기 (화면은 features에서 import)
│   ├─ features/           # 앱/웹 전용 기능 UI
│   │   ├─ save/           #   링크 저장 플로우
│   │   ├─ library/        #   저장 목록 + 분류 보기
│   │   ├─ search/
│   │   ├─ reminders/
│   │   └─ auth/
│   ├─ components/ui/      # 기능 무관 공용 UI (Button 등)
│   ├─ hooks/              # 공용 훅
│   ├─ lib/                # queryClient 등 인프라 (이미 존재)
│   ├─ utils/              # 순수 함수
│   └─ types/              # 앱/웹 전역 타입
│
├─ shared/                 # ⭐ 순수 TS, 세 표면 공용 (RN/DOM/chrome.* 의존 금지)
│   ├─ types/              #   Link, Tag, Collection, Reminder ...
│   ├─ api/                #   백엔드 API 클라이언트(fetch) + 엔드포인트
│   ├─ domain/             #   분류 규칙, 검색/필터 순수 함수, URL 정규화
│   └─ constants/
│
└─ extension/              # 크롬 익스텐션 (자체 package.json + 자체 번들러)
    └─ src/
        ├─ background/     #   service worker
        ├─ popup/          #   저장 UI
        └─ content/
```

## 💡 결정 규칙 (가장 중요)

새 파일을 만들 때 **순서대로** 판단한다:

1. **세 표면 공유 + 순수 TS(RN/DOM/chrome.* 비의존)?** → `shared/`
   - 예: `Link` 타입, 저장 API 클라이언트, 분류/검색 로직, URL 정규화
2. **앱/웹 전용?** → 기능 전용은 `src/features/<기능>/`, 여러 기능 공용은 `src/components | hooks | utils`
3. **익스텐션 전용?** → `extension/src/`

> 헷갈리면 **`shared/` 가능성을 먼저** 의심한다. 앱과 익스텐션이 같은 걸 또 만드는 게 1순위 중복 위험.

## shared/ (공유 코어) 규칙
- **순수 TS만.** `react-native` / `expo-*` / DOM API / `chrome.*` import 절대 금지 (그래야 양쪽 번들러가 빌드 가능).
- 의존성 최소화. UI 레이어(컴포넌트, react-query 훅)는 여기 두지 않는다 — 표면별 `features/api/` 에서 `shared/api` 를 호출.
- alias: `@shared/*` → `./shared/*`

## src/ (앱+웹, Expo/RN)
- `app/` 는 **라우팅 껍데기만**. 화면 로직은 `src/features/<기능>/<Name>Screen.tsx`.
- `src/features/<기능>/` 안: `components/` `hooks/` `api/`(react-query 훅·zod 스키마) + 화면. 기능 공용 타입·상수는 `<도메인>.types.ts` · `<도메인>.constants.ts`.
- 기능 무관 공용 UI 는 `src/components/ui/`.
- alias: `@/*` → `./src/*`

## extension/ (크롬 익스텐션)
- 자체 `package.json` + 번들러. `shared/` 는 `@shared` 로 import.
- `background/`(service worker) · `popup/`(저장 UI) · `content/`.

## 공통 규칙
- **모음 파일은 `<도메인>.<역할>.ts`** — `link.types.ts` · `link.constants.ts` · `link.queries.ts` · `link.contracts.ts`. 전 구역 공통(features·shared 모두): 폴더가 도메인이든 카테고리든 파일명만으로 도메인+역할이 읽히게 한다 (에디터 탭·검색에서 `types.ts` 5개가 열려도 구분되도록).
  - **co-locate 우선**: 한 파일에서만 쓰는 타입·상수·컴포넌트 Props 는 그 파일 안에 둔다. 모음 파일은 여러 파일이 공유할 때만 만든다.
  - API 요청/응답 타입은 `<도메인>.contracts.ts` 의 `z.infer` 가 단일 출처 — `*.types.ts` 에 중복 정의하지 않는다.
- import 는 절대경로 `@/`(앱/웹) · `@shared/`(공유 코어). 상대경로는 **같은 기능 폴더 내부**에서만.
- 플랫폼 분기: 같은 폴더에 `Button.tsx` / `Button.web.tsx` co-location. (리마인드 발송처럼 표면별로 다른 로직)
- **빈 폴더 미리 만들지 않기** — 필요할 때 생성.
- `index.ts` public API 는 선택(편하면 사용, 강제 아님).
- 새로 만들기 전 `/check-dup` 으로 위 결정 규칙 따라 기존 코드부터 검색.

## ⚠️ 셋업 (shared/ 사용 전 1회)
- `tsconfig.json` 에 `@shared/*` → `./shared/*` path 추가. (Expo 는 tsconfig paths 지원)
- 익스텐션 번들러에 `@shared` → `../shared` alias + tsconfig paths.
