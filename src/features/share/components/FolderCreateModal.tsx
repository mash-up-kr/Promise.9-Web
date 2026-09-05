import { useState } from "react";
import { Modal } from "react-native";

import { useCreateFolderMutation } from "@/entities/folder/folder.queries";
import { FolderFormCard } from "@/features/archive/components/FolderFormCard";

export interface FolderCreateModalProps {
  onClose: () => void;
}

// 인앱 폴더 생성 카드를 익스텐션 시트 위에 띄운다 — 시트는 라우트가 아니라 화면 안이라
// RN Modal 로 감싼다. 생성한 폴더의 선택은 FolderChipList 의 목록 재조회가 맡는다.
export function FolderCreateModal({ onClose }: FolderCreateModalProps) {
  const { mutateAsync } = useCreateFolderMutation();
  const [hasFailed, setHasFailed] = useState(false);

  return (
    <Modal
      transparent
      statusBarTranslucent
      visible
      animationType="fade"
      onRequestClose={onClose}
    >
      <FolderFormCard
        title="새 폴더 만들기"
        defaultValues={{ folderName: "", color: "blue" }}
        onSubmit={(values) => mutateAsync(values)}
        onClose={onClose}
        onError={() => setHasFailed(true)}
        errorMessage={
          hasFailed ? "폴더를 만들지 못했어요. 다시 시도해주세요" : null
        }
      />
    </Modal>
  );
}
