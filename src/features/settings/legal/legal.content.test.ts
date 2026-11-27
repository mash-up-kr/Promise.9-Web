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
      "회원 계정에 저장한 유입 경로는 제1호·제2호를 따릅니다",
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
    // 등록은 로그인·권한 허용·앱 실행 때 모두 일어난다(usePushTokenSync).
    expect(privacy).toContain(
      "로그인하거나 알림을 허용할 때, 그리고 로그인 상태로 앱을 실행할 때",
    );
    expect(privacy).not.toContain("앱을 실행할 때마다");
    // 로그아웃 요청은 토큰이 빠지거나 재시도되지 않을 수 있고, 로그인 만료만으로는 서버가 지우지 않는다. 탈퇴는 30일 보관의 예외.
    expect(privacy).toContain("로그아웃할 때 삭제를 요청");
    expect(privacy).toContain("다시 로그인한 계정으로 옮겨지거나");
    expect(privacy).not.toContain("로그인이 만료되면 삭제");
    expect(privacy).toContain("회원 탈퇴 시에는 제2호와 같이 즉시 삭제");
    expect(privacy).toContain("650 Industries, Inc.");
    expect(privacy).toContain("앱 설치 식별값");
    expect(privacy).toContain("기기에서 Expo 로 직접");
    expect(privacy).toContain("Apple(APNs)·Google(FCM)");
    // 거부 방법은 설정 화면 토글 이름과 같아야 한다.
    // 기기 알림이 꺼진 기기에서는 앱 푸시 알림 토글이 꺼진 것으로 보여 계정 설정을 끌 수 없다.
    expect(privacy).toContain(
      "기기 알림이 허용된 기기의 앱에서 설정 > 알림 > 앱 푸시 알림을 끄면",
    );
    expect(privacy).not.toContain("앱 푸시 알림을 끄면 멈춥니다");
    expect(privacy).toContain("기기 설정에서 링띵동 알림을 끄면");
    // 기기 알림을 꺼도 서버 토큰은 남아 알림 내용 전송은 계속될 수 있다.
    expect(privacy).toContain("알림 내용이 계속 전송될 수 있으므로");
  });

  // 시행령 §31①2: 국외 이전의 근거, 법 §28조의8②3: 이전받는 자의 명칭과 연락처
  test("처리방침은 국외 이전의 근거와 이전받는 회사마다 연락처를 적는다", () => {
    const privacy = LEGAL_CONTENT.privacy.markdown;
    expect(privacy).toContain("제28조의8 제1항 제3호");
    expect(privacy).toContain("연락처: privacy@openai.com");
    expect(privacy).toContain("연락처: support@tinyfish.ai");
    expect(privacy).toContain("연락처: https://expo.dev/contact");
  });

  // 법 §30①2·3의2: 처리·보유 기간과 파기, 법령상 보존 시 그 근거와 항목
  test("처리방침은 보유기간·탈퇴 때 지우는 항목·법령상 보존 여부를 구체적으로 적는다", () => {
    const privacy = LEGAL_CONTENT.privacy.markdown;
    expect(privacy).toContain("회원 탈퇴 시까지 보유·이용");
    // 서버는 탈퇴 즉시 소셜 계정 연결·리프레시 토큰·푸시 토큰을 지운다.
    expect(privacy).toContain(
      "소셜 계정 연결 정보, 로그인 유지용 토큰, 푸시 토큰은 즉시 삭제",
    );
    expect(privacy).toContain("따로 보존하는 개인정보는 없습니다");
    expect(privacy).not.toContain("관계 법령에 특별한 보존 규정");
    expect(privacy).not.toContain("부정이용 방지 등을");
  });

  test("처리방침은 소셜 로그인에서 받는 회원 식별값을 수집 항목에 적는다", () => {
    expect(LEGAL_CONTENT.privacy.markdown).toContain(
      "이메일 주소와 그 서비스의 회원 식별값",
    );
  });

  // 법 §29·시행령 §30①: 실제로 하는 조치만 적는다.
  test("처리방침은 안전성 확보 조치를 실제 조치로 구체적으로 적는다", () => {
    const privacy = LEGAL_CONTENT.privacy.markdown;
    expect(privacy).toContain("다단계 인증");
    expect(privacy).toContain("HTTPS");
    expect(privacy).toContain("해시값으로 저장");
    expect(privacy).not.toContain("해킹 등에 대비한 기술적 대책");
  });

  test("처리방침은 개정 이력에 지금 시행일과 최초 시행일을 적는다", () => {
    const privacy = LEGAL_CONTENT.privacy.markdown;
    const effective = privacy.match(
      /시행일: (\d{4}년 \d{1,2}월 \d{1,2}일)/,
    )?.[1];
    expect(privacy).toContain("## 개정 이력");
    expect(privacy).toContain(`- ${effective} 시행`);
    expect(privacy).toContain("- 2026년 8월 29일 시행");
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
