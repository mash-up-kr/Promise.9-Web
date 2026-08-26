import { getDomain } from "./link.utils";

it("도메인 추출 — www 제거, 비 http(s) 는 null", () => {
  expect(getDomain("https://www.bucketplace.com/post/1")).toBe(
    "bucketplace.com",
  );
  expect(getDomain("http://toss.tech")).toBe("toss.tech");
  expect(getDomain("HTTPS://Example.COM/a?b=c")).toBe("example.com");
  expect(getDomain("ftp://x.com")).toBeNull();
  expect(getDomain("not-a-url")).toBeNull();
});
