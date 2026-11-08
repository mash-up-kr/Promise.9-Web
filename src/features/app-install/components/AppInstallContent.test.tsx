jest.mock("@/utils/openExternalUrl", () => ({ openExternalUrl: jest.fn() }));

import { APP_STORE_URL } from "@shared/app-install/appInstall.constants";
import { render, screen, userEvent } from "@testing-library/react-native";

import { openExternalUrl } from "@/utils/openExternalUrl";

import { AppInstallContent } from "./AppInstallContent";

describe("AppInstallContent", () => {
  test("mobile 은 스토어 배지를 보여주고 QR 은 없다", async () => {
    await render(<AppInstallContent variant="mobile" />);

    expect(
      screen.getByRole("link", { name: "App Store에서 다운로드하기" }),
    ).toBeOnTheScreen();
    expect(screen.queryByLabelText("앱 설치 QR 코드")).toBeNull();
  });

  // 출시되면 IS_PLAY_STORE_RELEASED 를 켜고 이 테스트를 배지가 보이는 쪽으로 바꾼다.
  test("Google Play 는 출시 전이라 배지를 숨긴다", async () => {
    await render(<AppInstallContent variant="mobile" />);

    expect(
      screen.queryByRole("link", { name: "Google Play에서 다운로드" }),
    ).toBeNull();
  });

  test("App Store 배지를 누르면 App Store 를 연다", async () => {
    await render(<AppInstallContent variant="mobile" />);

    await userEvent
      .setup()
      .press(screen.getByRole("link", { name: "App Store에서 다운로드하기" }));

    expect(openExternalUrl).toHaveBeenCalledWith(APP_STORE_URL);
  });

  test("desktop 은 QR 과 안내를 보여주고 배지는 없다", async () => {
    await render(<AppInstallContent variant="desktop" />);

    expect(screen.getByLabelText("앱 설치 QR 코드")).toBeOnTheScreen();
    expect(screen.getByText("휴대폰 카메라로 스캔해 주세요")).toBeOnTheScreen();
    expect(screen.queryByRole("link")).toBeNull();
  });
});
