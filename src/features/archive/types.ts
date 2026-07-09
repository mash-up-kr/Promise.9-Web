// 폴더 아이콘 색상 톤. 기본 폴더는 gray, 사용자 폴더는 blue.
export type FolderTone = "gray" | "blue";

export type Folder = {
  id: string;
  name: string;
  count: number;
  tone: FolderTone;
};
