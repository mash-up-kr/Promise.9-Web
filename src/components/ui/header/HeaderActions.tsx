import { Ellipsis, Search } from "lucide-react-native";

import { GlassIconButton } from "@/components/ui/glass-icon-button/GlassIconButton";

export function HeaderActions() {
  return (
    <>
      <GlassIconButton iconNode={Search} label="검색" />
      <GlassIconButton iconNode={Ellipsis} label="더보기" />
    </>
  );
}
