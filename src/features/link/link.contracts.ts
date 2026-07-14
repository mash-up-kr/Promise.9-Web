import { z } from "zod";

import { REMIND_TYPES } from "./link.constants";

export const MEMO_MAX_LENGTH = 300;

export const createLinkSchema = z.object({
  url: z.url("올바른 URL 을 입력해주세요"),
  remindType: z.enum(REMIND_TYPES, { message: "리마인드 시점을 선택해주세요" }),
  memo: z.string().max(MEMO_MAX_LENGTH, "메모가 너무 깁니다").optional(),
});

export type CreateLinkForm = z.infer<typeof createLinkSchema>;
