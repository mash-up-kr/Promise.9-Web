import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Animated from "react-native-reanimated";

import { Header, useHeaderHeight } from "@/components/ui/header/Header";
import { HeaderBackButton } from "@/components/ui/header/HeaderBackButton";
import { useHeaderAwareScrollHandler } from "@/components/ui/header/useHeaderAwareScrollHandler";
import { VStack } from "@/components/ui/vstack/VStack";
import { SearchBar } from "@/features/search/components/SearchBar";

import { LinkGrid } from "./components/LinkGrid";
import { RecentLinksSection } from "./components/RecentLinksSection";
import { RecentSearchesSection } from "./components/RecentSearchesSection";
import {
  RECENT_SEARCH_KEYWORDS,
  RECENT_VIEWED_LINKS,
  SEARCH_RESULT_LINKS,
} from "./mocks";
import { addRecentKeyword } from "./search.utils";

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
        contentContainerStyle={{ paddingTop: headerHeight }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {submittedQuery !== "" ? (
          <VStack className="px-5 pt-3.5 pb-8">
            <LinkGrid links={SEARCH_RESULT_LINKS} />
          </VStack>
        ) : (
          <VStack className="gap-12 px-5 pt-6 pb-8">
            <RecentSearchesSection
              keywords={recentKeywords}
              onPressKeyword={searchKeyword}
              onClearAll={() => setRecentKeywords([])}
            />
            <RecentLinksSection links={RECENT_VIEWED_LINKS} />
          </VStack>
        )}
      </Animated.ScrollView>
    </>
  );
}
