import { type Href, useNavigation, useRoute, useRouter } from "expo-router";
import { useEffect, useRef } from "react";

/**
 * 투명 모달 시트 라우트 안에서의 이동.
 * - 닫기는 이 라우트 자신을 뺀다 — 출처 없는 back 은 그사이 위에 쌓인 다른 라우트를 뺄 수 있다.
 * - 시트가 떠 있는 동안 다른 화면으로 가면 시트 자리를 그 화면으로 바꾼다 — iOS 는 시트가 떠 있는 채로
 *   push 하면 새 화면이 시트 뒤에 쌓여 보이지 않는다. 시트를 떠난 뒤(스낵바 '보기' 등)엔 그대로 push 한다.
 */
export function useSheetRouteNavigation() {
  const router = useRouter();
  const navigation = useNavigation();
  const route = useRoute();
  const hasLeftSheetRef = useRef(false);

  useEffect(() => {
    hasLeftSheetRef.current = false;
    return () => {
      hasLeftSheetRef.current = true;
    };
  }, []);

  const closeSheet = () => {
    // 시트 자리를 다른 화면으로 바꾼 뒤 늦게 온 닫힘 콜백이 그 화면을 빼지 않게 한다.
    if (hasLeftSheetRef.current) return;
    hasLeftSheetRef.current = true;
    // 웹에서 히스토리가 없으면(직접 진입 등) 뒤로 갈 곳이 없어 홈으로 대체한다.
    if (!navigation.canGoBack()) {
      router.replace("/");
      return;
    }
    // navigation.goBack() 은 출처만 실어 스택이 포커스된 라우트를 뺀다 — 대상 스택까지 지정해야 이 라우트를 뺀다.
    navigation.dispatch((state) => ({
      type: "GO_BACK",
      source: route.key,
      target: state.key,
    }));
  };

  const navigateFromSheet = (href: Href) => {
    if (hasLeftSheetRef.current) {
      router.push(href);
      return;
    }
    hasLeftSheetRef.current = true;
    router.replace(href);
  };

  return { closeSheet, navigateFromSheet };
}
