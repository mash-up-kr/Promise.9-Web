import { fireEvent, render, screen } from "@testing-library/react-native";

import { ArchiveDetailScreen } from "./ArchiveDetailScreen";
import { FOLDER_LINKS } from "./archive.mocks";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ id: "all" }),
  useRouter: () => ({ push: mockPush }),
}));

describe("ArchiveDetailScreen", () => {
  beforeEach(() => mockPush.mockClear());

  test("폴더 내 링크 타일을 렌더한다", async () => {
    await render(<ArchiveDetailScreen />);
    for (const link of FOLDER_LINKS) {
      expect(screen.getByText(link.title)).toBeOnTheScreen();
    }
  });

  test("링크를 누르면 링크 상세로 이동한다", async () => {
    await render(<ArchiveDetailScreen />);
    await fireEvent.press(screen.getByLabelText(FOLDER_LINKS[0].title));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/link/[id]",
      params: { id: String(FOLDER_LINKS[0].linkId) },
    });
  });
});
