import { z } from "zod";

import { FOLDER_COLOR_OPTIONS } from "./archive.constants";

export const FOLDER_NAME_MAX_LENGTH = 20;

export const createFolderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "폴더 이름을 입력해주세요")
    .max(
      FOLDER_NAME_MAX_LENGTH,
      `${FOLDER_NAME_MAX_LENGTH}자 이내로 입력해주세요`,
    ),
  color: z.enum(FOLDER_COLOR_OPTIONS),
});

export type CreateFolderForm = z.infer<typeof createFolderSchema>;
