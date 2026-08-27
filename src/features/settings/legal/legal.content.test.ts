import { LEGAL_CONTENT } from "./legal.content";

describe("LEGAL_CONTENT", () => {
  test("terms/privacy 제목과 비어있지 않은 마크다운을 제공한다", () => {
    expect(LEGAL_CONTENT.terms.title).toBe("서비스 이용약관");
    expect(LEGAL_CONTENT.privacy.title).toBe("개인정보처리방침");
    expect(LEGAL_CONTENT.terms.markdown.length).toBeGreaterThan(0);
    expect(LEGAL_CONTENT.privacy.markdown.length).toBeGreaterThan(0);
  });

  test("각 문서는 조항 제목(## 제N조)을 포함한다", () => {
    expect(LEGAL_CONTENT.terms.markdown).toContain("## 제1조 (목적)");
    expect(LEGAL_CONTENT.privacy.markdown).toContain(
      "## 제1조 (수집하는 개인정보 항목)",
    );
  });

  test("처리방침은 PIPA §30 필수 '권익침해 구제방법' 기관 연락처를 포함한다", () => {
    expect(LEGAL_CONTENT.privacy.markdown).toContain("개인정보 분쟁조정위원회");
    expect(LEGAL_CONTENT.privacy.markdown).toContain("개인정보 침해신고센터");
    expect(LEGAL_CONTENT.privacy.markdown).toContain("대검찰청");
    expect(LEGAL_CONTENT.privacy.markdown).toContain("경찰청");
  });

  test("처리방침은 열람청구 접수·처리 창구를 명시한다", () => {
    expect(LEGAL_CONTENT.privacy.markdown).toContain("열람청구");
  });

  test("약관 면책 조항은 고의·중대한 과실을 면책에서 제외한다", () => {
    // 약관규제법 §7: 고의·중과실 면책은 불공정약관으로 무효
    expect(LEGAL_CONTENT.terms.markdown).toContain("고의 또는 중대한 과실");
  });

  test("약관은 이용자 주소지를 관할법원 기준으로 명시한다", () => {
    expect(LEGAL_CONTENT.terms.markdown).toContain("주소지");
  });

  test("약관은 회원에 대한 통지 방법 조항을 포함한다", () => {
    expect(LEGAL_CONTENT.terms.markdown).toContain("(회원에 대한 통지)");
  });
});
