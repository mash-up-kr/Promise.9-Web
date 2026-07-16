import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView } from "react-native";

import { Header } from "@/components/ui/header/Header";
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
import type { Category } from "./search.constants";

export function SearchScreen() {
  const router = useRouter();
  const [recentKeywords, setRecentKeywords] = useState(RECENT_SEARCH_KEYWORDS);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  const isSearching = submittedQuery !== "";

  function handleChangeQuery(text: string) {
    setQuery(text);
    // 검색어를 모두 지우면 결과를 닫고 초기 화면으로 돌아간다
    if (text.trim() === "") {
      setSubmittedQuery("");
    }
  }

  function handleSubmit() {
    const trimmed = query.trim();
    if (trimmed === "") {
      return;
    }
    setSubmittedQuery(trimmed);
  }

  function searchKeyword(keyword: string) {
    setQuery(keyword);
    setSubmittedQuery(keyword);
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
          header: () => (
            <Header
              left={<HeaderBackButton />}
              title={
                <SearchBar
                  // 검색 화면 진입 즉시 입력 가능하도록 자동 포커스
                  autoFocus
                  value={query}
                  onChangeText={handleChangeQuery}
                  onSubmitEditing={handleSubmit}
                />
              }
            />
          ),
        }}
      />
      <ScrollView
        className="flex-1 bg-background-base"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isSearching ? (
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
