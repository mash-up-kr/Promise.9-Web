import { APP_STORE_URL } from "@shared/app-install/appInstall.constants";
import { render, screen } from "@testing-library/react-native";

import { AppDownloadScreen } from "./AppDownloadScreen";

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const MAC_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

const originalNavigator = globalThis.navigator;
const originalLocation = globalThis.location;
const mockReplace = jest.fn();

function setBrowser(userAgent: string) {
  Object.defineProperty(globalThis, "navigator", {
    value: { userAgent },
    configurable: true,
  });
  Object.defineProperty(globalThis, "location", {
    value: { replace: mockReplace },
    configurable: true,
  });
}

describe("AppDownloadScreen", () => {
  afterEach(() => {
    mockReplace.mockClear();
    Object.defineProperty(globalThis, "navigator", {
      value: originalNavigator,
      configurable: true,
    });
    Object.defineProperty(globalThis, "location", {
      value: originalLocation,
      configurable: true,
    });
  });

  // 인앱 브라우저가 이동을 막거나 스토어에서 돌아와도 누를 곳이 남아야 한다.
  test("iPhone 이면 App Store 로 바로 보내고, 안내도 함께 그린다", async () => {
    setBrowser(IPHONE_UA);
    await render(<AppDownloadScreen />);

    expect(mockReplace).toHaveBeenCalledWith(APP_STORE_URL);
    expect(
      screen.getByRole("link", { name: "App Store에서 다운로드하기" }),
    ).toBeOnTheScreen();
  });

  test("기기를 판별할 수 없으면 스토어 안내를 보여준다", async () => {
    setBrowser(MAC_UA);
    await render(<AppDownloadScreen />);

    expect(mockReplace).not.toHaveBeenCalled();
    expect(
      screen.getByRole("link", { name: "App Store에서 다운로드하기" }),
    ).toBeOnTheScreen();
  });
});
