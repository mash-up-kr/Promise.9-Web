---
name: new-component
description: NativeWind 기반 React Native 컴포넌트를 팀 컨벤션대로 스캐폴드한다. Use when creating a new UI component for the app/web. 익스텐션 UI 에는 사용하지 않는다.
---

# new-component — 컴포넌트 생성 (앱/웹)

## 먼저
- **`/check-dup` 를 먼저 수행**(이미 했으면 생략). 중복이면 만들지 않는다.
- 규칙: docs/conventions/structure.md, app-web.md, shared.md.

## 위치 (structure.md 결정 규칙)
- 기능 무관 공용 UI → `src/components/ui/`
- 특정 기능 전용 → `src/features/<기능>/components/`
- 애매하면 위치를 사용자에게 확인한다.
- (컴포넌트는 RN 의존이므로 절대 `shared/` 에 두지 않는다 — `shared/` 는 순수 TS 전용)

## 규칙
- 함수형 + **named export**. PascalCase 파일/이름.
- props 는 명시적 `type Props = {...}`.
- 스타일은 NativeWind `className`. 동적 스타일만 예외.
- 플랫폼 분기는 className 우선, 불가피하면 `*.web.tsx` / `*.native.tsx`.

## 템플릿
```tsx
import { View, Text } from 'react-native';

type Props = {
  // ...
};

export function ComponentName({}: Props) {
  return (
    <View className="">
      <Text className=""></Text>
    </View>
  );
}
```

생성 후 `pnpm lint` 또는 `npx tsc --noEmit` 로 확인을 권장한다.
