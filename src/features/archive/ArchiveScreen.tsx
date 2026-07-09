import { useRouter } from "expo-router";
import { Ellipsis, Search } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { Header } from "@/components/ui/header/Header";
import { IconButton } from "@/components/ui/icon-button/IconButton";

import { ArchiveMoreMenu } from "./components/ArchiveMoreMenu";
import { FolderGroup } from "./components/FolderGroup";
import { FolderItem } from "./components/FolderItem";
import { FolderSection } from "./components/FolderSection";
import type { Folder } from "./types";

// 폴더 API 는 아직 없어 정적 데이터로 구성한다. react-query 연동은 후속 작업.
const BASIC_FOLDERS: Folder[] = [
  { id: "all", name: "전체", count: 370, tone: "gray" },
  { id: "uncategorized", name: "미분류", count: 370, tone: "gray" },
  { id: "favorites", name: "즐겨찾기", count: 370, tone: "gray" },
];

const MY_FOLDERS: Folder[] = [
  { id: "design", name: "디자인", count: 370, tone: "blue" },
  { id: "ai", name: "AI", count: 370, tone: "blue" },
  { id: "dev", name: "개발", count: 370, tone: "blue" },
  { id: "later", name: "나중에 갈 곳", count: 370, tone: "blue" },
  { id: "trash", name: "최근 삭제된 링크", count: 370, tone: "gray" },
];

export function ArchiveScreen() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>("ai");
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const handleOpenFolder = (id: string) => {
    setSelectedId(id);
    router.push({ pathname: "/archive/[id]", params: { id } });
  };

  const handleSearch = () => {
    router.push("/search");
  };

  const handleMore = () => {
    setIsMoreOpen((prev) => !prev);
  };

  const handleEdit = () => {
    setIsMoreOpen(false);
    // TODO: 폴더 편집 모드 진입 (후속 작업)
  };

  const handleSort = () => {
    setIsMoreOpen(false);
    // TODO: 정렬 옵션 선택 (후속 작업)
  };

  const handleAddFolder = () => {
    // TODO: 폴더 추가 플로우 (후속 작업)
  };

  return (
    <View className="flex-1 bg-background-base">
      {/* z-10: 더보기 메뉴가 아래 ScrollView·백드롭 위로 겹쳐 보이도록 헤더를 앞 레이어로 둔다. */}
      <View className="z-10">
        <Header
          title="보관함"
          right={
            <>
              <IconButton
                iconNode={Search}
                accessibilityLabel="검색"
                onPress={handleSearch}
              />
              {/* 더보기 버튼 자체를 anchor 로 삼아 메뉴가 버튼 바로 아래에 뜨게 한다. */}
              <View className="relative">
                <IconButton
                  iconNode={Ellipsis}
                  accessibilityLabel="더보기"
                  onPress={handleMore}
                />
                {isMoreOpen ? (
                  <ArchiveMoreMenu onEdit={handleEdit} onSort={handleSort} />
                ) : null}
              </View>
            </>
          }
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-12 pt-5 pb-6">
          <FolderSection title="기본 폴더">
            <FolderGroup>
              {BASIC_FOLDERS.map((folder) => (
                <FolderItem
                  key={folder.id}
                  name={folder.name}
                  count={folder.count}
                  tone={folder.tone}
                  selected={selectedId === folder.id}
                  onPress={() => handleOpenFolder(folder.id)}
                />
              ))}
            </FolderGroup>
          </FolderSection>

          <FolderSection
            title="내 폴더"
            action={{ label: "폴더 추가", onPress: handleAddFolder }}
          >
            <FolderGroup>
              {MY_FOLDERS.map((folder) => (
                <FolderItem
                  key={folder.id}
                  name={folder.name}
                  count={folder.count}
                  tone={folder.tone}
                  selected={selectedId === folder.id}
                  onPress={() => handleOpenFolder(folder.id)}
                />
              ))}
            </FolderGroup>
          </FolderSection>
        </View>
      </ScrollView>

      {isMoreOpen ? (
        <Pressable
          testID="archive-more-backdrop"
          accessibilityRole="button"
          accessibilityLabel="메뉴 닫기"
          onPress={() => setIsMoreOpen(false)}
          className="absolute inset-0"
        />
      ) : null}
    </View>
  );
}
