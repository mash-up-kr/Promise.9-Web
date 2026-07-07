import { fireEvent, render, screen } from "@testing-library/react-native";

import { SearchBar } from "./SearchBar";

describe("SearchBar", () => {
  test("검색 placeholder 를 가진 입력 필드를 렌더한다", async () => {
    await render(<SearchBar />);
    expect(screen.getByPlaceholderText("검색")).toBeOnTheScreen();
  });

  test("search 접근성 role 을 가진다", async () => {
    await render(<SearchBar />);
    expect(screen.getByRole("search")).toBeOnTheScreen();
  });

  test("입력 값을 onChangeText 로 전달한다", async () => {
    const onChangeText = jest.fn();
    await render(<SearchBar onChangeText={onChangeText} />);
    fireEvent.changeText(screen.getByPlaceholderText("검색"), "링크딩동");
    expect(onChangeText).toHaveBeenCalledWith("링크딩동");
  });

  test("검색 리턴 키(returnKeyType=search)를 기본값으로 가진다", async () => {
    await render(<SearchBar />);
    expect(screen.getByPlaceholderText("검색").props.returnKeyType).toBe(
      "search",
    );
  });

  test("placeholder 를 덮어쓸 수 있다", async () => {
    await render(<SearchBar placeholder="폴더 검색" />);
    expect(screen.getByPlaceholderText("폴더 검색")).toBeOnTheScreen();
  });
});
