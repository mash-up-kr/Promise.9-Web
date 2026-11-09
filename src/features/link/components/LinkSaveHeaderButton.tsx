import { withTracking } from "@/components/analytics/withTracking";
import {
  HeaderButton,
  type HeaderButtonProps,
} from "@/components/ui/bottom-sheet/BottomSheetHeader";

const TrackedHeaderButton = withTracking(HeaderButton);

/** 링크 저장 시트 전용. 공용 헤더를 쓰는 공유 익스텐션에 집계 코드를 싣지 않으려고 따로 둔다. */
export function LinkSaveHeaderButton(props: HeaderButtonProps) {
  return (
    <TrackedHeaderButton
      {...props}
      tracking={{
        label: "link.save",
        disabled: Boolean(props.isDisabled || props.isPending),
      }}
    />
  );
}
