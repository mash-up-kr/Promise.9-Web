import { ARTICLE_TAB, expect, signIn, test } from "./fixtures";

const MEMO = "테스트 자동화 글 — 팀 회의 전에 다시 보기";

test.describe("사이드패널 저장 흐름", () => {
  test("로그인 전에는 로그인 화면이고, 토큰이 저장되면 저장 화면으로 넘어간다", async ({
    openPanel,
  }) => {
    const page = await openPanel();
    await expect(page.getByText("로그인을 해주세요")).toBeVisible();

    await signIn(page);

    await expect(page.getByText(ARTICLE_TAB.title)).toBeVisible();
    await expect(page.getByRole("button", { name: "디자인" })).toBeVisible();
  });

  test("폴더·리마인드·메모를 채워 저장하면 background 가 서버에 저장하고 완료 화면을 보인다", async ({
    openPanel,
    mockApi,
  }) => {
    const page = await openPanel();
    await signIn(page);

    await page.getByRole("button", { name: "개발" }).click();

    // 리마인드 — 앱과 같은 @promise9/ui 카드·토글(react-native-web)
    await page.getByRole("switch", { name: "리마인드" }).click();
    await expect(
      page.getByRole("button", { name: "내일", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("오전 9:00")).toBeVisible();

    await page.getByRole("button", { name: "7일 후", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "7일 후", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("button", { name: "랜덤 날짜" }).click();

    // 날짜 피커 — 3일 후로 맞춘 뒤, 선택된 날의 다다음 날을 직접 고른다.
    await page.getByRole("button", { name: "3일 후", exact: true }).click();
    await page.getByRole("button", { name: /^\d{4}\. \d+\. \d+\./ }).click();
    const days = page.locator("button[aria-pressed]:not([disabled])");
    const selectedIndex = await days.evaluateAll((buttons) =>
      buttons.findIndex(
        (button) => button.getAttribute("aria-pressed") === "true",
      ),
    );
    const target = days.nth(
      Math.min(selectedIndex + 2, (await days.count()) - 1),
    );
    const pickedDay = Number(await target.innerText());
    await target.click();
    await page.getByRole("button", { name: "확인" }).click();

    // 시간 피커
    await page.getByRole("button", { name: /^(오전|오후) \d+:\d{2}/ }).click();
    await page
      .getByRole("group", { name: "오전 오후" })
      .getByRole("button", { name: "오후", exact: true })
      .click();
    await page
      .getByRole("group", { name: "시" })
      .getByRole("button", { name: "8", exact: true })
      .click();
    await page.getByRole("button", { name: "확인" }).click();
    await expect(page.getByText("오후 8:00")).toBeVisible();

    await page.getByLabel("메모").fill(MEMO);
    await page.getByRole("button", { name: "저장", exact: true }).click();

    await expect(page.getByText("링크 저장을 완료했어요")).toBeVisible();

    // 저장은 패널이 아니라 background(service worker)가 한다 — 서버가 실제로 받은 값을 본다.
    const [saved] = mockApi.requests("POST /links");
    expect(saved?.body).toMatchObject({
      url: ARTICLE_TAB.url,
      folderId: 4,
      memo: MEMO,
    });
    const reminderAt = new Date(
      (saved?.body as { reminderAt: string }).reminderAt,
    );
    expect(reminderAt.getDate()).toBe(pickedDay);
    expect(reminderAt.getHours()).toBe(20);
    expect(reminderAt.getMinutes()).toBe(0);
  });
});
