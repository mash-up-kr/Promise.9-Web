import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Search } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import Animated, {
  useAnimatedRef,
  useScrollOffset,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Header } from "@/components/ui/header/Header";
import { IconButton } from "@/components/ui/icon-button/IconButton";
import { Text } from "@/components/ui/text/Text";

import { folderQueries } from "./api/folder.queries";
import type { ArchiveFolder } from "./archive.types";
import { ArchiveMoreMenu } from "./components/ArchiveMoreMenu";
import { FolderGroup } from "./components/FolderGroup";
import { FolderItem } from "./components/FolderItem";
import { FolderSection } from "./components/FolderSection";
import { NewFolderButton } from "./components/NewFolderButton";
import { SortableFolderList } from "./components/SortableFolderList";

export function ArchiveScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // 하단 플로팅 탭바(pill 높이 60 + safe-area 여백)에 가리지 않도록 스크롤 하단 여백을 준다.
  const listBottomPadding = Math.max(insets.bottom, 20) + 60 + 16;

  const { data, isPending, isError, refetch } = useQuery(folderQueries.list());
  const systemFolders = data?.systemFolders ?? [];

  const [selectedId, setSelectedId] = useState<string>("");
  // 재정렬은 서버 저장 API 가 없어 로컬 전용이다. 서버 순서를 시드로 두고, 새로고침 시 서버 순서로 되돌린다.
  const [myFolders, setMyFolders] = useState<ArchiveFolder[]>([]);
  useEffect(() => {
    if (data?.myFolders) setMyFolders(data.myFolders);
  }, [data?.myFolders]);
  const [isReordering, setIsReordering] = useState(false);
  // 드래그 중에는 바깥 ScrollView 스크롤을 끄고, 자동 스크롤(scrollTo)만 동작시킨다.
  const [isDragging, setIsDragging] = useState(false);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollOffset(scrollRef);
  const scrollContentHeight = useSharedValue(0);

  const handleOpenFolder = (id: string, name: string) => {
    setSelectedId(id);
    // 상세 헤더 타이틀로 쓰도록 폴더명도 함께 넘긴다.
    router.push({ pathname: "/archive/[id]", params: { id, name } });
  };

  const handleAddFolder = () => {
    router.push("/create-folder");
  };

  // 드래그 제스처가 매 렌더마다 재생성되지 않도록 안정된 참조로 유지한다
  // (SortableFolderItem 의 gesture useMemo 가 이 콜백에 의존한다).
  const handleReorder = useCallback((next: ArchiveFolder[]) => {
    setMyFolders(next);
  }, []);

  // 기본 폴더 섹션 — 편집 모드에선 읽기 전용(탭 비활성)으로 헤더에 재사용한다.
  const basicSection = (
    <FolderSection title="기본 폴더">
      <FolderGroup>
        {systemFolders.map((folder) => (
          <FolderItem
            key={folder.id}
            name={folder.name}
            count={folder.count}
            tone={folder.tone}
            selected={selectedId === folder.id}
            onPress={
              isReordering
                ? undefined
                : () => handleOpenFolder(folder.id, folder.name)
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

      {isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator testID="archive-loading" />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center gap-3 px-5">
          <Text variant="body-2-normal" className="text-text-alternative">
            폴더를 불러오지 못했어요.
          </Text>
          <Pressable accessibilityRole="button" onPress={() => refetch()}>
            <Text variant="label-1" className="text-icon-accent">
              다시 시도
            </Text>
          </Pressable>
        </View>
      ) : isReordering ? (
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
                      onPress={() => handleOpenFolder(folder.id, folder.name)}
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
