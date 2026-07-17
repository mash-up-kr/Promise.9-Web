import type { LinkFolderRef, LinkTag } from "@shared/types/link.types";
import { z } from "zod";

import { REMIND_TYPES } from "./link.constants";

/** 서버는 1000자까지 허용하지만 Figma 스펙상 300자로 더 좁게 제한한다(의도된 차이). */
export const MEMO_MAX_LENGTH = 300;

/** 링크당 태그 개수 상한 — 서버 제약이 아니라 프론트/디자인 규칙이다. */
export const MAX_TAGS = 10;

/** 태그 이름 길이 상한 — 서버 `CreateLinkTagDto.name`(공백 제거 후 1~20자)에 맞춘다. */
export const TAG_NAME_MAX_LENGTH = 20;

export const createLinkSchema = z.object({
  url: z.url("올바른 URL 을 입력해주세요"),
  remindType: z.enum(REMIND_TYPES, { message: "리마인드 시점을 선택해주세요" }),
  memo: z.string().max(MEMO_MAX_LENGTH, "메모가 너무 깁니다").optional(),
});

export type CreateLinkForm = z.infer<typeof createLinkSchema>;

/**
 * 링크 상세 화면 폼 — 링크 하나를 편집하는 단일 폼.
 *
 * `folder`/`tags` 는 사용자가 자유 입력하는 값이 아니라(각각 폴더 선택 결과·태그 이름 입력으로
 * 만들어지는 객체) 서버·우리 코드가 shape 를 보장하므로 `z.custom` 으로 타입만 싣는다.
 * `shared/types/link.types.ts` 의 인터페이스를 여기서 zod 로 다시 정의하면 이중 출처가 된다.
 *
 * `folder` 는 id 가 아니라 객체를 든다 — 화면(FolderBadge)이 폴더 이름을 그려야 하기 때문.
 * 저장 시점(#33)에 `folderId: folder?.folderId ?? null` 로 변환해 PATCH 로 보낸다.
 */
export const linkDetailFormSchema = z.object({
  folder: z.custom<LinkFolderRef>().nullable(),
  tags: z.array(z.custom<LinkTag>()).max(MAX_TAGS, "태그가 너무 많습니다"),
  memo: z.string().max(MEMO_MAX_LENGTH, "메모가 너무 깁니다"),
  isFavorite: z.boolean(),
});

export type LinkDetailForm = z.infer<typeof linkDetailFormSchema>;
