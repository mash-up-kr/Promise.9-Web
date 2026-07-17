import { useSuspenseQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, View } from "react-native";

import { Header } from "@/components/ui/header/Header";
import { HeaderActions } from "@/components/ui/header/HeaderActions";
import { HeaderBackButton } from "@/components/ui/header/HeaderBackButton";
import { LinkTile } from "@/components/ui/link-card/LinkTile";
import { linkDetailHref } from "@/constants/routes.constants";

import { archiveQueries } from "./api/archive.queries";

export function ArchiveDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useSuspenseQuery(archiveQueries.folderDetail(id ?? "all"));

  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <Header
              left={<HeaderBackButton />}
              title={data.title}
              right={<HeaderActions />}
            />
          ),
        }}
      />
      <ScrollView
        className="flex-1 bg-background-base"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row flex-wrap justify-between gap-y-5 px-5 pt-2 pb-6">
          {data.links.map((link) => (
            <LinkTile
              key={link.linkId}
              link={link}
              onPress={() => router.push(linkDetailHref(String(link.linkId)))}
            />
          ))}
        </View>
      </ScrollView>
    </>
  );
}
