import { AlertCircleIcon } from "@promise9/ui/icon/AlertCircleIcon";
import { CheckCircleIcon } from "@promise9/ui/icon/CheckCircleIcon";
import { FrownIcon } from "@promise9/ui/icon/FrownIcon";
import { WifiOffIcon } from "@promise9/ui/icon/WifiOffIcon";

import { snackbarPresets } from "./snackbar.presets";

describe("snackbarPresets", () => {
  test("success 는 아이콘이 있고 액션이 없다", () => {
    const options = snackbarPresets.success("링크를 저장했어요");
    expect(options.message).toBe("링크를 저장했어요");
    expect(options.icon).toBeDefined();
    expect((options.icon as React.ReactElement).type).toBe(CheckCircleIcon);
    expect(options.action).toBeUndefined();
  });

  test("success 에 onView 를 넘기면 '보기' 액션이 붙는다", () => {
    const onView = jest.fn();
    const options = snackbarPresets.success("디자인에 저장됨", onView);
    expect(options.action?.label).toBe("보기");
    options.action?.onPress();
    expect(onView).toHaveBeenCalledTimes(1);
  });

  test("duplicate 는 아이콘이 있고 onView 없이도 액션 없이 만들 수 있다", () => {
    const options = snackbarPresets.duplicate("이미 저장한 링크예요");
    expect(options.message).toBe("이미 저장한 링크예요");
    expect((options.icon as React.ReactElement).type).toBe(AlertCircleIcon);
    expect(options.action).toBeUndefined();
  });

  test("duplicate 에 onView 를 넘기면 '보기' 액션이 붙는다", () => {
    const onView = jest.fn();
    const options = snackbarPresets.duplicate("이미 저장한 링크예요", onView);
    expect(options.action?.label).toBe("보기");
    options.action?.onPress();
    expect(onView).toHaveBeenCalledTimes(1);
  });

  test("failed 는 아이콘과 '다시 시도' 액션이 있다", () => {
    const onRetry = jest.fn();
    const options = snackbarPresets.failed("저장하지 못했어요", onRetry);
    expect((options.icon as React.ReactElement).type).toBe(FrownIcon);
    expect(options.action?.label).toBe("다시 시도");
    options.action?.onPress();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  // 같은 입력으로 다시 해도 소용없는 검증 실패는 다시 시도를 붙이지 않는다.
  test("failed 에 onRetry 를 넘기지 않으면 액션이 없다", () => {
    const options = snackbarPresets.failed("올바른 링크 주소가 아니에요");
    expect((options.icon as React.ReactElement).type).toBe(FrownIcon);
    expect(options.action).toBeUndefined();
  });

  test("offline 은 아이콘과 '다시 시도' 액션이 있고, 액션은 전달한 콜백을 그대로 호출한다", () => {
    const onRetry = jest.fn();
    const options = snackbarPresets.offline(
      "오프라인 상태예요. 연결 후 다시 시도해주세요.",
      onRetry,
    );
    expect(options.message).toBe(
      "오프라인 상태예요. 연결 후 다시 시도해주세요.",
    );
    expect(options.icon).toBeDefined();
    expect((options.icon as React.ReactElement).type).toBe(WifiOffIcon);
    expect(options.action?.label).toBe("다시 시도");
    options.action?.onPress();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
