import { fireEvent, render, screen } from "@testing-library/react-native";

import { ArchiveMoreMenu } from "./ArchiveMoreMenu";

describe("ArchiveMoreMenu", () => {
  test("편집·정렬 항목을 렌더한다", async () => {
    await render(<ArchiveMoreMenu onEdit={jest.fn()} onSort={jest.fn()} />);
    expect(screen.getByText("편집")).toBeOnTheScreen();
    expect(screen.getByText("정렬")).toBeOnTheScreen();
  });

  test("편집·정렬 항목을 누르면 각각의 콜백이 호출된다", async () => {
    const onEdit = jest.fn();
    const onSort = jest.fn();
    await render(<ArchiveMoreMenu onEdit={onEdit} onSort={onSort} />);
    fireEvent.press(screen.getByText("편집"));
    expect(onEdit).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByText("정렬"));
    expect(onSort).toHaveBeenCalledTimes(1);
  });
});
