import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView } from "react-native";
import { useDebounce } from "react-simplikit";

import { Header, useHeaderHeight } from "@/components/ui/header/Header";
import { HeaderBackButton } from "@/components/ui/header/HeaderBackButton";
import { VStack } from "@/components/ui/vstack/VStack";
import { SearchBar } from "@/features/search/components/SearchBar";

import { CategorySection } from "./components/CategorySection";
import { LinkGrid } from "./components/LinkGrid";
import { RecentLinksSection } from "./components/RecentLinksSection";
import { RecentSearchesSection } from "./components/RecentSearchesSection";
import {
  RECENT_SEARCH_KEYWORDS,
  RECENT_VIEWED_LINKS,
  SEARCH_RESULT_LINKS,
} from "./mocks";
import { type Category, SEARCH_DEBOUNCE_MS } from "./search.constants";

interface SearchFormValues {
  keyword: string;
}

export function SearchScreen() {
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const { q } = useLocalSearchParams<{ q?: string }>();
  // 커밋된 검색어는 URL 이 단일 진실원 — 새로고침·딥링크에도 결과 상태가 복원된다
  const submittedQuery = typeof q === "string" ? q : "";
  const [recentKeywords, setRecentKeywords] = useState(RECENT_SEARCH_KEYWORDS);

  const { control, setValue } = useForm<SearchFormValues>({
    defaultValues: { keyword: submittedQuery },
  });

  function commitSearch(value: string) {
    const trimmed = value.trim();
    router.setParams({ q: trimmed === "" ? undefined : trimmed });
  }

  // 타이핑이 멈추면 자동 검색. 즉시 커밋(제출·칩)은 cancel 로 예약된 커밋을 걷어낸다.
  const debouncedCommit = useDebounce(commitSearch, SEARCH_DEBOUNCE_MS);

  function commitSearchNow(value: string) {
    debouncedCommit.cancel();
    commitSearch(value);
  }

  function searchKeyword(value: string) {
    setValue("keyword", value);
    commitSearchNow(value);
  }

  function moveToCategories(category?: Category) {
    if (category) {
      router.push({ pathname: "/search/categories", params: { category } });
      return;
    }
    router.push({ pathname: "/search/categories" });
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTransparent: true,
          header: () => (
            <Header
              variant="dim"
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
                        debouncedCommit(text);
                      }}
                      onSubmitEditing={() => commitSearchNow(value)}
                    />
                  )}
                />
              }
            />
          ),
        }}
      />
      <ScrollView
        className="flex-1 bg-background-base"
        contentContainerStyle={{ paddingTop: headerHeight }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
            <CategorySection
              onPressCategory={moveToCategories}
              onPressMore={moveToCategories}
            />
            <RecentLinksSection links={RECENT_VIEWED_LINKS} />
          </VStack>
        )}
      </ScrollView>
    </>
  );
}
