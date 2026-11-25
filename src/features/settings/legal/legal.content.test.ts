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

  test("처리방침은 실제 운영과 맞게 미정 문구 없이 리마인드 이메일 발송을 명시한다", () => {
    const privacy = LEGAL_CONTENT.privacy.markdown;
    expect(privacy).toContain("이메일 발송");
    // 스토어 심사는 플레이스홀더 문구를 미완성으로 본다.
    expect(privacy).not.toContain("확정되는 대로");
    expect(privacy).not.toContain("(예:");
  });

  test("처리방침은 실제 분석 수집과 맞게 보관기간·회원 식별값 미포함·거부 방법을 적는다", () => {
    const privacy = LEGAL_CONTENT.privacy.markdown;
    expect(privacy).not.toContain("분석 도구(SDK 등)를 사용하지 않습니다");
    expect(privacy).toContain("수집일로부터 24개월");
    expect(privacy).toContain(
      "회원 계정에 저장한 유입 경로는 제1호를 따릅니다",
    );
    expect(privacy).toContain("회원 식별값을 담지 않습니다");
    // 거부 방법은 설정 화면 토글 이름과 같아야 사용자가 찾을 수 있다.
    expect(privacy).toContain("설정 > 서비스 > 이용 통계 수집");
    expect(privacy).toContain("제15조 제1항 제6호");
    expect(privacy).toContain("크롬 익스텐션에서는 수집하지 않습니다");
  });

  test("처리방침은 앱 푸시 알림의 토큰 수집·목적·삭제 시점과 Expo 국외 이전을 적는다", () => {
    const privacy = LEGAL_CONTENT.privacy.markdown;
    expect(privacy).toContain("리마인드 푸시 알림");
    expect(privacy).toContain("푸시 토큰과 운영체제 종류");
    expect(privacy).toContain(
      "웹과 크롬 익스텐션에서는 푸시 토큰을 수집하지 않습니다",
    );
    // Android 12 이하는 알림 권한이 기본 허용이라 "허용하면"이 아니라 권한 상태로 적는다.
    expect(privacy).toContain("Android 12 이하는 설치 때부터 허용");
    // 로그아웃 요청은 실패·누락될 수 있고, 로그인 만료만으로는 서버가 지우지 않는다. 탈퇴는 30일 보관의 예외.
    expect(privacy).toContain("로그아웃 요청이 처리되면 삭제");
    expect(privacy).not.toContain("로그인이 만료되면 삭제");
    expect(privacy).toContain("회원 탈퇴 시에는 제1호와 달리 즉시 삭제");
    expect(privacy).toContain("650 Industries, Inc.");
    expect(privacy).toContain("앱 설치 식별값");
    expect(privacy).toContain("기기에서 Expo 로 직접");
    expect(privacy).toContain("Apple(APNs)·Google(FCM)");
    // 거부 방법은 설정 화면 토글 이름과 같아야 한다.
    expect(privacy).toContain("설정 > 알림 > 앱 푸시 알림");
    expect(privacy).toContain("기기 설정에서 링띵동 알림을 끄면");
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
