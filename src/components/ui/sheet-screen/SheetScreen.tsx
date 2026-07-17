import { useRouter } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { VStack } from "@/components/ui/vstack/VStack";
import { SheetShell } from "./SheetShell"; // Metro 가 web/native 로 자동 분기
import type { SheetScreenProps } from "./sheet-screen.types";

// 바텀시트 라우트(새 폴더·링크 저장…)의 공통 레이아웃.
// 플랫폼별 껍데기는 SheetShell 에 위임하고, 여기선 스크롤·여백 스캐폴드만 담당한다.
export function SheetScreen({ children, onClose }: SheetScreenProps) {
  const router = useRouter();
  const close = onClose ?? (() => router.back());

  return (
    <SheetShell onClose={close}>
      <KeyboardAwareScrollView
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
      >
        <VStack space="2xl" className="pt-1">
          {children}
        </VStack>
      </KeyboardAwareScrollView>
    </SheetShell>
  );
}
