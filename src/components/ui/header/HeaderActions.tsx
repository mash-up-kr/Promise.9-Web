import { useRouter } from "expo-router";
import { Ellipsis, Search } from "lucide-react-native";

import { IconButton } from "@/components/ui/icon-button/IconButton";

export function HeaderActions() {
  const router = useRouter();

  return (
    <>
      <IconButton
        iconNode={Search}
        accessibilityLabel="검색"
        onPress={() => router.navigate("/search")}
      />
      <IconButton iconNode={Ellipsis} accessibilityLabel="더보기" />
    </>
  );
}
