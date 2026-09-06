jest.mock("@shared/api", () => ({ setTokenPersistence: jest.fn() }));
jest.mock("@/lib/tokenStorage", () => ({ tokenPersistence: { id: "native" } }));
jest.mock("@/global.css", () => ({}));
jest.mock("./ShareExtension", () => ({ ShareExtension: () => null }));

import { setTokenPersistence } from "@shared/api";
import { AppRegistry } from "react-native";

test("등록 시점에 토큰 저장소를 주입하고 shareExtension 루트를 등록한다", () => {
  jest.isolateModules(() => {
    const registerSpy = jest.spyOn(AppRegistry, "registerComponent");
    require("./shareExtension.registry.android");

    expect(setTokenPersistence).toHaveBeenCalledWith({ id: "native" });
    expect(registerSpy).toHaveBeenCalledWith(
      "shareExtension",
      expect.any(Function),
    );
  });
});
