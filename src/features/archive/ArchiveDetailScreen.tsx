import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";

import { Header } from "@/components/ui/header/Header";
import { HeaderActions } from "@/components/ui/header/HeaderActions";
import { HeaderBackButton } from "@/components/ui/header/HeaderBackButton";
import { LinkTile } from "@/components/ui/link-card/LinkTile";
import { Text } from "@/components/ui/text/Text";
import { linkDetailHref } from "@/constants/routes.constants";

import { folderLinkQueries, isFolderRouteId } from "./api/folder-links.queries";
import { SYSTEM_FOLDERS } from "./archive.constants";

// 헤더 타이틀 — 이동 시 넘어온 폴더명을 우선 쓰고, 없으면 시스템 폴더명으로 폴백한다.
function resolveTitle(id: string | undefined, name?: string): string {
  if (name) return name;
  return SYSTEM_FOLDERS.find((folder) => folder.id === id)?.name ?? "";
}

export function ArchiveDetailScreen() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id?: string; name?: string }>();
  // 잘못된 id 로는 조회 자체를 막는다(NaN 파라미터 방지).
  const isKnownFolder = isFolderRouteId(id);
  const { data, isPending, isError, refetch } = useQuery({
    ...folderLinkQueries.list(id ?? ""),
    enabled: isKnownFolder,
  });
  const links = data ?? [];

  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <Header
              left={<HeaderBackButton />}
              title={resolveTitle(id, name)}
              right={<HeaderActions />}
            />
          ),
        }}
      />
      {!isKnownFolder ? (
        <View className="flex-1 items-center justify-center bg-background-base px-5">
          <Text variant="body-2-normal" className="text-text-alternative">
            폴더를 찾을 수 없어요.
          </Text>
        </View>
      ) : isPending ? (
        <View className="flex-1 items-center justify-center bg-background-base">
          <ActivityIndicator testID="archive-detail-loading" />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center gap-3 bg-background-base px-5">
          <Text variant="body-2-normal" className="text-text-alternative">
            링크를 불러오지 못했어요.
          </Text>
          <Pressable accessibilityRole="button" onPress={() => refetch()}>
            <Text variant="label-1" className="text-icon-accent">
              다시 시도
            </Text>
          </Pressable>
        </View>
      ) : links.length === 0 ? (
        <View className="flex-1 items-center justify-center bg-background-base px-5">
          <Text variant="body-2-normal" className="text-text-alternative">
            아직 저장된 링크가 없어요.
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 bg-background-base"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row flex-wrap justify-between gap-y-5 px-5 pt-2 pb-6">
            {links.map((link) => (
              <LinkTile
                key={link.linkId}
                link={link}
                onPress={() => router.push(linkDetailHref(String(link.linkId)))}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </>
  );
}
