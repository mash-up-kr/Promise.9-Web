import { Ellipsis, Search } from "lucide-react-native";

import { IconButton } from "@/components/ui/icon-button/IconButton";

export function HeaderActions() {
  return (
    <>
      <IconButton iconNode={Search} accessibilityLabel="검색" />
      <IconButton iconNode={Ellipsis} accessibilityLabel="더보기" />
    </>
  );
}
