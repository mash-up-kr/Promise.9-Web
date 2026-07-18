import type { Folder } from "@shared/types/folder.types";
import type { Link } from "@shared/types/link.types";
import { ChevronRight } from "lucide-react-native";
import { ScrollView } from "react-native";

import { HStack } from "@/components/ui/hstack/HStack";
import { Icon } from "@/components/ui/icon/Icon";
import { LinkTile } from "@/components/ui/link-card/LinkTile";
import { Text } from "@/components/ui/text/Text";
import { VStack } from "@/components/ui/vstack/VStack";

interface FolderSectionProps {
  folder: Folder;
  links: Link[];
}

/** 폴더별 섹션 — 폴더명 아래 링크 타일을 가로로 넘기는 캐러셀. */
export function FolderSection({ folder, links }: FolderSectionProps) {
  return (
    <VStack className="gap-4">
      <HStack className="items-center gap-1 pl-5">
        <Text variant="heading-2">{folder.folderName}</Text>
        <Icon iconNode={ChevronRight} size={16} className="text-text-normal" />
      </HStack>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <HStack className="gap-3 pl-5">
          {links.map((link) => (
            <LinkTile key={link.linkId} link={link} />
          ))}
        </HStack>
      </ScrollView>
    </VStack>
  );
}
