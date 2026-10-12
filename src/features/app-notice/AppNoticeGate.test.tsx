jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("@/constants/app.constants", () => ({ APP_VERSION: "1.2.0" }));

jest.mock("@/utils/openExternalUrl", () => ({
  openExternalUrl: jest.fn().mockResolvedValue("opened"),
}));

// jest 환경의 Constants.expoConfig 는 비어 있어 STORE_URL 이 null 이 된다 — 실기기와 같게 주소를 주입한다.
// (app.json 에 주소가 실제로 들어 있는지는 app.config.test.js 가 지킨다.)
jest.mock("./appNotice.constants", () => ({
  ...jest.requireActual("./appNotice.constants"),
  STORE_URL: "https://apps.apple.com/app/id6808223727",
}));

import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  render,
  screen,
  userEvent,
  waitFor,
} from "@testing-library/react-native";

import { openExternalUrl } from "@/utils/openExternalUrl";

import { AppNoticeGate } from "./AppNoticeGate";
import { STORE_URL } from "./appNotice.constants";

function mockManifest(latestVersion: string, minSupportedVersion: string) {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      ios: { latestVersion, minSupportedVersion },
      android: { latestVersion, minSupportedVersion },
    }),
  }) as unknown as typeof fetch;
}

async function renderGate() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={client}>
      <AppNoticeGate />
    </QueryClientProvider>,
  );
}

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

test("새 버전이 있으면 안내를 띄우고, 업데이트를 누르면 스토어를 연다", async () => {
  mockManifest("1.3.0", "1.0.0");
  const user = userEvent.setup();

  await renderGate();

  await waitFor(() =>
    expect(screen.getByText("새 버전이 나왔어요")).toBeOnTheScreen(),
  );
  await user.press(screen.getByText("업데이트"));

  expect(openExternalUrl).toHaveBeenCalledWith(STORE_URL);
});

test("최신 버전이면 아무것도 그리지 않는다", async () => {
  mockManifest("1.2.0", "1.0.0");

  await renderGate();

  await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
  expect(screen.queryByText("새 버전이 나왔어요")).not.toBeOnTheScreen();
  expect(screen.queryByText("업데이트가 필요해요")).not.toBeOnTheScreen();
});

test("지원이 끊긴 버전이면 차단 안내를 띄운다", async () => {
  mockManifest("1.4.0", "1.3.0");

  await renderGate();

  await waitFor(() =>
    expect(screen.getByText("업데이트가 필요해요")).toBeOnTheScreen(),
  );
});
