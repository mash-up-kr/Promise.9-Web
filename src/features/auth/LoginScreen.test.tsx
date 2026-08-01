import { render, screen } from "@testing-library/react-native";

import { SOCIAL_PROVIDERS } from "./auth.constants";
import { LoginScreen } from "./LoginScreen";

describe("LoginScreen", () => {
  test("활성화된 provider 버튼만 렌더한다", async () => {
    await render(<LoginScreen />);

    for (const p of SOCIAL_PROVIDERS.filter((p) => p.enabled)) {
      expect(screen.getByRole("button", { name: p.label })).toBeTruthy();
    }
    for (const p of SOCIAL_PROVIDERS.filter((p) => !p.enabled)) {
      expect(screen.queryByRole("button", { name: p.label })).toBeNull();
    }
  });
});
