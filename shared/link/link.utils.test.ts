import {
  extractFirstUrl,
  isWebUrl,
  type LinkUrlRejectReason,
  normalizeLinkUrl,
} from "./link.utils";

const accepted = (url: string) => ({ ok: true, url });
const rejected = (reason: LinkUrlRejectReason) => ({ ok: false, reason });

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
    expect(normalizeLinkUrl("https://toss.tech/a?b=1#c")).toEqual(
      accepted("https://toss.tech/a?b=1#c"),
    );
    expect(normalizeLinkUrl("  http://example.com  ")).toEqual(
      accepted("http://example.com"),
    );
  });

  test("스킴 없이 입력한 주소는 https 를 붙인다", () => {
    expect(normalizeLinkUrl("naver.me/xYz1")).toEqual(
      accepted("https://naver.me/xYz1"),
    );
    expect(normalizeLinkUrl("www.instagram.com/p/abc?igsh=1")).toEqual(
      accepted("https://www.instagram.com/p/abc?igsh=1"),
    );
    expect(normalizeLinkUrl("map.kakao.com")).toEqual(
      accepted("https://map.kakao.com"),
    );
    expect(normalizeLinkUrl("한글도메인.kr/소개")).toEqual(
      accepted("https://한글도메인.kr/소개"),
    );
  });

  test("스킴 없는 주소의 포트를 스킴으로 착각하지 않는다", () => {
    expect(normalizeLinkUrl("example.com:8080/path")).toEqual(
      accepted("https://example.com:8080/path"),
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
      "tel:01012345678",
      "tel:12345",
      "sms:01012345678",
    ]) {
      expect(normalizeLinkUrl(url)).toEqual(accepted(url));
    }
  });

  test("흔한 스킴 오타와 hxxp 표기는 http(s) 로 고친다", () => {
    for (const typo of ["ttps", "htps", "htttps", "hhttps", "hxxps", "HXXPS"]) {
      expect(normalizeLinkUrl(`${typo}://toss.tech/a`)).toEqual(
        accepted("https://toss.tech/a"),
      );
    }
    for (const typo of ["ttp", "htp", "hxxp"]) {
      expect(normalizeLinkUrl(`${typo}://example.com`)).toEqual(
        accepted("http://example.com"),
      );
    }
  });

  test("스크립트 실행·기기 내부 자원·OS 핸들러·우리 앱 딥링크 스킴은 대소문자와 무관하게 막는다", () => {
    for (const url of [
      "javascript:alert(1)",
      "JavaScript:alert(1)",
      "javascript:1/alert(1)",
      "vbscript:msgbox(1)",
      "data:text/html,<script>alert(1)</script>",
      "blob:https://example.com/0a1b",
      "file:///Users/boky/secret.pdf",
      "filesystem:https://example.com/temporary/a",
      "about:blank",
      "view-source:https://example.com",
      "intent://scan/#Intent;scheme=zxing;end",
      "content://com.android.contacts/contacts",
      "chrome://settings",
      "chrome-extension://abcdefg/popup.html",
      "edge://settings",
      "brave://settings",
      "opera://settings",
      "resource://gre/modules",
      "jar:file:///a.jar!/b.class",
      "search-ms:query=secret",
      "ms-settings:privacy",
      "ms-msdt:/id PCWDiagnostic",
      "promise9web://link/1",
    ]) {
      expect(normalizeLinkUrl(url)).toEqual(rejected("blocked-scheme"));
    }
  });

  test("주소 안에 공백이 있으면 거부한다", () => {
    for (const value of [
      "https://example.com/a b",
      "java\tscript:alert(1)",
      "naver .me",
      `https://example.com/a${String.fromCodePoint(0xa0)}b`,
    ]) {
      expect(normalizeLinkUrl(value)).toEqual(rejected("whitespace"));
    }
  });

  // 제로폭 공백·글자 방향 뒤집기(RLO·LRI)·소프트 하이픈·한글 채움 문자·NUL·NEL(C1)
  test("보이지 않는 문자·글자 방향 제어 문자·제어 문자가 섞이면 거부한다", () => {
    for (const codePoint of [0x200b, 0x202e, 0x2066, 0xad, 0x3164, 0x0, 0x85]) {
      const value = `https://exa${String.fromCodePoint(codePoint)}mple.com`;
      expect(normalizeLinkUrl(value)).toEqual(rejected("invisible-char"));
    }
  });

  test("도메인 앞에 계정 정보(@)를 붙인 http(s) 주소는 거부한다", () => {
    for (const value of [
      "https://toss.tech@evil.com/",
      "https://user:pass@example.com",
      "https://@example.com",
      "https://toss.tech\\@evil.com",
    ]) {
      expect(normalizeLinkUrl(value)).toEqual(rejected("userinfo"));
    }
    // 경로의 @ 는 계정 정보가 아니다.
    expect(normalizeLinkUrl("https://medium.com/@mashup/post")).toEqual(
      accepted("https://medium.com/@mashup/post"),
    );
  });

  test("2,048자를 넘는 주소는 거부한다", () => {
    const base = "https://example.com/";
    const maxUrl = base + "a".repeat(2048 - base.length);
    expect(normalizeLinkUrl(maxUrl)).toEqual(accepted(maxUrl));
    expect(normalizeLinkUrl(`${maxUrl}a`)).toEqual(rejected("too-long"));
    // https 를 붙인 뒤 길이로 본다.
    expect(
      normalizeLinkUrl(
        `example.com/${"a".repeat(2048 - "example.com/".length)}`,
      ),
    ).toEqual(rejected("too-long"));
  });

  test("비어 있으면 거부한다", () => {
    expect(normalizeLinkUrl("")).toEqual(rejected("empty"));
    expect(normalizeLinkUrl("   ")).toEqual(rejected("empty"));
  });

  test("링크 형식이 아니면 거부한다", () => {
    for (const value of [
      "not-a-url",
      "그냥텍스트",
      "3.14",
      "https://",
      "https:naver.me",
      "nmap://",
      "mailto:",
      "http://example.com:99999",
      "https://exa|mple.com",
      "https://a%zz.com",
      "[지도]naver.me/x",
      "(naver.me/x)",
      "“naver.me/abc”",
      "<naver.me/x>",
      "naver.me:99999/x",
      "intranet:8080/wiki",
      "localhost:3000/admin",
      "localhost:3000",
    ]) {
      expect(normalizeLinkUrl(value)).toEqual(rejected("not-link"));
    }
  });

  test("보정한 주소를 다시 넣어도 결과가 같다", () => {
    for (const value of [
      "naver.me/xYz1",
      "  hxxps://toss.tech/a  ",
      "example.com:8080/path",
      "nmap://place?id=123",
      `example.com/${"a".repeat(2048 - "https://example.com/".length)}`,
    ]) {
      const once = normalizeLinkUrl(value);
      if (!once.ok) throw new Error(`보정 실패: ${value}`);
      expect(normalizeLinkUrl(once.url)).toEqual(once);
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
