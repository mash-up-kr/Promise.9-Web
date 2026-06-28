import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";

import { GlassIconButton } from "@/components/ui/glass-icon-button/GlassIconButton";

export function HeaderBackButton() {
  const router = useRouter();

  return (
    <GlassIconButton
      iconNode={ChevronLeft}
      label="뒤로 가기"
      onPress={() => router.back()}
    />
  );
}
