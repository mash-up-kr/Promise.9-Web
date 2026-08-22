import type { HomeKeyword, RemindLink } from "./home.types";
import {
  HOME_KEYWORD_LIMIT,
  HOME_REMIND_LINK_LIMIT,
  selectRemindLinks,
  selectTopKeywords,
} from "./home.utils";

const remindLink = (linkId: number, reminderAt: string): RemindLink => ({
  linkId,
  title: `링크 ${linkId}`,
  source: "example.com",
  representativeTag: null,
  thumbnailUrl: null,
  savedAt: "2026-08-01T00:00:00.000Z",
  reminderAt,
});

const keyword = (name: string, linkCount: number): HomeKeyword => ({
  name,
  linkCount,
});

describe("selectRemindLinks", () => {
  it("알림 날짜가 가까운 순으로 정렬한다", () => {
    const selected = selectRemindLinks([
      remindLink(1, "2026-08-22T00:00:00.000Z"),
      remindLink(2, "2026-08-10T00:00:00.000Z"),
      remindLink(3, "2026-08-15T00:00:00.000Z"),
    ]);

    expect(selected.map((link) => link.linkId)).toEqual([2, 3, 1]);
  });

  it(`최대 ${HOME_REMIND_LINK_LIMIT} 개까지만 남긴다`, () => {
    const links = Array.from({ length: 12 }, (_, index) =>
      remindLink(
        index,
        `2026-08-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
      ),
    );

    expect(selectRemindLinks(links)).toHaveLength(HOME_REMIND_LINK_LIMIT);
  });

  it("알림이 없으면 빈 배열이다 — 섹션 자체를 숨기는 근거", () => {
    expect(selectRemindLinks([])).toEqual([]);
  });
});

describe("selectTopKeywords", () => {
  // 시안 정책: 링크 3개 이상인 태그가 3종류 이상 모였을 때만 노출.
  it("링크 3개 이상인 태그가 3종류 이상이면 링크 많은 순으로 준다", () => {
    const selected = selectTopKeywords([
      keyword("운동", 5),
      keyword("맛집", 8),
      keyword("개발", 3),
    ]);

    expect(selected.map((item) => item.name)).toEqual(["맛집", "운동", "개발"]);
  });

  it("링크 3개 미만인 태그는 종류 수에 넣지 않는다", () => {
    expect(
      selectTopKeywords([
        keyword("운동", 5),
        keyword("맛집", 8),
        keyword("개발", 2),
      ]),
    ).toEqual([]);
  });

  it("조건을 채운 태그가 3종류 미만이면 빈 배열이다", () => {
    expect(selectTopKeywords([keyword("운동", 5), keyword("맛집", 8)])).toEqual(
      [],
    );
  });

  it(`최대 ${HOME_KEYWORD_LIMIT} 개까지만 남긴다`, () => {
    const keywords = Array.from({ length: 20 }, (_, index) =>
      keyword(`태그 ${index}`, index + 3),
    );

    expect(selectTopKeywords(keywords)).toHaveLength(HOME_KEYWORD_LIMIT);
  });
});
