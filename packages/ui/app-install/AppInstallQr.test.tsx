import { render, screen } from "@testing-library/react-native";

import { AppInstallQr } from "./AppInstallQr";

describe("AppInstallQr", () => {
  test("설치 주소 QR 과 스캔 안내·짧은 주소를 보여준다", async () => {
    await render(<AppInstallQr />);

    expect(screen.getByLabelText("앱 설치 QR 코드")).toBeOnTheScreen();
    expect(screen.getByText("휴대폰 카메라로 스캔해 주세요")).toBeOnTheScreen();
    expect(screen.getByText("link-ding-dong.com/app")).toBeOnTheScreen();
  });
});
