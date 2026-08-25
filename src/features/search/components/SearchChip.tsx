import { Chip } from "@/components/ui/chip/Chip";

export interface SearchChipProps {
  keyword: string;
  onPress?: () => void;
}

/** 최근 검색어 칩 — 누르면 해당 키워드로 검색한다. */
export function SearchChip({ keyword, onPress }: SearchChipProps) {
  return <Chip onPress={onPress}>{keyword}</Chip>;
}
