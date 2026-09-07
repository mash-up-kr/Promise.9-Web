import { render, screen, userEvent } from "@testing-library/react-native";

import { AgreementText } from "./AgreementText";

test("이용약관을 누르면 약관 열기를 요청한다", async () => {
  const onOpenLegal = jest.fn();
  await render(<AgreementText onOpenLegal={onOpenLegal} />);

  await userEvent.setup().press(screen.getByText("이용약관"));

  expect(onOpenLegal).toHaveBeenCalledWith("terms");
});

test("개인정보처리방침을 누르면 방침 열기를 요청한다", async () => {
  const onOpenLegal = jest.fn();
  await render(<AgreementText onOpenLegal={onOpenLegal} />);

  await userEvent.setup().press(screen.getByText("개인정보처리방침"));

  expect(onOpenLegal).toHaveBeenCalledWith("privacy");
});
