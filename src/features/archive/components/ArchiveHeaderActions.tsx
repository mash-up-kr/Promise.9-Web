import { useRouter } from "expo-router";
import { Search } from "lucide-react-native";

import { IconButton } from "@/components/ui/icon-button/IconButton";

import { ArchiveMoreMenu } from "./ArchiveMoreMenu";

// 보관함 탭 헤더 우측 액션 — 검색 + 더보기 메뉴.
export function ArchiveHeaderActions() {
  const router = useRouter();

  return (
    <>
      <IconButton
        iconNode={Search}
        accessibilityLabel="검색"
        onPress={() => router.navigate("/search")}
      />
      <ArchiveMoreMenu
        onCreateFolder={() => router.push("/create-folder")}
        onEditOrder={() => {
          // TODO(#37): 폴더 정렬 편집(드래그 재정렬) 모드 진입 — 별도 작업.
        }}
      />
    </>
  );
}
