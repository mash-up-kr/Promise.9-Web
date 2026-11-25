import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SettingsScreen } from "@/sidepanel/screens/SettingsScreen";

const APP_INSTALL_ROW = "앱 설치하고 푸시 알림 받기";
const SHEET_TITLE = "앱에서 푸시 알림을 받아보세요!";

describe("SettingsScreen", () => {
  it("알림 섹션에 앱 설치 행과 알림 경로 안내를 보여준다", () => {
    render(<SettingsScreen onBack={() => {}} />);

    expect(screen.getByRole("heading", { name: "설정" })).toBeInTheDocument();
    expect(screen.getByText("알림")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: APP_INSTALL_ROW }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "웹에서는 이메일로 알려드려요. 앱에서는 푸시 알림도 받을 수 있어요.",
      ),
    ).toBeInTheDocument();
  });

  it("뒤로 가기를 누르면 onBack 을 부른다", async () => {
    const onBack = vi.fn();
    render(<SettingsScreen onBack={onBack} />);

    await userEvent.click(screen.getByRole("button", { name: "뒤로 가기" }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("앱 설치 행을 누르면 QR 과 짧은 주소가 담긴 시트를 연다", async () => {
    render(<SettingsScreen onBack={() => {}} />);

    await userEvent.click(
      screen.getByRole("button", { name: APP_INSTALL_ROW }),
    );

    const sheet = screen.getByRole("dialog", { name: SHEET_TITLE });
    expect(sheet).toHaveTextContent("리마인드를 앱 알림으로 받을 수 있어요.");
    expect(screen.getByLabelText("앱 설치 QR 코드")).toBeInTheDocument();
    expect(screen.getByText("link-ding-dong.com/app")).toBeInTheDocument();
  });

  it("시트는 Escape 나 바깥(dim)을 눌러 닫는다", async () => {
    render(<SettingsScreen onBack={() => {}} />);
    const openSheet = () =>
      userEvent.click(screen.getByRole("button", { name: APP_INSTALL_ROW }));

    await openSheet();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await openSheet();
    await userEvent.click(screen.getByRole("button", { name: "닫기" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("시트가 열린 동안 Tab·Shift+Tab 으로 포커스가 시트 밖으로 나가지 않는다", async () => {
    render(<SettingsScreen onBack={() => {}} />);
    await userEvent.click(
      screen.getByRole("button", { name: APP_INSTALL_ROW }),
    );
    const sheet = screen.getByRole("dialog", { name: SHEET_TITLE });
    expect(sheet).toHaveFocus();

    await userEvent.tab();
    expect(sheet).toHaveFocus();

    await userEvent.tab({ shift: true });
    expect(sheet).toHaveFocus();
  });

  it("시트를 닫으면 포커스가 앱 설치 행으로 돌아간다", async () => {
    render(<SettingsScreen onBack={() => {}} />);
    const row = screen.getByRole("button", { name: APP_INSTALL_ROW });

    await userEvent.click(row);
    await userEvent.keyboard("{Escape}");

    expect(row).toHaveFocus();
  });
});
