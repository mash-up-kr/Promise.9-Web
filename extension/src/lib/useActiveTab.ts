import { useCallback, useEffect, useState } from "react";

import { type ActiveTab, getActiveTab } from "./activeTab";

/**
 * 지금 보고 있는 탭을 따라간다.
 *
 * 팝업과 달리 사이드패널은 열린 채로 남아 있어서, 사용자가 탭을 옮기거나 같은 탭에서
 * 다른 페이지로 이동하면 저장 대상도 함께 바뀌어야 한다. 안 그러면 화면에는 이전 페이지가
 * 떠 있는데 저장은 그 링크로 나가는, 사용자가 알아채기 어려운 사고가 난다.
 *
 * 아직 못 읽었을 때는 `null` — 호출부가 로딩과 "탭 없음" 을 구분할 필요는 없다.
 */
export function useActiveTab(): ActiveTab | null {
  const [tab, setTab] = useState<ActiveTab | null>(null);

  const refresh = useCallback(() => {
    void getActiveTab().then(setTab);
  }, []);

  useEffect(() => {
    refresh();

    // onActivated: 다른 탭으로 전환. onUpdated: 같은 탭에서 페이지 이동·제목 확정.
    chrome.tabs.onActivated.addListener(refresh);
    chrome.tabs.onUpdated.addListener(refresh);

    return () => {
      chrome.tabs.onActivated.removeListener(refresh);
      chrome.tabs.onUpdated.removeListener(refresh);
    };
  }, [refresh]);

  return tab;
}
