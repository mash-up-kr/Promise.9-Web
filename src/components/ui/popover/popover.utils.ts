import { clamp } from "es-toolkit";

export interface PopoverTriggerRect {
  /** 트리거의 화면 절대 좌표. */
  top: number;
  left: number;
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

/** 트리거 좌상단에서 떨어뜨릴 거리. */
export interface PopoverTriggerOffset {
  left: number;
  top: number;
}

export interface PopoverOffsetPlacement {
  trigger: PopoverTriggerRect | null;
  offset: PopoverTriggerOffset;
  /** 패널 크기. 모르면(레이아웃 전) 그 축은 밀어넣기 계산을 건너뛴다. */
  panelWidth: number | null;
  panelHeight: number | null;
  windowWidth: number;
  windowHeight: number;
  safeAreaTop: number;
  safeAreaBottom: number;
  /** 화면 가장자리와 최소로 남길 여백. */
  margin: number;
}

/**
 * 트리거 좌상단 기준으로 떨어진 위치를 구한다(누른 항목 위에 겹쳐 띄우는 메뉴용).
 *
 * 트리거를 따라가되 화면 밖으로 나가지는 않게 안쪽으로 민다 — 그리드 우측 열이나 마지막 줄을
 * 눌러도 메뉴가 잘리지 않는다. 반환값은 top 과 마찬가지로 **화면 절대 좌표**다.
 */
export function resolvePopoverOffsetPosition({
  trigger,
  offset,
  panelWidth,
  panelHeight,
  windowWidth,
  windowHeight,
  safeAreaTop,
  safeAreaBottom,
  margin,
}: PopoverOffsetPlacement): { top: number; left: number } {
  // 측정 전에도 그려야 하므로 오프셋만 적용한 자리를 쓴다(측정되면 곧바로 제자리로 간다).
  if (!trigger) {
    return { top: safeAreaTop + offset.top, left: margin + offset.left };
  }

  // 패널 크기를 모르는 축은 상한을 Infinity 로 둬 밀어넣기만 건너뛴다(하한은 그대로 지킨다).
  return {
    top: clamp(
      trigger.top + offset.top,
      safeAreaTop,
      panelHeight === null
        ? Number.POSITIVE_INFINITY
        : windowHeight - safeAreaBottom - panelHeight,
    ),
    left: clamp(
      trigger.left + offset.left,
      margin,
      panelWidth === null
        ? Number.POSITIVE_INFINITY
        : windowWidth - margin - panelWidth,
    ),
  };
}
