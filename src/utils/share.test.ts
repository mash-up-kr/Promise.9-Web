const mockPlatform = { isWeb: false };
jest.mock("@/constants/platform.constants", () => ({
  get isWeb() {
    return mockPlatform.isWeb;
  },
  get isIOS() {
    return !mockPlatform.isWeb;
  },
  isAndroid: false,
  isServer: false,
}));

const mockSetString = jest.fn();
jest.mock("expo-clipboard", () => ({
  setStringAsync: (...args: unknown[]) => mockSetString(...args),
}));

import { Share } from "react-native";

import { shareUrl } from "./share";

// react-native 를 통째로 목하면 expo 내부(Platform.select)가 깨져 Share 만 스파이한다.
const mockShare = jest.spyOn(Share, "share");

const url = "https://toss.tech/article/50893";

describe("shareUrl (네이티브)", () => {
  beforeEach(() => {
    mockPlatform.isWeb = false;
    mockShare.mockReset().mockResolvedValue({ action: "sharedAction" });
    mockSetString.mockReset().mockResolvedValue(true);
  });

  it("OS 공유 시트를 연다", async () => {
    await expect(shareUrl(url)).resolves.toBe("shared");
    expect(mockShare).toHaveBeenCalledWith({ message: url });
    expect(mockSetString).not.toHaveBeenCalled();
  });

  it("공유가 실패하면 클립보드에 복사한다", async () => {
    mockShare.mockRejectedValue(new Error("no activity"));

    await expect(shareUrl(url)).resolves.toBe("copied");
    expect(mockSetString).toHaveBeenCalledWith(url);
  });
});

describe("shareUrl (웹)", () => {
  const webShare = jest.fn();

  beforeEach(() => {
    mockPlatform.isWeb = true;
    mockShare.mockReset();
    mockSetString.mockReset().mockResolvedValue(true);
    webShare.mockReset().mockResolvedValue(undefined);
    Object.defineProperty(globalThis, "navigator", {
      value: { share: webShare },
      configurable: true,
      writable: true,
    });
  });

  it("navigator.share 로 공유한다", async () => {
    await expect(shareUrl(url)).resolves.toBe("shared");
    expect(webShare).toHaveBeenCalledWith({ url });
  });

  it("navigator.share 가 없으면 클립보드에 복사한다", async () => {
    Object.defineProperty(globalThis, "navigator", {
      value: {},
      configurable: true,
      writable: true,
    });

    await expect(shareUrl(url)).resolves.toBe("copied");
    expect(mockSetString).toHaveBeenCalledWith(url);
  });

  // 사용자가 공유 시트를 닫은 것뿐이라 복사로 되돌리면 안 된다.
  it("사용자가 공유를 취소하면 복사하지 않는다", async () => {
    const abort = new Error("cancelled");
    abort.name = "AbortError";
    webShare.mockRejectedValue(abort);

    await expect(shareUrl(url)).resolves.toBe("shared");
    expect(mockSetString).not.toHaveBeenCalled();
  });
});
