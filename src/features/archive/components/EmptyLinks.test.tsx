import { render, screen } from "@testing-library/react-native";

import { EmptyLinks } from "./EmptyLinks";

describe("EmptyLinks", () => {
  test("폴더에 맞는 제목·설명과 일러스트를 보여준다", async () => {
    await render(<EmptyLinks folderId="favorites" />);

    expect(screen.getByText("즐겨찾기한 링크가 없어요")).toBeOnTheScreen();
    expect(
      screen.getByText("자주 보고 싶은 링크를 즐겨찾기 해보세요"),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText("저장된 링크 없음")).toBeOnTheScreen();
  });

  test("사용자 폴더는 전체 폴더 문구로 폴백한다", async () => {
    await render(<EmptyLinks folderId="7" />);

    expect(screen.getByText("아직 저장된 링크가 없어요")).toBeOnTheScreen();
  });
});
