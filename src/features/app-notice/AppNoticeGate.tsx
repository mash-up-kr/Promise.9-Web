import { openExternalUrl } from "@/utils/openExternalUrl";

import { STORE_URL } from "./appNotice.constants";
import { UpdateDialog } from "./components/UpdateDialog";
import { useUpdateGate } from "./hooks/useUpdateGate";

interface AppNoticeGateProps {
  /** false 면 기준은 읽어 두되 그리지 않는다 — 스플래시가 걷히자마자 띄울 수 있게. */
  isVisible: boolean;
}

/**
 * 앱 실행 시의 안내를 한곳에서 띄운다 — 루트에 하나만 마운트한다(네이티브 전용).
 *
 * 띄울 게 없으면 아무것도 그리지 않는다. 후기 요청은 여기 있지 않다 — 저장을 끝낸 시점에
 * 판단해 OS 리뷰 창을 띄운다(reviewPrompt.ts).
 */
export function AppNoticeGate({ isVisible }: AppNoticeGateProps) {
  const { kind, latestVersion, dismiss } = useUpdateGate();

  if (!isVisible || kind === "none" || latestVersion === null) {
    return null;
  }

  return (
    <UpdateDialog
      kind={kind}
      latestVersion={latestVersion}
      onDismiss={dismiss}
      onUpdate={openStore}
    />
  );
}

// 스토어 주소가 설정돼 있지 않으면(app.json 누락) 할 수 있는 게 없다 — 조용히 넘긴다.
function openStore() {
  if (STORE_URL !== null) {
    openExternalUrl(STORE_URL);
  }
}
