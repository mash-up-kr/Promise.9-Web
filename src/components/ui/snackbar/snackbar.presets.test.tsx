import { CheckCircleIcon } from "@/components/ui/icon/CheckCircleIcon";
import { WifiOffIcon } from "@/components/ui/icon/WifiOffIcon";

import { snackbarPresets } from "./snackbar.presets";

describe("snackbarPresets", () => {
  test("success 는 아이콘이 있고 액션이 없다", () => {
    const options = snackbarPresets.success("링크를 저장했어요");
    expect(options.message).toBe("링크를 저장했어요");
    expect(options.icon).toBeDefined();
    expect((options.icon as React.ReactElement).type).toBe(CheckCircleIcon);
    expect(options.action).toBeUndefined();
  });

  test("offline 은 아이콘과 '다시 시도' 액션이 있고, 액션은 전달한 콜백을 그대로 호출한다", () => {
    const onRetry = jest.fn();
    const options = snackbarPresets.offline(onRetry);
    expect(options.message).toBe("오프라인 상태예요. 연결되면 저장할게요.");
    expect(options.icon).toBeDefined();
    expect((options.icon as React.ReactElement).type).toBe(WifiOffIcon);
    expect(options.action?.label).toBe("다시 시도");
    options.action?.onPress();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
