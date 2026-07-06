import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Pressable } from "react-native";

import { Icon } from "@/components/ui/icon/Icon";

export function HeaderBackButton() {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="뒤로 가기"
      className="items-center justify-center rounded-full p-2"
      onPress={() => router.back()}
    >
      <Icon iconNode={ChevronLeft} />
    </Pressable>
  );
}
