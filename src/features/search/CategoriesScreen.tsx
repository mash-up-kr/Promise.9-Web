import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Search } from "lucide-react-native";
import { ScrollView } from "react-native";

import { Header } from "@/components/ui/header/Header";
import { HeaderBackButton } from "@/components/ui/header/HeaderBackButton";
import { IconButton } from "@/components/ui/icon-button/IconButton";
import { VStack } from "@/components/ui/vstack/VStack";
import { ROUTES } from "@/constants/routes.constants";

import { CategoryTabBar } from "./components/CategoryTabBar";
import { LinkGrid } from "./components/LinkGrid";
import { CATEGORY_LINKS } from "./mocks";
import { CATEGORY_TABS, type CategoryTab } from "./search.constants";

function isCategoryTab(value: string | undefined): value is CategoryTab {
  return CATEGORY_TABS.includes(value as CategoryTab);
}

export function CategoriesScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const selected: CategoryTab = isCategoryTab(category) ? category : "전체";

  // 선택 탭을 URL 에 반영해 새로고침·딥링크 시에도 유지한다. '전체' 는 기본값이라 param 을 비운다.
  const handleSelectTab = (tab: CategoryTab) => {
    router.setParams({ category: tab === "전체" ? undefined : tab });
  };

  const links =
    selected === "전체"
      ? CATEGORY_LINKS
      : CATEGORY_LINKS.filter(
          (link) => link.representativeTag?.name === selected,
        );

  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <Header
              variant="dim"
              left={<HeaderBackButton />}
              title="카테고리"
              right={
                <IconButton
                  iconNode={Search}
                  accessibilityLabel="검색"
                  // 검색에서 진입한 경우 스택 중복 없이 기존 검색 화면으로 복귀 (navigate)
                  onPress={() => router.navigate(ROUTES.SEARCH)}
                />
              }
            />
          ),
        }}
      />
      <VStack className="flex-1 bg-background-base">
        <CategoryTabBar selected={selected} onSelect={handleSelectTab} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <VStack className="px-5 pt-3 pb-8">
            <LinkGrid links={links} />
          </VStack>
        </ScrollView>
      </VStack>
    </>
  );
}
