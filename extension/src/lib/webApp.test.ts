import { describe, expect, it } from "vitest";

import { WEB_APP_PATH, webAppUrl } from "./webApp";

describe("webAppUrl", () => {
  it("배포된 웹앱 주소로 절대 URL 을 만든다", () => {
    expect(webAppUrl(WEB_APP_PATH.home)).toBe("https://link-ding-dong.com/");
    expect(webAppUrl(WEB_APP_PATH.linkDetail(42))).toBe(
      "https://link-ding-dong.com/link/42",
    );
  });
});
