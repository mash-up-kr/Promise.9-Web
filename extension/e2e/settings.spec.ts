import { ARTICLE_TAB, expect, signIn, test } from "./fixtures";

test.describe("사이드패널 설정", () => {
  test("저장 화면의 톱니로 설정에 들어가 앱 설치 QR 을 보고, 뒤로 가면 적던 메모가 그대로다", async ({
    openPanel,
  }) => {
    const page = await openPanel();
    await signIn(page);
    await page.getByLabel("메모").fill("적던 메모");

    await page.getByRole("button", { name: "설정" }).click();
    await expect(page.getByRole("heading", { name: "설정" })).toBeVisible();
    await expect(
      page.getByText(
        "웹에서는 이메일로 알려드려요. 앱에서는 푸시 알림도 받을 수 있어요.",
      ),
    ).toBeVisible();

    await page
      .getByRole("button", { name: "앱 설치하고 푸시 알림 받기" })
      .click();
    await expect(
      page.getByRole("dialog", { name: "앱에서 푸시 알림을 받아보세요!" }),
    ).toBeVisible();
    await expect(page.getByLabel("앱 설치 QR 코드")).toBeVisible();
    await expect(page.getByText("link-ding-dong.com/app")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await page.getByRole("button", { name: "뒤로 가기" }).click();
    await expect(page.getByText(ARTICLE_TAB.title)).toBeVisible();
    await expect(page.getByLabel("메모")).toHaveValue("적던 메모");
  });

  test("이메일 알림을 끄면 서버에 저장하고 리마인드를 받을 수 없다고 알린다", async ({
    openPanel,
    mockApi,
  }) => {
    const page = await openPanel();
    await signIn(page);
    await page.getByRole("button", { name: "설정" }).click();

    const email = page.getByRole("switch", { name: "이메일 알림" });
    await expect(email).toHaveAttribute("aria-checked", "true");
    await email.click();

    await expect(email).toHaveAttribute("aria-checked", "false");
    await expect(
      page.getByText("알림이 모두 꺼져 있어서 리마인드를 알려드릴 수 없어요."),
    ).toBeVisible();
    await expect
      .poll(() => mockApi.requests("PATCH /users/me/notification-settings"))
      .toEqual([expect.objectContaining({ body: { email: false } })]);
  });

  // 우클릭 메뉴 클릭 자체는 Playwright 로 누를 수 없다 — background 가 남기는 요청부터 확인한다.
  test("background 가 설정 요청을 남기면 열려 있는 패널이 설정 화면으로 바뀐다", async ({
    openPanel,
    context,
  }) => {
    const page = await openPanel();
    await signIn(page);
    await expect(page.getByText(ARTICLE_TAB.title)).toBeVisible();

    const windowId = await page.evaluate(
      async () => (await chrome.windows.getCurrent()).id,
    );
    const [worker] = context.serviceWorkers();
    await worker?.evaluate(
      (id) =>
        chrome.storage.session.set({
          openSettings: { windowId: id, requestedAt: Date.now() },
        }),
      windowId,
    );

    await expect(page.getByRole("heading", { name: "설정" })).toBeVisible();
  });
});
