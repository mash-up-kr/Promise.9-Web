import { ScrollView } from "react-native";

import { Text } from "@/components/ui/text/Text";
import { VStack } from "@/components/ui/vstack/VStack";

import { FolderSection } from "./components/FolderSection";
import { RecentSaveSection } from "./components/RecentSaveSection";
import { HOME_FOLDER_SECTIONS, HOME_RECENT_LINKS } from "./mocks";

export function HomeScreen() {
  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <VStack className="gap-12 pt-5 pb-8">
        <RecentSaveSection links={HOME_RECENT_LINKS} />
        <VStack className="gap-4">
          <Text variant="heading-1" className="px-5 text-text-strong">
            마지막으로 저장한 폴더 순
          </Text>
          <VStack className="gap-10">
            {HOME_FOLDER_SECTIONS.map(({ folder, links }) => (
              <FolderSection key={folder.id} folder={folder} links={links} />
            ))}
          </VStack>
        </VStack>
      </VStack>
    </ScrollView>
  );
}
