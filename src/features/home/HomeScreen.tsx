import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ScrollView, View } from "react-native";

import { ErrorBoundary } from "@/components/ui/error-boundary/ErrorBoundary";
import { useHeaderHeight } from "@/components/ui/header/Header";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { Text } from "@/components/ui/text/Text";
import { VStack } from "@/components/ui/vstack/VStack";

import { homeQueries } from "./api/home.queries";
import { FolderSection } from "./components/FolderSection";
import { RecentSaveSection } from "./components/RecentSaveSection";

function RecentSaveSectionContainer() {
  const { data } = useSuspenseQuery(homeQueries.recentLinks());
  return <RecentSaveSection links={data} />;
}

function FolderSections() {
  const { data } = useSuspenseQuery(homeQueries.folderSections());
  return (
    <VStack className="gap-10">
      {data.map(({ folder, links }) => (
        <FolderSection key={folder.folderId} folder={folder} links={links} />
      ))}
    </VStack>
  );
}

function SectionSkeleton() {
  return (
    <View className="px-5">
      <Skeleton className="h-40 w-full" />
    </View>
  );
}

function SectionError() {
  return (
    <Text variant="body-2" className="px-5 text-text-subtle">
      불러오지 못했어요.
    </Text>
  );
}

export function HomeScreen() {
  const headerHeight = useHeaderHeight();

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingTop: headerHeight }}
      showsVerticalScrollIndicator={false}
    >
      <VStack className="gap-12 pt-5 pb-8">
        <ErrorBoundary fallback={<SectionError />}>
          <Suspense fallback={<SectionSkeleton />}>
            <RecentSaveSectionContainer />
          </Suspense>
        </ErrorBoundary>
        <VStack className="gap-4">
          <Text variant="heading-1" className="px-5 text-text-strong">
            마지막으로 저장한 폴더 순
          </Text>
          <ErrorBoundary fallback={<SectionError />}>
            <Suspense fallback={<SectionSkeleton />}>
              <FolderSections />
            </Suspense>
          </ErrorBoundary>
        </VStack>
      </VStack>
    </ScrollView>
  );
}
