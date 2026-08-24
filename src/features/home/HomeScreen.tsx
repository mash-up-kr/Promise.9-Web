import {
  useQueryClient,
  useSuspenseQueries,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Folder } from "lucide-react-native";
import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from "react";
import { RefreshControl, View } from "react-native";
import Animated from "react-native-reanimated";

import { ActionButton } from "@/components/ui/action-button/ActionButton";
import { AsyncBoundary } from "@/components/ui/async-boundary/AsyncBoundary";
import { EmptyState } from "@/components/ui/empty-state/EmptyState";
import { useHeaderHeight } from "@/components/ui/header/Header";
import { useHeaderAwareScrollHandler } from "@/components/ui/header/useHeaderAwareScrollHandler";
import { Icon } from "@/components/ui/icon/Icon";
import { Illustration } from "@/components/ui/illustration/Illustration";
import { useSnackbar } from "@/components/ui/snackbar/SnackbarProvider";
import { snackbarPresets } from "@/components/ui/snackbar/snackbar.presets";
import { Text } from "@/components/ui/text/Text";
import { VStack } from "@/components/ui/vstack/VStack";

import { folderQueries } from "@/entities/folder/folder.queries";
import { linkQueries } from "@/entities/link/link.queries";

import { FolderSection } from "./components/FolderSection";
import { HomeSkeleton } from "./components/HomeSkeleton";
import { KeywordSection } from "./components/KeywordSection";
import { RecentSaveSection } from "./components/RecentSaveSection";
import { RemindSection } from "./components/RemindSection";
import {
  HOME_FOLDER_LINK_LIMIT,
  HOME_RECENT_LINK_LIMIT,
  selectFrequentFolders,
} from "./home.utils";

export function HomeScreen() {
  return (
    <AsyncBoundary
      pending={<HomeSkeleton />}
      fallback={({ reset }) => <HomeError onRetry={reset} />}
    >
      <HomeSections />
    </AsyncBoundary>
  );
}

function HomeSections() {
  const headerHeight = useHeaderHeight();
  const scrollHandler = useHeaderAwareScrollHandler("home");
  const { isRefreshing, refresh } = useHomeRefresh();

  const recentLinksQuery = useSuspenseQuery(
    linkQueries.list({
      sortBy: "savedAt",
      order: "desc",
      limit: HOME_RECENT_LINK_LIMIT,
    }),
  );
  // 보관함과 같은 GET /folders 캐시를 공유하고 select 만 홈용으로 바꾼다.
  const frequentFoldersQuery = useSuspenseQuery({
    ...folderQueries.list(),
    select: selectFrequentFolders,
  });
  const recentLinks = recentLinksQuery.data;
  const { folders: frequentFolders, hasAnyFolder } = frequentFoldersQuery.data;
  // 폴더 수만큼 병렬 조회 — 서버에 홈 전용 집계 API 가 없어 폴더별로 GET /links 를 부른다.
  const folderLinks = useSuspenseQueries({
    queries: frequentFolders.map((folder) =>
      linkQueries.list({
        folderId: folder.folderId,
        limit: HOME_FOLDER_LINK_LIMIT,
      }),
    ),
  });

  // 캐시가 있어 던지지 않은 실패는 여기서 받아 알린다(당겨서 새로고침·자동 재조회 공통).
  useOfflineSnackbar(
    [
      recentLinksQuery.error,
      frequentFoldersQuery.error,
      ...folderLinks.map((query) => query.error),
    ],
    refresh,
  );

  // 저장된 링크가 하나도 없으면 섹션을 하나도 그리지 않고 화면 전체를 안내로 채운다(시안).
  if (recentLinks.length === 0) {
    return (
      <HomeMessage>
        <EmptyState
          illustration={<Illustration name="empty-link" />}
          title="아직 저장된 링크가 없어요"
          description="링크를 저장하고 한곳에서 모아보세요"
        />
      </HomeMessage>
    );
  }

  return (
    <Animated.ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingTop: headerHeight }}
      showsVerticalScrollIndicator={false}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      testID="home-scroll"
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={refresh}
          // 헤더가 투명 오버레이라 스크롤뷰가 화면 최상단부터 시작한다. 오프셋을 주지 않으면
          // 스피너가 헤더 뒤에 가려서 안 보인다(콘텐츠에 paddingTop 을 주는 것과 같은 이유).
          progressViewOffset={headerHeight}
          // 다크 배경이라 기본(어두운) 스피너가 묻힌다. RefreshControl 은 className 을 받지 못해 raw hex.
          tintColor="#ffffff"
        />
      }
    >
      <VStack className="gap-12 pt-5 pb-8">
        {/* 서버 미제공 구간 — 리마인드는 GET /links 에 reminderAt 이 없고, 키워드는
            GET /recommendations 가 미머지다. 빈 배열이면 정책대로 섹션째 숨는다.
            데이터 소스가 생기면 여기만 쿼리로 교체한다(선정 정책은 home.utils). */}
        <RemindSection links={[]} />
        <KeywordSection keywords={[]} />
        <RecentSaveSection links={recentLinks} />
        {/* 폴더는 있는데 전부 비어 있으면 섹션째 숨긴다 — "아직 폴더가 없어요" 는 거짓이 되고,
            제목만 있는 빈 캐러셀도 시안에 없다(리뷰 피드백). */}
        {hasAnyFolder && frequentFolders.length === 0 ? null : (
          <VStack className="gap-4">
            <Text variant="heading-1" className="px-5 text-text-strong">
              자주 보는 폴더
            </Text>
            {frequentFolders.length === 0 ? (
              <EmptyFolderState />
            ) : (
              <VStack className="gap-10">
                {frequentFolders.map((folder, index) => (
                  <FolderSection
                    key={folder.folderId}
                    folder={folder}
                    links={folderLinks[index].data}
                  />
                ))}
              </VStack>
            )}
          </VStack>
        )}
      </VStack>
    </Animated.ScrollView>
  );
}

/**
 * 당겨서 새로고침 — 홈이 쓰는 링크 목록·폴더 목록을 한 번에 다시 불러온다.
 *
 * 실패해도 캐시가 있으면 화면은 그대로 두고(homeQueries 의 throwOnError 정책) 스낵바로만 알린다.
 */
function useHomeRefresh() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    // 실패는 쿼리 에러 상태로 남고 useOfflineSnackbar 가 알린다 — 여기서 따로 잡지 않는다.
    await Promise.all([
      queryClient.refetchQueries({ queryKey: linkQueries.keys.lists() }),
      queryClient.refetchQueries({ queryKey: folderQueries.keys.root() }),
    ]);
    setIsRefreshing(false);
  }, [queryClient]);

  return { isRefreshing, refresh };
}

/**
 * 캐시가 있어 에러 화면으로 던지지 않은 조회 실패를 스낵바로 알린다.
 *
 * 정책상 캐시가 있으면 화면은 그대로 두되 실패 사실은 알려야 한다. 알리지 않으면 사용자가
 * 낡은 데이터를 최신으로 오해한다. 재시도가 또 실패하면 새 Error 라 다시 뜬다.
 */
function useOfflineSnackbar(errors: (Error | null)[], onRetry: () => void) {
  const { show } = useSnackbar();
  const failure = errors.find(Boolean) ?? null;

  useEffect(() => {
    if (!failure) {
      return;
    }
    show(
      snackbarPresets.offline(
        "오프라인 상태예요. 연결 후 다시 시도해주세요.",
        onRetry,
      ),
    );
  }, [failure, show, onRetry]);
}

/** 헤더가 투명 오버레이라 전체 화면 안내는 헤더 높이만큼 내려서 가운데 정렬한다. */
function HomeMessage({ children }: PropsWithChildren) {
  const headerHeight = useHeaderHeight();

  return (
    <View
      className="flex-1 items-center justify-center"
      style={{ paddingTop: headerHeight }}
    >
      {children}
    </View>
  );
}

// 폴더 0개는 화면 전체가 아니라 이 섹션 자리만 대체한다 — 캐릭터 없이 아이콘만 쓴다(시안).
function EmptyFolderState() {
  const router = useRouter();

  return (
    <EmptyState
      size="section"
      illustration={
        <View className="size-20 items-center justify-center rounded-full bg-gray-800">
          <Icon iconNode={Folder} size={40} className="text-gray-400" />
        </View>
      }
      title="아직 폴더가 없어요"
      description="폴더를 만들고 링크를 정리해보세요"
      action={
        <ActionButton
          size="small"
          onPress={() => router.push("/create-folder")}
        >
          새 폴더 만들기
        </ActionButton>
      }
    />
  );
}

interface HomeErrorProps {
  onRetry: () => void;
}

function HomeError({ onRetry }: HomeErrorProps) {
  return (
    <HomeMessage>
      <EmptyState
        illustration={<Illustration name="error" />}
        title="일시적인 오류가 발생했어요"
        description="잠시 후 다시 시도해주세요"
        action={
          <ActionButton size="small" onPress={onRetry}>
            다시 불러오기
          </ActionButton>
        }
      />
    </HomeMessage>
  );
}
