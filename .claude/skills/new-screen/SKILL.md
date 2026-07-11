---
name: new-screen
description: expo-router 화면(라우트)을 팀 컨벤션대로 추가한다. Use when adding a new screen/route to the app/web. app/ 은 라우팅 껍데기로 두고 로직은 features 로 분리한다.
---

# new-screen — 화면 추가 (expo-router)

## 먼저
- `/check-dup` 확인. 규칙: docs/conventions/structure.md, app-web.md.
- Expo 56 라우팅 문서: https://docs.expo.dev/versions/v56.0.0/

## 패턴
- `src/app/<route>.tsx` 는 **얇게**: 화면 컴포넌트를 import 해서 렌더만 한다.
- 실제 화면 로직은 `src/features/<기능>/` 에 둔다.
- 레이아웃/네비게이션 옵션은 `_layout.tsx` 또는 `Stack.Screen` options.
- typed routes 사용: 링크/네비게이션은 타입 안전하게.

## 단계
1. `src/features/<기능>/<Name>Screen.tsx` 생성 (named export).
2. `src/app/<route>.tsx` 에서 import 후 렌더:
   ```tsx
   import { LibraryScreen } from '@/features/library/LibraryScreen';

   export default function Route() {
     return <LibraryScreen />;
   }
   ```
3. 데이터가 필요하면 `src/features/<기능>/api/` 에 react-query 훅을 추가한다 → `/new-query`.
4. typedRoutes 타입 갱신을 위해 `pnpm start` 한 번 또는 타입체크.
