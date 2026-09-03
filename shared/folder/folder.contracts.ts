import { z } from "zod";

import { FOLDER_COLOR_OPTIONS } from "./folder.constants";

/**
 * 폴더 이름 최대 길이 — 서버가 아니라 우리가 정한 값이다(서버 명세엔 길이 제한이 없다).
 * 그래서 `shared/entities`(서버 계약)가 아니라 팔레트와 같은 `shared/folder` 에 둔다.
 */
export const FOLDER_NAME_MAX_LENGTH = 20;

// 필드명은 서버 계약(POST /folders)을 따른다. 폼 값이 곧 생성 요청 입력이라 중간 매핑을 두지 않는다.
// 앱·웹의 폼과 익스텐션의 새 폴더 화면이 같은 규칙을 쓰도록 여기서 한 번만 정의한다.
export const createFolderSchema = z.object({
  folderName: z
    .string()
    .trim()
    .min(1, "폴더 이름을 입력해주세요")
    .max(
      FOLDER_NAME_MAX_LENGTH,
      `${FOLDER_NAME_MAX_LENGTH}자 이내로 입력해주세요`,
    ),
  color: z.enum(FOLDER_COLOR_OPTIONS),
});

/** 폴더 생성 폼 값 = 생성 mutation 입력. `color` 는 tone 이고 전송 시 hex 로 변환된다. */
export type CreateFolderInput = z.infer<typeof createFolderSchema>;
