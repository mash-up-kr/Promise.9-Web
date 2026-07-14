/** 리마인드 타입 */
export const REMIND_TYPES = {
  soon: "soon",
  later: "later",
  reference: "reference",
} as const;

export type RemindType = keyof typeof REMIND_TYPES;

/** 리마인드 라벨 */
export const REMIND_LABELS: Record<RemindType, string> = {
  soon: "곧 활용할게요",
  later: "나중에 활용할게요",
  reference: "참고용으로 저장할게요",
} as const;

/** 리마인드 옵션 */
export const REMIND_OPTIONS = Object.entries(REMIND_TYPES).map(
  ([key, value]) => ({
    value,
    label: REMIND_LABELS[key as RemindType],
  }),
);
