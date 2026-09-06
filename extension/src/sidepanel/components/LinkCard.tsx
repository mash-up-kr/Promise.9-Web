import type { ActiveTab } from "@/lib/activeTab";

/**
 * 저장 대상 카드 — 파비콘 + 제목.
 *
 * 값은 chrome 이 이미 아는 활성 탭 정보라 서버 미리보기(`GET /links/preview`)를 부르지 않는다.
 * 시안 정책: "스켈레톤 로딩 없이 바로 표시".
 */
export interface LinkCardProps {
  tab: ActiveTab;
}

export function LinkCard({ tab }: LinkCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-background-list p-4">
      <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-background-thumbnail">
        {tab.favIconUrl ? (
          <img
            src={tab.favIconUrl}
            alt=""
            className="size-full object-contain"
            aria-hidden
          />
        ) : null}
      </div>
      {/* min-w-0 이 없으면 flex 자식이 콘텐츠 폭만큼 버텨서 말줄임이 걸리지 않는다. */}
      <p className="line-clamp-2 min-w-0 flex-1 text-body-2-normal text-text-normal">
        {tab.title ?? tab.url}
      </p>
    </div>
  );
}
