import type { PropsWithChildren } from "react";
import { View } from "react-native";

// 익스텐션 시트 4종(확인 중·로그인·저장·결과)이 공유하는 틀.
// 가로 패딩은 갖지 않는다 — 헤더(BottomSheetHeader)가 전폭이어야 해서 본문 쪽이 px-5 를 갖는다.
// 핸들 영역 높이(8+4+12)는 컨테이너의 드래그 존(24pt)과 맞춘다.
export function SheetFrame({ children }: PropsWithChildren) {
  return (
    <View className="flex-1 rounded-t-3xl bg-background-base pb-6">
      <View className="items-center pt-2 pb-3">
        <View className="h-1 w-9 rounded-full bg-icon-assistive" />
      </View>
      {children}
    </View>
  );
}
