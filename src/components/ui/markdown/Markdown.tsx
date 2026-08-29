import RNMarkdown from "react-native-markdown-display";

// react-native-markdown-display 는 className 을 못 받아 style 객체로 매핑한다.
// hex·폰트명은 src/global.css 토큰/_layout 폰트 등록명과 일치(Logo/FolderIcon 선례로 raw 값 허용).
// 수치는 Figma setting/terms·privacy(node 1:2442·1:2475) 실측: 본문 13/18 alternative(Regular),
// 조항 제목 18/26 normal(SemiBold, 자간 -0.18).
const COLOR_TEXT_NORMAL = "#e9e9eb"; // --color-text-normal (조항 제목)
const COLOR_TEXT_ALTERNATIVE = "#8a8a93"; // --color-text-alternative (본문)
const COLOR_DIVIDER = "#2f2f33"; // --color-border-divider (gray-700)

const FONT_REGULAR = "Pretendard"; // Regular 등록명
const FONT_SEMIBOLD = "Pretendard-SemiBold";

const heading = {
  color: COLOR_TEXT_NORMAL,
  fontFamily: FONT_SEMIBOLD,
  fontSize: 18,
  lineHeight: 26,
  letterSpacing: -0.18,
  marginTop: 24,
  marginBottom: 12,
};

const markdownStyles = {
  body: {
    color: COLOR_TEXT_ALTERNATIVE,
    fontFamily: FONT_REGULAR,
    fontSize: 13,
    lineHeight: 18,
  },
  heading1: heading,
  heading2: heading,
  heading3: { ...heading, fontSize: 16, lineHeight: 24, marginTop: 16 },
  paragraph: { marginTop: 0, marginBottom: 12 },
  hr: { backgroundColor: COLOR_DIVIDER, height: 1, marginVertical: 16 },
  bullet_list: { marginBottom: 12 },
  ordered_list: { marginBottom: 12 },
  list_item: { marginBottom: 8 },
  link: {
    color: COLOR_TEXT_NORMAL,
    textDecorationLine: "underline" as const,
  },
};

export interface MarkdownProps {
  children: string;
}

export function Markdown({ children }: MarkdownProps) {
  return <RNMarkdown style={markdownStyles}>{children}</RNMarkdown>;
}
