import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";

import { IconButton } from "@/components/ui/icon-button/IconButton";
import { ROUTES } from "@/constants/routes.constants";

export function HeaderBackButton() {
  const router = useRouter();

  // 딥링크·웹 직접 진입은 돌아갈 히스토리가 없어 홈으로 대체 이동한다
  const handlePress = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.HOME);
  };

  return (
    <IconButton
      iconNode={ChevronLeft}
      accessibilityLabel="뒤로 가기"
      onPress={handlePress}
    />
  );
}
