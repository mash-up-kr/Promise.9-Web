import { z } from "zod";

import { FOLDER_COLOR_OPTIONS } from "./archive.constants";

export const FOLDER_NAME_MAX_LENGTH = 20;

// 필드명은 서버 계약(POST /folders)을 따른다. 폼 값이 곧 생성 요청 입력이라 중간 매핑을 두지 않는다.
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
