import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { ListGroup } from "./ListGroup";

describe("ListGroup", () => {
  test("자식들을 모두 렌더한다", async () => {
    await render(
      <ListGroup>
        <Text>이메일</Text>
        <Text>로그아웃</Text>
        <Text>회원 탈퇴</Text>
      </ListGroup>,
    );
    expect(screen.getByText("이메일")).toBeOnTheScreen();
    expect(screen.getByText("로그아웃")).toBeOnTheScreen();
    expect(screen.getByText("회원 탈퇴")).toBeOnTheScreen();
  });

  test("자식 사이에만 divider 를 넣는다 (n개 → n-1개)", async () => {
    await render(
      <ListGroup>
        <Text>이메일</Text>
        <Text>로그아웃</Text>
        <Text>회원 탈퇴</Text>
      </ListGroup>,
    );
    expect(screen.getAllByTestId("list-divider")).toHaveLength(2);
  });
});
