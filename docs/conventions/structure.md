# 폴더 구조 (Folder Structure)

> **기능 기반(feature-based)** 구조다. FSD 아님 — 레이어/import 린터/public API 격식 없음.
> 목적: "어디 둘지" 규칙 하나로 3명 + AI 가 일관되게 만들고 **중복을 막는 것**.
>
> 다만 FSD 의 **엔티티/유스케이스 분리 개념 하나는 빌려 쓴다** (`src/entities/`). 화면 단위로만 나눴더니
> 여러 화면이 쓰는 서버 계약이 특정 화면 폴더에 갇혀서, 홈이 보관함을 import 하는 식으로 샜기 때문이다.
> 빌린 건 이 한 가지뿐이고 나머지 FSD 격식(레이어 6종·public API·import 린터)은 도입하지 않는다.

## 서비스 맥락
링크 저장 · 분류 · 검색 · 리마인드 서비스. **앱 · 웹 · 익스텐션 세 표면이 같은 도메인(링크)을 공유**한다.
그래서 중복이 가장 터지기 쉬운 곳이 **표면 간 경계** → 공유 코어 `shared/` 로 막는다.

## 3-Zone 레포 구조

```
/                          # Expo 앱+웹 (루트 package.json = Expo)
├─ src/
│   ├─ app/                # expo-router 라우팅 껍데기 (화면은 features에서 import)
│   ├─ entities/           # 데이터 단위 — 서버 계약(쿼리·스키마·errorCode). 화면을 모른다
│   │   ├─ link/           #   GET/POST /links ...
│   │   └─ folder/         #   GET/POST/PATCH/DELETE /folders ...
│   ├─ features/           # 앱/웹 전용 기능 UI (= 화면·유스케이스 단위)
│   │   ├─ home/           #   홈
│   │   ├─ archive/        #   보관함(폴더 목록·폴더 상세)
│   │   ├─ search/         #   검색
│   │   ├─ link/           #   링크 저장 시트·링크 상세
│   │   ├─ settings/
│   │   └─ auth/
│   ├─ components/ui/      # 기능 무관 공용 UI (Button 등)
│   ├─ constants/          # 앱/웹 전역 상수 (라우트 경로 등)
│   ├─ hooks/              # 공용 훅
│   ├─ lib/                # queryClient · dayjs 등 인프라
│   └─ utils/              # 순수 함수 (날짜 포맷 등)
│
├─ shared/                 # ⭐ 순수 TS, 세 표면 공용 (RN/DOM/chrome.* 의존 금지)
│   ├─ types/              #   Link · Folder 등 서버 DTO 기반 타입
│   ├─ api/                #   HTTP 클라이언트 · 에러 서브클래스 · 토큰
│   └─ folder/             #   폴더 색 팔레트 상수
│
└─ extension/              # 크롬 익스텐션 (자체 package.json + 자체 번들러) — 아직 없음
    └─ src/
        ├─ background/     #   service worker
        ├─ popup/          #   저장 UI
        └─ content/
```

## 💡 결정 규칙 (가장 중요)

새 파일을 만들 때 **순서대로** 판단한다:

1. **세 표면 공유 + 순수 TS(RN/DOM/chrome.* 비의존)?** → `shared/`
   - 예: `Link` 타입, 저장 API 클라이언트, 분류/검색 로직, URL 정규화
2. **서버가 정한 것?** → `src/entities/<도메인>/`
   - 엔드포인트·응답 스키마·쿼리/뮤테이션·캐시 키·서버 errorCode
   - 판별 질문: *"이 값을 우리가 정했나, 서버가 정했나?"* — 서버면 엔티티다.
3. **앱/웹 전용?** → 기능 전용은 `src/features/<기능>/`, 여러 기능 공용은 `src/components | hooks | utils`
4. **익스텐션 전용?** → `extension/src/`

> 헷갈리면 **`shared/` 가능성을 먼저** 의심한다. 앱과 익스텐션이 같은 걸 또 만드는 게 1순위 중복 위험.

## shared/ (공유 코어) 규칙
- **순수 TS만.** `react-native` / `expo-*` / DOM API / `chrome.*` import 절대 금지 (그래야 양쪽 번들러가 빌드 가능).
- 의존성 최소화. UI 레이어(컴포넌트, react-query 훅)는 여기 두지 않는다 — 앱/웹은 `entities/` 에서 `shared/api` 를 호출.
- alias: `@shared/*` → `./shared/*`

## entities/ (데이터 단위) 규칙

- **서버 계약만 소유한다** — 엔드포인트·zod 응답 스키마·`queryOptions`·mutation·캐시 키·서버 errorCode.
- **화면을 모른다.** 화면용 모델 변환(`select`)·폼 검증·표시 문구는 소비하는 `features/` 것이다.
  같은 캐시를 여러 화면이 서로 다른 `select` 로 뽑아 쓴다.
  ```tsx
  useSuspenseQuery({ ...folderQueries.list(), select: toArchiveFolderData })   // 보관함
  useSuspenseQuery({ ...folderQueries.list(), select: selectFrequentFolders }) // 홈
  ```
- **import 방향은 한 방향** — `features → entities → shared`. 되짚어 올라가지 않는다.
- **`features` 끼리 import 하지 않는다.** 다른 화면의 것이 필요하면 그건 십중팔구 엔티티다.
- **`entities` 끼리는 캐시 키만 참조한다.** (예: 폴더 삭제 후 링크 목록 무효화 →
  `folder` 가 `linkQueries.keys.lists()` 참조). 로직·모델을 가져다 쓰지는 않는다.
- `shared/` 와의 구분: 세 표면(앱·웹·익스텐션) 공용 순수 TS 는 `shared/`,
  react-query 가 붙는 앱/웹 데이터 레이어는 `entities/`.

## src/ (앱+웹, Expo/RN)
- `app/` 는 **라우팅 껍데기만**. 화면 로직은 `src/features/<기능>/<Name>Screen.tsx`.
- `src/features/<기능>/` 안: `components/` `hooks/` + 화면. 기능 공용 타입·상수는 `<도메인>.types.ts` · `<도메인>.constants.ts`.
  - 엔티티 쿼리의 화면별 조합(파라미터·`select`)은 **호출부에서 직접** 한다 — 한 화면만 쓰는 얇은 쿼리 팩토리를 만들지 않는다. 반복되는 규칙(파라미터 매핑·선정 정책)은 `<도메인>.utils.ts` 의 순수 함수로 뽑는다.
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
