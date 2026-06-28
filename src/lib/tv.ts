import { createTV } from "tailwind-variants";

/**
 * Pretendard 타이포 프리셋(text-title…)과 semantic 색상(text-text-…)은 둘 다
 * `text-` 접두사라, 기본 tailwind-merge 가 같은 그룹 충돌로 보고 하나를 버린다
 * (색상 vs 폰트크기). 커스텀 토큰을 각 그룹에 등록해 색상·크기가 공존하게 한다.
 *
 * 토큰 목록은 src/global.css 의 @theme 정의(--text-*, --color-text-*)와 일치시킨다.
 */
const TYPOGRAPHY_PRESETS = [
  "title",
  "heading-1",
  "heading-2",
  "heading-3",
  "body-1",
  "body-2",
  "body-3",
  "body-4",
  "label-1",
  "label-2-medium",
  "label-2-semibold",
  "caption-1",
  "caption-2",
];

const TEXT_COLORS = [
  "text-strong",
  "text-normal",
  "text-neutral",
  "text-alternative",
  "text-assistive",
  "text-inverse",
];

export const tv = createTV({
  twMergeConfig: {
    extend: {
      classGroups: {
        "font-size": [{ text: TYPOGRAPHY_PRESETS }],
        "text-color": [{ text: TEXT_COLORS }],
      },
    },
  },
});
