import { useRouter } from "expo-router";
import { Search } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import Animated, {
  useAnimatedRef,
  useScrollOffset,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Header } from "@/components/ui/header/Header";
import { IconButton } from "@/components/ui/icon-button/IconButton";
import { Text } from "@/components/ui/text/Text";

import type { ArchiveFolder } from "./archive.types";
import { ArchiveMoreMenu } from "./components/ArchiveMoreMenu";
import { FolderGroup } from "./components/FolderGroup";
import { FolderItem } from "./components/FolderItem";
import { FolderSection } from "./components/FolderSection";
import { NewFolderButton } from "./components/NewFolderButton";
import { SortableFolderList } from "./components/SortableFolderList";

// 폴더 API 는 아직 없어 정적 데이터로 구성한다. react-query 연동은 후속 작업.
// 최근 삭제된 링크는 Figma 상 "기본 폴더" 섹션에 속한다.
const BASIC_FOLDERS: ArchiveFolder[] = [
  { id: "all", name: "전체", count: 370, tone: "gray" },
  { id: "uncategorized", name: "미분류", count: 370, tone: "gray" },
  { id: "favorites", name: "즐겨찾기", count: 370, tone: "gray" },
  { id: "trash", name: "최근 삭제된 링크", count: 370, tone: "gray" },
];

const MY_FOLDERS: ArchiveFolder[] = [
  { id: "design", name: "디자인", count: 370, tone: "blue" },
  { id: "ai", name: "AI", count: 370, tone: "blue" },
  { id: "dev", name: "개발", count: 370, tone: "blue" },
  { id: "later-1", name: "나중에 갈 곳", count: 370, tone: "blue" },
];

export function ArchiveScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // 하단 플로팅 탭바(pill 높이 60 + safe-area 여백)에 가리지 않도록 스크롤 하단 여백을 준다.
  const listBottomPadding = Math.max(insets.bottom, 20) + 60 + 16;
  const [selectedId, setSelectedId] = useState<string>("ai");
  const [myFolders, setMyFolders] = useState<ArchiveFolder[]>(MY_FOLDERS);
  const [isReordering, setIsReordering] = useState(false);
  // 드래그 중에는 바깥 ScrollView 스크롤을 끄고, 자동 스크롤(scrollTo)만 동작시킨다.
  const [isDragging, setIsDragging] = useState(false);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollOffset(scrollRef);
  const scrollContentHeight = useSharedValue(0);

  const handleOpenFolder = (id: string) => {
    setSelectedId(id);
    router.push({ pathname: "/archive/[id]", params: { id } });
  };

  const handleAddFolder = () => {
    router.push("/create-folder");
  };

  const handleReorder = (next: ArchiveFolder[]) => {
    setMyFolders(next);
  };

  // 기본 폴더 섹션 — 편집 모드에선 읽기 전용(탭 비활성)으로 헤더에 재사용한다.
  const basicSection = (
    <FolderSection title="기본 폴더">
      <FolderGroup>
        {BASIC_FOLDERS.map((folder) => (
          <FolderItem
            key={folder.id}
            name={folder.name}
            count={folder.count}
            tone={folder.tone}
            selected={selectedId === folder.id}
            onPress={
              isReordering ? undefined : () => handleOpenFolder(folder.id)
            }
          />
        ))}
      </FolderGroup>
    </FolderSection>
  );

  const headerRight = isReordering ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="완료"
      onPress={() => setIsReordering(false)}
    >
      <Text variant="label-1" className="text-icon-accent">
        완료
      </Text>
    </Pressable>
  ) : (
    <>
      <IconButton
        iconNode={Search}
        accessibilityLabel="검색"
        onPress={() => router.navigate("/search")}
      />
      <ArchiveMoreMenu
        onCreateFolder={handleAddFolder}
        onEditOrder={() => setIsReordering(true)}
      />
    </>
  );

  return (
    <View className="flex-1 bg-background-base">
      <Header title="보관함" right={headerRight} />

      {isReordering ? (
        <Animated.ScrollView
          ref={scrollRef}
          scrollEnabled={!isDragging}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={(_width, height) => {
            scrollContentHeight.value = height;
          }}
        >
          <View
            className="gap-12 pt-5"
            style={{ paddingBottom: listBottomPadding }}
          >
            {basicSection}
            <FolderSection
              title="내 폴더"
              action={{ label: "폴더 추가", onPress: handleAddFolder }}
            >
              <SortableFolderList
                folders={myFolders}
                onReorder={handleReorder}
                scrollRef={scrollRef}
                scrollOffset={scrollOffset}
                scrollContentHeight={scrollContentHeight}
                onDraggingChange={setIsDragging}
              />
            </FolderSection>
          </View>
        </Animated.ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View
            className="gap-12 pt-5"
            style={{ paddingBottom: listBottomPadding }}
          >
            {basicSection}

            <FolderSection
              title="내 폴더"
              action={
                myFolders.length > 0
                  ? { label: "폴더 추가", onPress: handleAddFolder }
                  : undefined
              }
            >
              {myFolders.length > 0 ? (
                <FolderGroup>
                  {myFolders.map((folder) => (
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
              ) : (
                <NewFolderButton onPress={handleAddFolder} />
              )}
            </FolderSection>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
