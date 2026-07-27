import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { VStack } from "@/components/ui/vstack/VStack";
import { SheetShell } from "./SheetShell";
import type { SheetScreenProps } from "./sheet-screen.types";

// 바텀시트 라우트(새 폴더·링크 저장…)의 공통 레이아웃.
// 플랫폼별 껍데기는 SheetShell 에 위임하고, 여기선 스크롤·여백 스캐폴드만 담당한다.
export function SheetScreen({ children, onClose }: SheetScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const close = onClose ?? (() => router.back());

  return (
    <SheetShell onClose={close}>
      <BottomSheetScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
      >
        <VStack space="2xl" className="px-5 pt-1">
          {children}
        </VStack>
      </BottomSheetScrollView>
    </SheetShell>
  );
}
