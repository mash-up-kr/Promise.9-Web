import { extractFirstUrl, isWebUrl, normalizeLinkUrl } from "./link.utils";

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
  test("http(s) URL 이 없으면 스킴 없는 주소를 뽑는다(지도 앱 텍스트 공유 형태)", () => {
    expect(
      extractFirstUrl("[네이버 지도]\n스타벅스 강남점\nnaver.me/xYz1"),
    ).toBe("naver.me/xYz1");
  });
  test("http(s) URL 이 없으면 앱 전용 스킴 링크를 뽑는다", () => {
    expect(extractFirstUrl("장소 보기 nmap://place?id=123")).toBe(
      "nmap://place?id=123",
    );
  });
  test("콜론이 들어간 문장을 링크로 착각하지 않는다", () => {
    expect(extractFirstUrl("참고:이거 꼭 보기")).toBeNull();
  });
  test("URL 이 없으면 null", () => {
    expect(extractFirstUrl("그냥 텍스트")).toBeNull();
    expect(extractFirstUrl("")).toBeNull();
  });
});

describe("normalizeLinkUrl", () => {
  test("http·https 주소는 앞뒤 공백만 걷어 그대로 돌려준다", () => {
    expect(normalizeLinkUrl("https://toss.tech/a?b=1#c")).toBe(
      "https://toss.tech/a?b=1#c",
    );
    expect(normalizeLinkUrl("  http://example.com  ")).toBe(
      "http://example.com",
    );
  });

  test("스킴 없이 입력한 주소는 https 를 붙인다", () => {
    expect(normalizeLinkUrl("naver.me/xYz1")).toBe("https://naver.me/xYz1");
    expect(normalizeLinkUrl("www.instagram.com/p/abc?igsh=1")).toBe(
      "https://www.instagram.com/p/abc?igsh=1",
    );
    expect(normalizeLinkUrl("map.kakao.com")).toBe("https://map.kakao.com");
  });

  test("스킴 없는 주소의 포트를 스킴으로 착각하지 않는다", () => {
    expect(normalizeLinkUrl("example.com:8080/path")).toBe(
      "https://example.com:8080/path",
    );
  });

  test("앱 전용 스킴 등 http(s) 외 링크를 허용한다", () => {
    for (const url of [
      "nmap://place?id=123",
      "kakaomap://look?p=37.5,127.0",
      "instagram://user?username=mashup",
      "com.example.app://open/path",
      "ftp://example.com/file",
      "mailto:hello@example.com",
      "tel:010-1234-5678",
    ]) {
      expect(normalizeLinkUrl(url)).toBe(url);
    }
  });

  test("스크립트 실행·로컬 자원 접근 스킴은 대소문자와 무관하게 막는다", () => {
    for (const url of [
      "javascript:alert(1)",
      "JavaScript:alert(1)",
      "vbscript:msgbox(1)",
      "data:text/html,<script>alert(1)</script>",
      "blob:https://example.com/0a1b",
      "file:///Users/boky/secret.pdf",
      "filesystem:https://example.com/temporary/a",
      "about:blank",
      "view-source:https://example.com",
    ]) {
      expect(normalizeLinkUrl(url)).toBeNull();
    }
  });

  test("주소 안에 공백·제어 문자가 있으면 거부한다", () => {
    expect(normalizeLinkUrl("https://example.com/a b")).toBeNull();
    expect(normalizeLinkUrl("java\tscript:alert(1)")).toBeNull();
    expect(normalizeLinkUrl("naver .me")).toBeNull();
  });

  test("링크 형식이 아니면 거부한다", () => {
    for (const value of [
      "",
      "   ",
      "not-a-url",
      "그냥 텍스트",
      "3.14",
      "https://",
      "https:naver.me",
      "nmap://",
      "mailto:",
    ]) {
      expect(normalizeLinkUrl(value)).toBeNull();
    }
  });
});

describe("isWebUrl", () => {
  test("http·https 주소만 웹 주소로 본다", () => {
    expect(isWebUrl("https://toss.tech")).toBe(true);
    expect(isWebUrl("HTTP://EXAMPLE.COM")).toBe(true);
    expect(isWebUrl("nmap://place?id=1")).toBe(false);
    expect(isWebUrl("naver.me/xYz1")).toBe(false);
  });
});
