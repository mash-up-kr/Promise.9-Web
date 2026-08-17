export interface PopoverTriggerRect {
  /** 트리거의 화면 절대 y. */
  top: number;
  height: number;
}

export interface PopoverPlacement {
  /** 아직 재지 못했으면 null (측정은 비동기다). */
  trigger: PopoverTriggerRect | null;
  /** 패널 높이. 레이아웃 전이라 첫 프레임엔 모를 수 있다. */
  panelHeight: number | null;
  windowHeight: number;
  safeAreaTop: number;
  safeAreaBottom: number;
  gap: number;
}

/**
 * 팝오버 패널의 top 을 구한다.
 *
 * 기본은 트리거 바로 아래고, 아래 공간이 모자랄 때만 위로 뒤집는다.
 * 패널은 화면 전체를 덮는 Modal 안에 절대배치되므로 반환값은 **화면 절대 좌표**다
 * (safe-area 기준이 아니다 — 상단 여백을 빼면 헤더를 덮는다).
 *
 * 측정값이 없는 동안(트리거 미측정)에도 배치는 해야 하므로 safe-area 바로 아래로 둔다.
 * 패널 높이를 모르면 뒤집을지 판단할 수 없으니 아래 배치를 유지한다.
 */
export function resolvePopoverTop({
  trigger,
  panelHeight,
  windowHeight,
  safeAreaTop,
  safeAreaBottom,
  gap,
}: PopoverPlacement): number {
  if (!trigger) {
    return safeAreaTop + gap;
  }

  const below = trigger.top + trigger.height + gap;
  const fitsBelow =
    panelHeight === null ||
    below + panelHeight <= windowHeight - safeAreaBottom;

  if (fitsBelow) {
    return below;
  }

  return Math.max(safeAreaTop, trigger.top - panelHeight - gap);
}
