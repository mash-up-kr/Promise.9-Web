import { isHttpError, NetworkError } from "@shared/api";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { ActionButton } from "@/components/ui/action-button/ActionButton";
import { AsyncBoundary } from "@/components/ui/async-boundary/AsyncBoundary";
import { EmptyState } from "@/components/ui/empty-state/EmptyState";
import { Header, useHeaderHeight } from "@/components/ui/header/Header";
import { HeaderBackButton } from "@/components/ui/header/HeaderBackButton";
import { useHeaderAwareScrollHandler } from "@/components/ui/header/useHeaderAwareScrollHandler";
import { Illustration } from "@/components/ui/illustration/Illustration";
import { Spinner } from "@/components/ui/spinner/Spinner";
import { VStack } from "@/components/ui/vstack/VStack";
import { linkQueries } from "@/entities/link/link.queries";
import { SearchBar } from "@/features/search/components/SearchBar";

import { LinkGrid } from "./components/LinkGrid";
import { RecentLinksSection } from "./components/RecentLinksSection";
import { RecentSearchesSection } from "./components/RecentSearchesSection";
import { RECENT_SEARCH_KEYWORDS } from "./mocks";
import { SEARCH_POLICY } from "./search.constants";
import { addRecentKeyword } from "./search.utils";

// Figma "Empty State": 콘텐츠 상단에서 155 아래 (보관함 EmptyLinks 와 동일).
const STATE_TOP_OFFSET = 155;

// 시안 모션 — 기본↔결과 크로스페이드, 로딩 후 결과 페이드인.
const CONTENT_FADE_MS = 280;
const RESULT_FADE_IN_MS = 200;

// 시안 "모두 지우기": 최근 검색어는 위로 32 뜨며 사라지고, 최근 본 링크가 그 자리(높이+48)로
// 따라 올라온 뒤 320ms 시점에 트리에서 제거하며 transform 을 리셋한다.
// height·margin 트랜지션은 레이아웃 재계산 jank 때문에 쓰지 않는다(시안 명시).
const CLEAR_MS = 300;
const CLEAR_REMOVE_AT_MS = 320;
const CLEAR_RECENT_RISE = -32;
const CLEAR_SECTION_GAP = 48;
const CLEAR_MOVE_EASING = Easing.bezier(0.4, 0, 0.2, 1);

interface SearchFormValues {
  keyword: string;
}

export function SearchScreen() {
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const scrollHandler = useHeaderAwareScrollHandler("search");
  const { q } = useLocalSearchParams<{ q?: string }>();
  // 커밋된 검색어는 URL 이 단일 진실원 — 새로고침·딥링크에도 결과 상태가 복원된다
  const submittedQuery = typeof q === "string" ? q : "";
  const [recentKeywords, setRecentKeywords] = useState(RECENT_SEARCH_KEYWORDS);

  const { control, setValue } = useForm<SearchFormValues>({
    defaultValues: { keyword: submittedQuery },
  });

  // 시안 정책: 입력 중 실시간 조회 없음 — 검색은 실행(제출·칩) 시점에만 일어난다.
  function executeSearch(value: string) {
    const trimmed = value.trim();
    if (trimmed === "") {
      return;
    }
    router.setParams({ q: trimmed });
    setRecentKeywords((keywords) => addRecentKeyword(keywords, trimmed));
  }

  // 텍스트를 지우면(클리어 버튼 포함) 즉시 기본 화면으로 돌아간다(시안 Filled → Focused).
  function resetSearch() {
    router.setParams({ q: undefined });
  }

  function searchKeyword(value: string) {
    setValue("keyword", value);
    executeSearch(value);
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTransparent: true,
          // Android 에서 ScrollView 의 bg 클래스가 이 라우트에선 칠해지지 않아 흰 배경이
          // 드러난다 — 탭 sceneStyle 과 같은 방식으로 씬을 직접 칠한다(raw hex, 신규 base).
          contentStyle: { backgroundColor: "#1a1a1a" },
          header: () => (
            <Header
              scrollScope="search"
              left={<HeaderBackButton />}
              title={
                <Controller
                  control={control}
                  name="keyword"
                  render={({ field: { value, onChange } }) => (
                    <SearchBar
                      // 검색 화면 진입 즉시 입력 가능하도록 자동 포커스
                      autoFocus
                      value={value}
                      onChangeText={(text) => {
                        onChange(text);
                        if (text.trim() === "") {
                          resetSearch();
                        }
                      }}
                      onSubmitEditing={() => executeSearch(value)}
                    />
                  )}
                />
              }
            />
          ),
        }}
      />
      <Animated.ScrollView
        className="flex-1 bg-background-base"
        contentContainerStyle={{ paddingTop: headerHeight, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {submittedQuery !== "" ? (
          <Animated.View
            key="results"
            className="flex-1"
            entering={FadeIn.duration(CONTENT_FADE_MS)}
            exiting={FadeOut.duration(CONTENT_FADE_MS)}
          >
            <SearchResults query={submittedQuery} />
          </Animated.View>
        ) : (
          <Animated.View
            key="default"
            entering={FadeIn.duration(CONTENT_FADE_MS)}
            exiting={FadeOut.duration(CONTENT_FADE_MS)}
          >
            <SearchDefaultContent
              keywords={recentKeywords}
              onPressKeyword={searchKeyword}
              onClearKeywords={() => setRecentKeywords([])}
            />
          </Animated.View>
        )}
      </Animated.ScrollView>
    </>
  );
}

interface SearchDefaultContentProps {
  keywords: string[];
  onPressKeyword: (keyword: string) => void;
  onClearKeywords: () => void;
}

function SearchDefaultContent({
  keywords,
  onPressKeyword,
  onClearKeywords,
}: SearchDefaultContentProps) {
  // 이동 거리는 칩 줄 수에 따라 달라져 런타임에 잰다(시안 명시).
  const recentHeight = useSharedValue(0);
  const clearProgress = useSharedValue(0);
  const fadeProgress = useSharedValue(0);

  const recentStyle = useAnimatedStyle(() => ({
    opacity: 1 - fadeProgress.value,
    transform: [{ translateY: CLEAR_RECENT_RISE * clearProgress.value }],
  }));
  const linksStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY:
          -(recentHeight.value + CLEAR_SECTION_GAP) * clearProgress.value,
      },
    ],
  }));

  function handleClearAll() {
    // transform 만 시안 지정 베지어, opacity 는 기본 이징(시안 구분).
    clearProgress.value = withTiming(1, {
      duration: CLEAR_MS,
      easing: CLEAR_MOVE_EASING,
    });
    fadeProgress.value = withTiming(1, { duration: CLEAR_MS });
    setTimeout(() => {
      onClearKeywords();
      // 섹션이 트리에서 빠지면 아래 섹션이 제자리가 되므로 transform 을 리셋한다.
      clearProgress.value = 0;
      fadeProgress.value = 0;
    }, CLEAR_REMOVE_AT_MS);
  }

  return (
    <VStack className="gap-12 px-5 pt-6 pb-8">
      {/* 빈 래퍼가 남으면 gap-12 슬롯이 위 여백으로 남는다 — 검색어가 없으면 래퍼째 뺀다. */}
      {keywords.length > 0 && (
        <Animated.View
          style={recentStyle}
          onLayout={(event) => {
            recentHeight.value = event.nativeEvent.layout.height;
          }}
        >
          <RecentSearchesSection
            keywords={keywords}
            onPressKeyword={onPressKeyword}
            onClearAll={handleClearAll}
          />
        </Animated.View>
      )}
      {/* 최근 본 링크는 부가 섹션 — 조회 실패로 화면 전체를 막지 않고 조용히 숨긴다. */}
      <Animated.View style={linksStyle}>
        <AsyncBoundary pending={null} fallback={null}>
          <RecentViewedLinks />
        </AsyncBoundary>
      </Animated.View>
    </VStack>
  );
}

function RecentViewedLinks() {
  const { data: links } = useSuspenseQuery(
    linkQueries.list({
      sortBy: "viewedAt",
      order: "desc",
      limit: SEARCH_POLICY.recentLinks.max,
    }),
  );

  return <RecentLinksSection links={links} />;
}

interface SearchResultsProps {
  query: string;
}

function SearchResults({ query }: SearchResultsProps) {
  return (
    <AsyncBoundary
      pending={<ResultsPending />}
      fallback={({ error, reset }) => (
        <ResultsError error={error} onRetry={reset} />
      )}
      // 검색어가 바뀌면 이전 검색의 에러 상태를 걷어내고 새로 조회한다.
      resetKeys={[query]}
    >
      <ResultsGrid query={query} />
    </AsyncBoundary>
  );
}

function ResultsGrid({ query }: SearchResultsProps) {
  const { data: links } = useSuspenseQuery(linkQueries.list({ q: query }));

  if (links.length === 0) {
    return (
      <View style={{ paddingTop: STATE_TOP_OFFSET }}>
        <EmptyState
          illustration={<Illustration name="empty-link" />}
          title={`"${query}"에 대한 결과가 없어요`}
          description="다른 키워드로 검색해보세요"
        />
      </View>
    );
  }

  return (
    // 시안: 로딩이 걷히면 결과 그리드가 짧게 페이드인한다.
    <Animated.View entering={FadeIn.duration(RESULT_FADE_IN_MS)}>
      <VStack className="px-5 pt-3.5 pb-8">
        <LinkGrid links={links} />
      </VStack>
    </Animated.View>
  );
}

function ResultsPending() {
  return (
    <View className="flex-1 items-center justify-center">
      <Spinner size="large" tone="on-dark" />
    </View>
  );
}

interface ResultsErrorProps {
  error: unknown;
  onRetry: () => void;
}

// 오프라인(NetworkError)과 그 밖의 실패는 문구·그림이 다르다(시안 search/offline · search/error).
function ResultsError({ error, onRetry }: ResultsErrorProps) {
  const isOffline = isHttpError(error) && error instanceof NetworkError;

  return (
    <View style={{ paddingTop: STATE_TOP_OFFSET }}>
      <EmptyState
        illustration={<Illustration name={isOffline ? "offline" : "error"} />}
        title={
          isOffline
            ? "인터넷 연결을 확인해주세요"
            : "일시적인 오류가 발생했어요"
        }
        description={
          isOffline ? "연결 후 다시 시도해보세요" : "잠시 후 다시 시도해주세요"
        }
        action={
          <ActionButton size="small" onPress={onRetry}>
            다시 불러오기
          </ActionButton>
        }
      />
    </View>
  );
}
