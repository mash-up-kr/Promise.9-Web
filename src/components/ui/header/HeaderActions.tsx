import { useRouter } from "expo-router";
import { Ellipsis, Search } from "lucide-react-native";

import { IconButton } from "@/components/ui/icon-button/IconButton";
import { ROUTES } from "@/constants/routes.constants";

export function HeaderActions() {
  const router = useRouter();

  return (
    <>
      <IconButton
        iconNode={Search}
        accessibilityLabel="검색"
        onPress={() => router.navigate(ROUTES.SEARCH)}
      />
      <IconButton iconNode={Ellipsis} accessibilityLabel="더보기" />
    </>
  );
}
