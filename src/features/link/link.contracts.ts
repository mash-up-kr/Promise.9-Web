import type { LinkFolderRef } from "@shared/types/link.types";
import { z } from "zod";

import type { ReminderValue } from "@/features/link/reminder.utils";

/** 서버는 1000자까지 허용하지만 Figma 스펙상 300자로 더 좁게 제한한다(의도된 차이). */
export const MEMO_MAX_LENGTH = 300;

// 웹 링크만 저장 대상 — file:·javascript: 등 비웹 스킴은 거부한다.
// 붙여넣기·프리뷰 커밋(blur)·저장 시점의 형식 검사에 쓴다 — createLinkSchema.url 과는 분리된
// 스키마다(저장 버튼 활성화 조건은 형식 무관, 비어있지 않음뿐이라 시안 정책).
export const linkUrlSchema = z.url({
  protocol: /^https?$/,
  error: "올바른 URL 을 입력해주세요",
});

export const createLinkSchema = z.object({
  // 형식 검증은 저장 시점에 linkUrlSchema 로 별도 수행한다.
  url: z.string().trim().min(1, "URL 을 입력해주세요"),
  folderId: z.number().nullable(),
  reminder: z.custom<ReminderValue>().nullable(),
  memo: z.string().max(MEMO_MAX_LENGTH, "메모가 너무 깁니다").optional(),
  // LinkPreviewCard 트리거용 — blur 로 확정된 URL(저장 payload 엔 미포함).
  previewUrl: z.string().optional(),
});

export type CreateLinkForm = z.infer<typeof createLinkSchema>;

/**
 * 링크 상세 화면 폼 — 링크 하나를 편집하는 단일 폼.
 *
 * `folder` 는 사용자가 자유 입력하는 값이 아니라(폴더 선택 결과로 만들어지는 객체)
 * 서버·우리 코드가 shape 를 보장하므로 `z.custom` 으로 타입만 싣는다.
 * `shared/types/link.types.ts` 의 인터페이스를 여기서 zod 로 다시 정의하면 이중 출처가 된다.
 *
 * `folder` 는 id 가 아니라 객체를 든다 — 화면(FolderBadge)이 폴더 이름을 그려야 하기 때문.
 * 저장 시점(#33)에 `folderId: folder?.folderId ?? null` 로 변환해 PATCH 로 보낸다.
 */
export const linkDetailFormSchema = z.object({
  folder: z.custom<LinkFolderRef>().nullable(),
  memo: z.string().max(MEMO_MAX_LENGTH, "메모가 너무 깁니다"),
  isFavorite: z.boolean(),
});

export type LinkDetailForm = z.infer<typeof linkDetailFormSchema>;
