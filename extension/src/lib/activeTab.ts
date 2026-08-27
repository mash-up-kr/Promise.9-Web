/** 지금 활성인 탭의 정보. 서버를 부르지 않고 chrome 이 이미 아는 값만 쓴다. */
export interface ActiveTab {
  url: string | undefined;
  title: string | undefined;
  favIconUrl: string | undefined;
}

/**
 * 활성 탭의 url·title·favicon 을 읽는다.
 *
 * 사이드패널은 열린 채 탭을 옮겨다니므로 상시 `tabs` 권한으로 읽는다. 탭 전환을 따라가는
 * 구독은 `useActiveTab` 이 맡는다. 시안 정책상 카드는 이 값으로 채워진 채 시작한다(스켈레톤 없음).
 */
export async function getActiveTab(): Promise<ActiveTab> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  return {
    url: tab?.url,
    title: tab?.title,
    favIconUrl: tab?.favIconUrl,
  };
}
