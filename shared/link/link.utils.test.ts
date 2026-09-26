import {
  findLinkInText,
  isOpenableLinkUrl,
  isWebUrl,
  type LinkUrlRejectReason,
  normalizeLinkUrl,
} from "./link.utils";

const accepted = (url: string) => ({ ok: true, url });
const rejected = (reason: LinkUrlRejectReason) => ({ ok: false, reason });

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

  test("흔한 스킴 오타는 http(s) 로 고친다", () => {
    for (const typo of ["ttps", "htps", "htttps", "hhttps", "TTPS"]) {
      expect(normalizeLinkUrl(`${typo}://toss.tech/a`)).toEqual(
        accepted("https://toss.tech/a"),
      );
    }
    for (const typo of ["ttp", "htp"]) {
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
      "chrome-devtools://devtools/bundled/inspector.html",
      "chrome-search://local-ntp/local-ntp.html",
      "edge://settings",
      "brave://settings",
      "opera://settings",
      "resource://gre/modules",
      "jar:file:///a.jar!/b.class",
      "search-ms:query=secret",
      "ms-settings:privacy",
      "ms-msdt:/id PCWDiagnostic",
      "promise9web://link/1",
      // 보안 보고서가 일부러 무력화해 둔 표기 — 되살려 열지 않는다.
      "hxxps://evil.com/a",
      "HXXP://evil.com",
    ]) {
      expect(normalizeLinkUrl(url)).toEqual(rejected("blocked-scheme"));
    }
  });

  // 저장한 링크로 우리 앱 내부 화면이나 로그인 흐름을 건드리지 못하게 한다.
  test("우리 앱(번들 ID)·로그인 콜백 스킴은 막는다", () => {
    for (const url of [
      "com.mashup.promise9:///settings/withdraw",
      "kakao0123456789abcdef0123456789abcdef://oauth?code=abc",
      "com.googleusercontent.apps.123-abc:/oauth2redirect",
    ]) {
      expect(normalizeLinkUrl(url)).toEqual(rejected("blocked-scheme"));
      expect(isOpenableLinkUrl(url)).toBe(false);
    }
    expect(normalizeLinkUrl("kakaotalk://inappbrowser?url=x").ok).toBe(true);
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

  // 제로폭 공백·글자 방향 뒤집기(RLO·LRI)·소프트 하이픈·한글 채움 문자·NUL·NEL(C1)·이체 선택자·속기/악보 서식 문자
  test("보이지 않는 문자·글자 방향 제어 문자·제어 문자가 섞이면 거부한다", () => {
    for (const codePoint of [
      0x200b, 0x202e, 0x2066, 0xad, 0x3164, 0x0, 0x85, 0xfe0f, 0xe0100, 0x1bca0,
      0x1d173,
    ]) {
      const value = `https://exa${String.fromCodePoint(codePoint)}mple.com`;
      expect(normalizeLinkUrl(value)).toEqual(rejected("invisible-char"));
    }
  });

  test("도메인 앞에 계정 정보(@)를 붙인 주소는 스킴과 무관하게 거부한다", () => {
    for (const value of [
      "https://toss.tech@evil.com/",
      "https://user:pass@example.com",
      "https://@example.com",
      "googlechromes://toss.im@evil.com/login",
      "x-safari-https://toss.im@evil.com",
      "ftp://a@evil.com",
      "microsoft-edge:https://toss.im@evil.com",
    ]) {
      expect(normalizeLinkUrl(value)).toEqual(rejected("userinfo"));
    }
    // 경로·쿼리의 @ 와 mailto: 주소는 계정 정보가 아니다.
    for (const url of [
      "https://medium.com/@mashup/post",
      "mailto:a@b.com",
      "nmap://place?name=a@b",
    ]) {
      expect(normalizeLinkUrl(url)).toEqual(accepted(url));
    }
  });

  // 브라우저는 "//" 뒤의 "/"·"\" 를 건너뛰고 "\" 를 "/" 로 읽어 보이는 것과 다른 호스트를 연다.
  test("// 뒤에 슬래시가 더 붙거나 역슬래시가 든 http(s) 주소는 거부한다", () => {
    for (const value of [
      "https:///toss.tech@evil.com",
      "https://\\/toss.tech@evil.com",
      "https://evil.com\\.toss.im/login",
      "https://toss.tech\\@evil.com",
    ]) {
      expect(normalizeLinkUrl(value)).toEqual(rejected("not-link"));
    }
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
      "  ttps://toss.tech/a  ",
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

describe("findLinkInText", () => {
  test("순수 URL 은 그대로 돌려준다", () => {
    expect(findLinkInText("https://toss.tech/a")).toEqual(
      accepted("https://toss.tech/a"),
    );
  });

  test("앞뒤 공백·개행은 무시한다", () => {
    expect(findLinkInText("  https://toss.tech/a\n")).toEqual(
      accepted("https://toss.tech/a"),
    );
  });

  test("제목 뒤 개행으로 붙은 URL 을 뽑는다(유튜브 공유 형태)", () => {
    expect(findLinkInText("영상 제목\nhttps://youtu.be/x1")).toEqual(
      accepted("https://youtu.be/x1"),
    );
  });

  test("문장 가운데 URL 은 첫 번째 것만 뽑는다", () => {
    expect(
      findLinkInText("이거 봐 http://a.com/1 그리고 https://b.com"),
    ).toEqual(accepted("http://a.com/1"));
  });

  test("http(s) 링크를 앱 전용 링크·스킴 없는 주소보다 먼저 찾는다", () => {
    expect(
      findLinkInText("nmap://place?id=1 naver.me/abc https://toss.tech/a"),
    ).toEqual(accepted("https://toss.tech/a"));
  });

  test("http(s) URL 이 없으면 스킴 없는 주소를 https 로 보정해 뽑는다(지도 앱 텍스트 공유 형태)", () => {
    expect(
      findLinkInText("[네이버 지도]\n스타벅스 강남점\nnaver.me/xYz1"),
    ).toEqual(accepted("https://naver.me/xYz1"));
  });

  test("http(s) URL 이 없으면 앱 전용 스킴 링크를 뽑는다", () => {
    expect(findLinkInText("장소 보기 nmap://place?id=123")).toEqual(
      accepted("nmap://place?id=123"),
    );
  });

  test("링크를 감싼 괄호·따옴표·문장 부호는 걷어낸다", () => {
    const cases: [string, string][] = [
      ["(https://toss.tech/a)", "https://toss.tech/a"],
      ["“https://toss.tech/a”", "https://toss.tech/a"],
      ["<https://toss.tech/a>", "https://toss.tech/a"],
      ["「https://toss.tech/a」", "https://toss.tech/a"],
      ["여기 https://toss.tech/a. 참고", "https://toss.tech/a"],
      ["https://toss.tech/a?b=1, 이거", "https://toss.tech/a?b=1"],
      ["누리집(https://www.korea.kr)에서 확인", "https://www.korea.kr"],
      ["(naver.me/x)", "https://naver.me/x"],
      ["“naver.me/abc”", "https://naver.me/abc"],
      ["<naver.me/x>", "https://naver.me/x"],
      ["[nmap://place?id=1]", "nmap://place?id=1"],
    ];
    for (const [text, url] of cases) {
      expect(findLinkInText(text)).toEqual(accepted(url));
    }
  });

  test("전각·CJK 괄호와 문장 부호도 걷어낸다", () => {
    for (const text of [
      "（https://toss.tech/a）",
      "［https://toss.tech/a］",
      "｛https://toss.tech/a｝",
      "＜https://toss.tech/a＞",
      "참고 https://toss.tech/a。",
      "https://toss.tech/a、 https://toss.tech/b",
      "https://toss.tech/a， 그리고",
      "https://toss.tech/a！",
      "https://toss.tech/a？",
      "https://toss.tech/a：",
      "https://toss.tech/a；",
    ]) {
      expect(findLinkInText(text)).toEqual(accepted("https://toss.tech/a"));
    }
  });

  test("링크 바로 뒤에 붙여 쓴 조사는 떼어낸다", () => {
    for (const [text, url] of [
      ["https://naver.me/abc에서 확인", "https://naver.me/abc"],
      ["naver.me/xYz1에서 봐", "https://naver.me/xYz1"],
      ["https://toss.tech/a로 들어가", "https://toss.tech/a"],
      ["https://toss.tech/a이랑 같이", "https://toss.tech/a"],
      ["https://naver.me/abc에서.", "https://naver.me/abc"],
    ]) {
      expect(findLinkInText(text)).toEqual(accepted(url));
    }
  });

  // 한글 경로 끝 글자와 조사는 구분할 수 없어 한글 뒤에 붙은 조사는 남긴다.
  test("한글로 끝나는 경로는 그대로 둔다", () => {
    for (const url of [
      "https://namu.wiki/w/대한민국",
      "https://namu.wiki/w/독도",
      "https://namu.wiki/w/대한민국에서",
    ]) {
      expect(findLinkInText(url)).toEqual(accepted(url));
    }
  });

  // 이모지는 이체 선택자(U+FE0F)·ZWJ 로 이어 쓰기도 해 보이지 않는 문자로 거부되면 헷갈린다 — 거기서 링크를 끊는다.
  test("링크 바로 뒤에 붙인 이모지에서 링크가 끝난다", () => {
    const heart = String.fromCodePoint(0x2764, 0xfe0f);
    const thumbsUp = String.fromCodePoint(0x1f44d, 0x1f3fd);
    const family = String.fromCodePoint(0x1f468, 0x200d, 0x1f469);
    for (const [text, url] of [
      [`https://naver.me/abc${heart}`, "https://naver.me/abc"],
      [`naver.me/xYz1${heart} 가보자`, "https://naver.me/xYz1"],
      [`https://toss.tech/a${thumbsUp}`, "https://toss.tech/a"],
      [`https://toss.tech/a${family}`, "https://toss.tech/a"],
      [`https://toss.tech/a${thumbsUp}!`, "https://toss.tech/a"],
      [`https://naver.me/abc에서${heart}`, "https://naver.me/abc"],
    ]) {
      expect(findLinkInText(text)).toEqual(accepted(url));
    }
    // 직접 입력한 주소는 그대로 거부한다.
    expect(normalizeLinkUrl(`https://naver.me/abc${heart}`)).toEqual(
      rejected("invisible-char"),
    );
  });

  // 주소 중간의 이모지는 주소의 일부일 수 있다 — 이모지 도메인(i❤.ws)·경로·검색어.
  test("링크 중간의 이모지에서는 자르지 않는다", () => {
    const heart = String.fromCodePoint(0x2764);
    const star = String.fromCodePoint(0x2b50);
    for (const url of [
      `https://toss.tech/w/${star}/a`,
      `https://naver.me/abc?q=${star}&page=2`,
    ]) {
      expect(findLinkInText(url)).toEqual(accepted(url));
    }
    const emojiDomain = `https://i${heart}.ws`;
    expect(findLinkInText(`${emojiDomain} 참고`)).toEqual(
      normalizeLinkUrl(emojiDomain),
    );
  });

  // 키캡 이모지(숫자 + U+FE0F + U+20E3)의 숫자는 이모지 범위 밖이라 떼지 못한다 — 숫자만 남기면 다른 주소가 되어 거부한다.
  test("링크 끝의 키캡 이모지는 숫자만 남기지 않고 거부한다", () => {
    const keycapOne = String.fromCodePoint(0x31, 0xfe0f, 0x20e3);
    expect(findLinkInText(`https://naver.me/abc${keycapOne}`)).toEqual(
      rejected("invisible-char"),
    );
  });

  // 이체 선택자·ZWJ 는 이모지 없이 홀로 쓰이면 보이지 않는 문자다 — 거기서 자르면 다른 주소가 된다.
  test("링크 중간의 이체 선택자·ZWJ 에서 자르지 않고 보이지 않는 문자로 거부한다", () => {
    for (const text of [
      `https://naver.me/a${String.fromCodePoint(0xfe0f)}b`,
      `https://toss.tech${String.fromCodePoint(0x200d)}.evil.com`,
    ]) {
      expect(findLinkInText(text)).toEqual(rejected("invisible-char"));
    }
  });

  test("주소 안의 짝 맞는 괄호는 남긴다", () => {
    expect(
      findLinkInText("위키: https://en.wikipedia.org/wiki/Foo_(bar)."),
    ).toEqual(accepted("https://en.wikipedia.org/wiki/Foo_(bar)"));
    expect(findLinkInText("(https://en.wikipedia.org/wiki/Foo_(bar))")).toEqual(
      accepted("https://en.wikipedia.org/wiki/Foo_(bar)"),
    );
  });

  test("스킴 없는 주소는 www. 로 시작하거나 흔한 도메인 끝에 경로가 있을 때만 링크로 본다", () => {
    for (const [text, url] of [
      ["naver.me/abc", "https://naver.me/abc"],
      ["kko.to/abc", "https://kko.to/abc"],
      ["bit.ly/abc", "https://bit.ly/abc"],
      ["t.co/abc", "https://t.co/abc"],
      ["youtu.be/abc", "https://youtu.be/abc"],
      ["goo.gl/abc", "https://goo.gl/abc"],
      ["forms.gle/abc", "https://forms.gle/abc"],
      ["blog.naver.com/mashup/1", "https://blog.naver.com/mashup/1"],
      ["www.example.museum", "https://www.example.museum"],
    ]) {
      expect(findLinkInText(`보기: ${text}`)).toEqual(accepted(url));
    }
  });

  test("파일명·기술 용어·콜론이 든 문장을 링크로 착각하지 않는다", () => {
    for (const text of [
      "참고:이거 꼭 보기",
      "사진.jpg",
      "todo:장보기",
      "WIFI:S:MyNetwork;T:WPA;P:secret123;;",
      "Next.js/React 공부",
      "index.html/css 수정",
      "보고서.pdf/hwp 첨부",
      "naver.com",
      "localhost:3000/admin",
      "abc@naver.com",
    ]) {
      expect(findLinkInText(text)).toEqual(rejected("not-found"));
    }
  });

  test("링크가 없으면 찾지 못했다고 돌려준다", () => {
    expect(findLinkInText("그냥 텍스트")).toEqual(rejected("not-found"));
    expect(findLinkInText("")).toEqual(rejected("not-found"));
  });

  test("찾은 링크가 규칙에 어긋나면 그 이유를 돌려준다", () => {
    expect(findLinkInText("이거 봐 https://toss.tech@evil.com/")).toEqual(
      rejected("userinfo"),
    );
    expect(findLinkInText("file:///Users/boky/secret.pdf")).toEqual(
      rejected("blocked-scheme"),
    );
    expect(findLinkInText("https://exa|mple.com 오타")).toEqual(
      rejected("not-link"),
    );
    expect(
      findLinkInText(`긴 주소 https://example.com/${"a".repeat(2048)}`),
    ).toEqual(rejected("too-long"));
  });

  test("규칙에 어긋난 링크 뒤에 올바른 링크가 있으면 그것을 돌려준다", () => {
    expect(
      findLinkInText("https://toss.tech@evil.com/ 말고 https://toss.tech/a"),
    ).toEqual(accepted("https://toss.tech/a"));
  });

  test("아주 긴 텍스트는 앞부분만 보고, 경계에서 잘린 링크는 버린다", () => {
    const filler = "가".repeat(9_990);
    expect(findLinkInText(`${filler} https://toss.tech/abcdef`)).toEqual(
      rejected("not-found"),
    );
    expect(
      findLinkInText(`https://toss.tech/a ${"가".repeat(100_000)}`),
    ).toEqual(accepted("https://toss.tech/a"));
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

describe("isOpenableLinkUrl", () => {
  // 저장 규칙이 바뀌기 전에 저장된 링크도 열려야 한다.
  test("예전에 저장된 공백 포함 주소도 연다", () => {
    expect(
      isOpenableLinkUrl("https://www.google.com/search?q=hello world"),
    ).toBe(true);
  });

  test("앱 전용 링크도 연다", () => {
    expect(isOpenableLinkUrl("nmap://place?id=1")).toBe(true);
    expect(isOpenableLinkUrl("mailto:hello@example.com")).toBe(true);
  });

  test("위험한 스킴은 열지 않는다", () => {
    for (const url of [
      "javascript:alert(1)",
      "  JAVASCRIPT:alert(1)",
      "javascript:1/alert(1)",
      "intent://scan/#Intent;scheme=zxing;end",
      "promise9web://link/1",
      "ms-settings:privacy",
      "hxxps://evil.com/a",
    ]) {
      expect(isOpenableLinkUrl(url)).toBe(false);
    }
  });

  // 브라우저는 주소 속 탭·줄바꿈을 지우고 읽어 "java\tscript:" 도 스크립트로 연다.
  test("제어 문자·보이지 않는 문자가 섞이면 열지 않는다", () => {
    for (const url of [
      "java\tscript:alert(1)",
      "java\nscript:alert(1)",
      `https://exa${String.fromCodePoint(0x200b)}mple.com`,
      `https://example.com/${String.fromCodePoint(0x202e)}abc`,
    ]) {
      expect(isOpenableLinkUrl(url)).toBe(false);
    }
  });
});
