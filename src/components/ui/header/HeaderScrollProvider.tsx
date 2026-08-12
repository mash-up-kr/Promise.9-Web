import { createContext, useCallback, useContext, useRef } from "react";
import type { SharedValue } from "react-native-reanimated";
import { makeMutable } from "react-native-reanimated";

// Figma Header 스크롤 트리거: 배경 있는 헤더는 스크롤 시 콘텐츠와 함께 밀려 올라가고,
// 역스크롤 시 즉시 재등장한다. 헤더(navigator header 슬롯)와 화면(ScrollView)이 트리에서
// 분리돼 있어 shared value 를 context 로 잇는다.
// 숨김량은 scrollScope 키별로 분리 — 헤더는 자기 화면의 스크롤에만 반응하고,
// 다른 화면 헤더가 남의 숨김 상태에 오염되지 않는다.
interface HeaderScrollRegistry {
  getHiddenOffset: (scope: string) => SharedValue<number>;
}

const HeaderScrollContext = createContext<HeaderScrollRegistry | null>(null);

export function HeaderScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const registry = useRef(new Map<string, SharedValue<number>>());

  const getHiddenOffset = useCallback((scope: string) => {
    let offset = registry.current.get(scope);
    if (!offset) {
      // 렌더 도중 임의 시점에 생성해야 하므로 훅(useSharedValue) 대신 makeMutable 을 쓴다.
      offset = makeMutable(0);
      registry.current.set(scope, offset);
    }
    return offset;
  }, []);

  return (
    <HeaderScrollContext.Provider value={{ getHiddenOffset }}>
      {children}
    </HeaderScrollContext.Provider>
  );
}

/** scope 의 숨김량(0=완전 표시, 헤더 총높이=완전 숨김). Provider 밖·scope 미지정이면 null. */
export function useHeaderHiddenOffset(scope: string | undefined) {
  const registry = useContext(HeaderScrollContext);
  if (!registry || !scope) return null;
  return registry.getHiddenOffset(scope);
}
