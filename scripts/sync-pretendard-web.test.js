const { transform } = require("./sync-pretendard-web");

const officialRule = (index, range) => `/* [${index}] */
@font-face {
	font-family: 'Pretendard Variable';
	font-style: normal;
	font-display: swap;
	font-weight: 45 920;
	src: url(./woff2-dynamic-subset/PretendardVariable.subset.${index}.woff2) format('woff2-variations');
	unicode-range: ${range};
}
`;

const rulesOf = (css) => css.match(/@font-face\s*{[^}]*}/g) ?? [];

describe("transform", () => {
  it("공식 규칙 하나를 앱이 쓰는 family 4종으로 복제하고 굵기를 고정한다", () => {
    const { css, files } = transform(
      officialRule(0, "U+f9ca-fa0b, U+ff03-ff05"),
    );

    expect(files).toEqual(["PretendardVariable.subset.0.woff2"]);
    const rules = rulesOf(css);
    expect(rules).toHaveLength(4);
    expect(rules[0]).toContain('font-family: "Pretendard";');
    expect(rules[0]).toContain("font-weight: 45 920;");
    expect(rules[1]).toContain('font-family: "Pretendard-Medium";');
    expect(rules[1]).toContain("font-weight: 500;");
    expect(rules[2]).toContain('font-family: "Pretendard-SemiBold";');
    expect(rules[2]).toContain("font-weight: 600;");
    expect(rules[3]).toContain('font-family: "Pretendard-Bold";');
    expect(rules[3]).toContain("font-weight: 700;");
    for (const rule of rules) {
      expect(rule).toContain(
        'src: url(./pretendard/PretendardVariable.subset.0.woff2) format("woff2-variations");',
      );
      expect(rule).toContain("unicode-range: U+f9ca-fa0b, U+ff03-ff05;");
      expect(rule).toContain("font-display: swap;");
    }
  });

  it("조각마다 반복하고 파일 목록을 순서대로 돌려준다", () => {
    const { css, files } = transform(
      officialRule(0, "U+0000-00ff") + officialRule(1, "U+0100-01ff"),
    );

    expect(rulesOf(css)).toHaveLength(8);
    expect(files).toEqual([
      "PretendardVariable.subset.0.woff2",
      "PretendardVariable.subset.1.woff2",
    ]);
  });
});
