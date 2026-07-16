import { z } from "zod";

import { FOLDER_COLOR_OPTIONS } from "./archive.constants";

export const createFolderSchema = z.object({
  name: z.string().trim().min(1, "폴더 이름을 입력해주세요"),
  color: z.enum(FOLDER_COLOR_OPTIONS),
});

export type CreateFolderForm = z.infer<typeof createFolderSchema>;
