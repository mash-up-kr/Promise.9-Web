import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";

import { IconButton } from "@/components/ui/icon-button/IconButton";

export function HeaderBackButton() {
  const router = useRouter();

  return (
    <IconButton
      iconNode={ChevronLeft}
      accessibilityLabel="뒤로 가기"
      onPress={() => router.back()}
    />
  );
}
