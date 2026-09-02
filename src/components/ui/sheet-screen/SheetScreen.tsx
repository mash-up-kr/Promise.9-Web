import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { VStack } from "@/components/ui/vstack/VStack";
import { SheetShell } from "./SheetShell";
import type { SheetScreenProps } from "./sheet-screen.types";

// 바텀시트 라우트(새 폴더·링크 저장…)의 공통 레이아웃.
// 플랫폼별 껍데기는 SheetShell 에 위임하고, 여기선 스크롤·여백 스캐폴드만 담당한다.
export function SheetScreen({
  children,
  onClose,
  header,
  backdropPressBehavior,
  isLocked,
}: SheetScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const close = onClose ?? (() => router.back());

  return (
    <SheetShell
      onClose={close}
      backdropPressBehavior={backdropPressBehavior}
      isLocked={isLocked}
    >
      {/* 헤더는 스크롤뷰의 sticky 첫 요소로 둔다 — 스크롤뷰 밖 형제로 두면 gorhom 동적
          사이징의 콘텐츠 측정에서 빠져 시트가 헤더 높이만큼 낮게 계산되고, sticky 가
          정책(헤더 고정 + 콘텐츠가 헤더 뒤로 지나감)과도 일치한다. */}
      <BottomSheetScrollView
        keyboardShouldPersistTaps="handled"
        stickyHeaderIndices={header ? [0] : undefined}
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
      >
        {header}
        <VStack space="2xl" className="px-5 pt-1">
          {children}
        </VStack>
      </BottomSheetScrollView>
    </SheetShell>
  );
}
