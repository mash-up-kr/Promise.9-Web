import { render, screen } from "@testing-library/react-native";
import { Image } from "react-native";

import { mockRelatedLinks } from "../mock/mockLinkDetail";
import { RelatedLinksList } from "./RelatedLinksList";

describe("RelatedLinksList", () => {
  // 카드 내부 landscape 판정(Image.getSize)은 RelatedLinkCard.test.tsx 에서 별도 검증한다.
  // 이 목은 jest-expo 의 네이티브 Image.getSize 목이 New Architecture TurboModule 과
  // 맞지 않아 깨지는 것을 우회하기 위한 테스트 격리용이다.
  beforeEach(() => {
    jest
      .spyOn(Image, "getSize")
      .mockImplementation((_uri, success) => success(120, 150));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("섹션 타이틀 '함께 다시 볼 링크'를 렌더한다", async () => {
    await render(<RelatedLinksList items={mockRelatedLinks} />);
    expect(screen.getByText("함께 다시 볼 링크")).toBeOnTheScreen();
  });

  test("items 각 항목의 제목이 카드로 렌더된다", async () => {
    await render(<RelatedLinksList items={mockRelatedLinks} />);
    for (const item of mockRelatedLinks) {
      expect(screen.getByText(item.title)).toBeOnTheScreen();
    }
  });

  test("items 가 빈 배열이면 빈 상태 문구가 노출된다", async () => {
    await render(<RelatedLinksList items={[]} />);
    expect(screen.getByText("아직 함께 볼 링크가 없어요")).toBeOnTheScreen();
    expect(screen.getByText("링크가 쌓이면 비슷한 링크를")).toBeOnTheScreen();
    expect(screen.getByText("모아 보여드릴게요")).toBeOnTheScreen();
  });

  test("items 가 있으면 빈 상태 문구가 노출되지 않는다", async () => {
    await render(<RelatedLinksList items={mockRelatedLinks} />);
    expect(screen.queryByText("아직 함께 볼 링크가 없어요")).toBeNull();
  });
});
