import { render, screen } from "@testing-library/react-native";
import { useAnimatedRef, useSharedValue } from "react-native-reanimated";

import type { ArchiveFolder } from "../archive.types";
import { SortableFolderList } from "./SortableFolderList";

const FOLDERS: ArchiveFolder[] = [
  { id: "design", name: "디자인", count: 1, tone: "blue" },
  { id: "ai", name: "AI", count: 1, tone: "blue" },
  { id: "dev", name: "개발", count: 1, tone: "blue" },
];

// scroll 관련 shared value/ref 는 부모(ArchiveScreen)가 소유하므로 테스트에서 주입한다.
function Harness() {
  const scrollRef = useAnimatedRef<never>();
  const scrollOffset = useSharedValue(0);
  const scrollContentHeight = useSharedValue(0);
  return (
    <SortableFolderList
      folders={FOLDERS}
      onReorder={() => {}}
      // biome-ignore lint/suspicious/noExplicitAny: 테스트 하네스에서 scroll ref 타입만 맞춘다.
      scrollRef={scrollRef as any}
      scrollOffset={scrollOffset}
      scrollContentHeight={scrollContentHeight}
      onDraggingChange={() => {}}
    />
  );
}

describe("SortableFolderList", () => {
  test("폴더 행과 순서 변경 핸들을 렌더한다", async () => {
    await render(<Harness />);

    expect(screen.getByText("디자인")).toBeOnTheScreen();
    expect(screen.getByText("개발")).toBeOnTheScreen();
    expect(screen.getByLabelText("디자인 순서 변경")).toBeOnTheScreen();
    expect(screen.getByLabelText("개발 순서 변경")).toBeOnTheScreen();
  });
});
