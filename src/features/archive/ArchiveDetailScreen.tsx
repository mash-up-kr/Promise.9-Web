import { useSuspenseQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";

import { AsyncBoundary } from "@/components/ui/async-boundary/AsyncBoundary";
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

// 화면 가운데 안내 문구 — 없음·빈 목록·에러 상태가 공유한다.
function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-old-background-base px-5">
      {children}
    </View>
  );
}

export function ArchiveDetailScreen() {
  const { id, name } = useLocalSearchParams<{ id?: string; name?: string }>();

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
      <ArchiveDetailBody id={id} />
    </>
  );
}

function ArchiveDetailBody({ id }: { id?: string }) {
  // 잘못된 id 는 조회 이전 분기라 경계 밖에 남는다 — useSuspenseQuery 는 끌 수 없어서
  // 여기서 막지 않으면 NaN 파라미터가 서버로 새어나간다.
  if (!isFolderRouteId(id)) {
    return (
      <CenteredMessage>
        <Text variant="body-2-normal" className="text-text-alternative">
          폴더를 찾을 수 없어요.
        </Text>
      </CenteredMessage>
    );
  }

  return (
    <AsyncBoundary
      resetKeys={[id]}
      pending={
        <View className="flex-1 items-center justify-center bg-old-background-base">
          <ActivityIndicator testID="archive-detail-loading" />
        </View>
      }
      fallback={({ reset }) => (
        <CenteredMessage>
          <Text variant="body-2-normal" className="text-text-alternative">
            링크를 불러오지 못했어요.
          </Text>
          <Pressable accessibilityRole="button" onPress={reset}>
            <Text variant="label-1" className="text-old-icon-accent">
              다시 시도
            </Text>
          </Pressable>
        </CenteredMessage>
      )}
    >
      <ArchiveDetailContent folderId={id} />
    </AsyncBoundary>
  );
}

function ArchiveDetailContent({ folderId }: { folderId: string }) {
  const router = useRouter();
  const { data: links } = useSuspenseQuery(folderLinkQueries.list(folderId));

  if (links.length === 0) {
    return (
      <CenteredMessage>
        <Text variant="body-2-normal" className="text-text-alternative">
          아직 저장된 링크가 없어요.
        </Text>
      </CenteredMessage>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-old-background-base"
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
  );
}
