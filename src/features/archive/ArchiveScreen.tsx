import type { Folder } from "@shared/types/folder";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { FolderGroup } from "./components/FolderGroup";
import { FolderItem } from "./components/FolderItem";
import { FolderSection } from "./components/FolderSection";

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

  const handleOpenFolder = (id: string) => {
    setSelectedId(id);
    router.push({ pathname: "/archive/[id]", params: { id } });
  };

  const handleAddFolder = () => {
    // TODO: 폴더 추가 플로우 (후속 작업)
  };

  return (
    <View className="flex-1 bg-background-base">
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
    </View>
  );
}
