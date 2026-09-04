import { isHttpError, NetworkError } from "@shared/api";
import { linkQueries } from "@shared/entities/link/link.queries";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isString } from "es-toolkit";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useLayoutEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  Keyframe,
  LinearTransition,
} from "react-native-reanimated";
import { useDebounce } from "react-simplikit";
import { ActionButton } from "@/components/ui/action-button/ActionButton";
import { AsyncBoundary } from "@/components/ui/async-boundary/AsyncBoundary";
import { EmptyState } from "@/components/ui/empty-state/EmptyState";
import { Header, useHeaderHeight } from "@/components/ui/header/Header";
import { HeaderBackButton } from "@/components/ui/header/HeaderBackButton";
import { useHeaderAwareScrollHandler } from "@/components/ui/header/useHeaderAwareScrollHandler";
import { Illustration } from "@/components/ui/illustration/Illustration";
import { Spinner } from "@/components/ui/spinner/Spinner";
import { VStack } from "@/components/ui/vstack/VStack";
import { SearchBar } from "@/features/search/components/SearchBar";

import { LinkGrid } from "./components/LinkGrid";
import { RecentLinksSection } from "./components/RecentLinksSection";
import { RecentSearchesSection } from "./components/RecentSearchesSection";
import { RECENT_SEARCH_KEYWORDS } from "./mocks";
import { SEARCH_DEBOUNCE_MS, SEARCH_POLICY } from "./search.constants";
import { addRecentKeyword } from "./search.utils";

// 시안 모션 — 기본↔결과 크로스페이드, 로딩 후 결과 페이드인.
const CONTENT_FADE_MS = 280;
const RESULT_FADE_IN_MS = 200;

// 시안 "모두 지우기": 최근 검색어는 위로 32 뜨며 사라지고, 최근 본 링크가 그 자리로 따라
// 올라온다. 데이터는 탭 즉시 비운다 — 제거를 연출 타이머로 미루면 그 사이 실행된 검색이
// 삭제에 덮여 유실된다. 연출은 언마운트 exiting 과 layout transition 이 따라온다.
const CLEAR_MS = 300;
const CLEAR_RECENT_RISE = -32;
const CLEAR_MOVE_EASING = Easing.bezier(0.4, 0, 0.2, 1);
const clearRecentExiting = new Keyframe({
  from: { opacity: 1, transform: [{ translateY: 0 }] },
  to: {
    opacity: 0,
    transform: [{ translateY: CLEAR_RECENT_RISE }],
    easing: CLEAR_MOVE_EASING,
  },
}).duration(CLEAR_MS);
const clearLinksLayout =
  LinearTransition.duration(CLEAR_MS).easing(CLEAR_MOVE_EASING);

interface SearchFormValues {
  keyword: string;
}

export function SearchScreen() {
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const scrollHandler = useHeaderAwareScrollHandler("search");
  const { q } = useLocalSearchParams<{ q?: string }>();
  // 커밋된 검색어는 URL 이 단일 진실원 — 새로고침·딥링크에도 결과 상태가 복원된다
  const submittedQuery = isString(q) ? q : "";
  const [recentKeywords, setRecentKeywords] = useState(RECENT_SEARCH_KEYWORDS);

  const { control, setValue, subscribe } = useForm<SearchFormValues>({
    defaultValues: { keyword: submittedQuery },
  });

  const debouncedCommit = useDebounce(
    (value: string) => router.setParams({ q: value }),
    SEARCH_DEBOUNCE_MS,
  );

  // 타이핑이 멈추면 자동 검색, 입력을 지우면(클리어 버튼 포함) 즉시 기본 화면으로 복귀.
  // useWatch 로 구독하면 키 입력마다 화면 전체가 리렌더된다 — 리렌더 없는 subscribe 를 쓴다.
  useEffect(() => {
    return subscribe({
      name: "keyword",
      formState: { values: true },
      callback: ({ values }) => {
        const trimmed = (values.keyword ?? "").trim();
        if (trimmed === submittedQuery) {
          debouncedCommit.cancel();
          return;
        }
        if (trimmed === "") {
          debouncedCommit.cancel();
          router.setParams({ q: undefined });
          return;
        }
        debouncedCommit(trimmed);
      },
    });
  }, [subscribe, submittedQuery, debouncedCommit, router]);

  // 즉시 실행(제출·칩)만 최근 검색어에 저장한다.
  function executeSearch(value: string) {
    const trimmed = value.trim();
    if (trimmed === "") {
      return;
    }
    debouncedCommit.cancel();
    router.setParams({ q: trimmed });
    setRecentKeywords((keywords) => addRecentKeyword(keywords, trimmed));
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
                      onChangeText={onChange}
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
  // exiting 은 언마운트 원인을 구분하지 못해 상시 부여하면 검색 커밋 크로스페이드에서도
  // 발화한다(웹에서 사라짐이 두 번 보임) — "모두 지우기" 커밋에만 붙이고, 페인트 전
  // layout effect 에서 곧바로 삭제 커밋을 이어 중간 프레임·레이스 창 없이 제거한다.
  const [isClearing, setIsClearing] = useState(false);
  useLayoutEffect(() => {
    if (!isClearing) {
      return;
    }
    onClearKeywords();
    setIsClearing(false);
  }, [isClearing, onClearKeywords]);

  return (
    <VStack className="gap-12 px-5 pt-6 pb-8">
      {/* 빈 래퍼가 남으면 gap-12 슬롯이 위 여백으로 남는다 — 검색어가 없으면 래퍼째 뺀다. */}
      {keywords.length > 0 && (
        <Animated.View exiting={isClearing ? clearRecentExiting : undefined}>
          <RecentSearchesSection
            keywords={keywords}
            onPressKeyword={onPressKeyword}
            onClearAll={() => setIsClearing(true)}
          />
        </Animated.View>
      )}
      {/* 최근 본 링크는 부가 섹션 — 조회 실패로 화면 전체를 막지 않고 조용히 숨긴다. */}
      <Animated.View layout={clearLinksLayout}>
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
      <View className="flex-1 justify-center">
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
    <View className="flex-1 justify-center">
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
