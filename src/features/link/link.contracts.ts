import { z } from "zod";

import { REMIND_TYPES } from "./link.constants";

export const MEMO_MAX_LENGTH = 300;

export const createLinkSchema = z.object({
  // 웹 링크만 저장 대상 — file:·javascript: 등 비웹 스킴은 거부한다.
  url: z.url({ protocol: /^https?$/, error: "올바른 URL 을 입력해주세요" }),
  remindType: z.enum(REMIND_TYPES, { message: "리마인드 시점을 선택해주세요" }),
  memo: z.string().max(MEMO_MAX_LENGTH, "메모가 너무 깁니다").optional(),
  // LinkPreviewCard 트리거용 — blur 로 확정된 URL(저장 payload 엔 미포함).
  previewUrl: z.string().optional(),
});

export type CreateLinkForm = z.infer<typeof createLinkSchema>;
