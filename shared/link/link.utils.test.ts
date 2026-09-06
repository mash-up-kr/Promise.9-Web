import { extractFirstUrl } from "./link.utils";

describe("extractFirstUrl", () => {
  test("순수 URL 은 그대로 돌려준다", () => {
    expect(extractFirstUrl("https://toss.tech/a")).toBe("https://toss.tech/a");
  });
  test("앞뒤 공백·개행은 무시한다", () => {
    expect(extractFirstUrl("  https://toss.tech/a\n")).toBe(
      "https://toss.tech/a",
    );
  });
  test("제목 뒤 개행으로 붙은 URL 을 뽑는다(유튜브 공유 형태)", () => {
    expect(extractFirstUrl("영상 제목\nhttps://youtu.be/x1")).toBe(
      "https://youtu.be/x1",
    );
  });
  test("문장 가운데 URL 은 첫 번째 것만 뽑는다", () => {
    expect(extractFirstUrl("이거 봐 http://a.com/1 그리고 https://b.com")).toBe(
      "http://a.com/1",
    );
  });
  test("URL 이 없으면 null", () => {
    expect(extractFirstUrl("그냥 텍스트")).toBeNull();
    expect(extractFirstUrl("")).toBeNull();
  });
});
