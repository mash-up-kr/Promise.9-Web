import { apiClient } from "@shared/api";
import type { SuccessResponse } from "@shared/api/api.types";
import { close, openHostApp } from "expo-share-extension";
import { useEffect, useReducer, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  getDuplicateLinkId,
  isDuplicateLinkError,
} from "@/entities/link/link.errors";

import {
  INITIAL_SHARE_SAVE_STATE,
  type ShareSaveState,
  shareSaveReducer,
} from "./share.reducer";

// NativeWind(global.css) 없이 도는 익스텐션 번들이라 스타일은 StyleSheet 로 직접 그린다.
// 색은 앱 토큰과 동일한 값(base #1a1a1a 등)을 쓴다.

interface CreatedLink {
  linkId: number;
}

interface FolderSummary {
  folderId: number;
  folderName: string;
  color: string;
}

interface FoldersResponse {
  folders: FolderSummary[];
}

const MEMO_MAX_LENGTH = 300;

/**
 * iOS Share Extension 루트 — 공유받은 URL 을 익스텐션 안에서 바로 저장한다.
 * 결과 시트(성공/실패/중복/반복실패) 전이는 share.reducer 가 정한다.
 * TODO(#85 후속): 폴더 선택·리마인드·메모 입력, 마스코트 그래픽, 미로그인 상태.
 */
export function ShareExtension({ url }: { url?: string }) {
  const [state, dispatch] = useReducer(
    shareSaveReducer,
    INITIAL_SHARE_SAVE_STATE,
  );
  // 폴더 미선택(null) = 미분류 — 인앱 저장 시트와 동일한 의미.
  const [folders, setFolders] = useState<FolderSummary[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [memo, setMemo] = useState("");
  const sharedUrl = url ?? "";

  useEffect(function loadFolderChips() {
    let cancelled = false;
    apiClient
      .get<SuccessResponse<FoldersResponse>>("/folders")
      .then(({ data }) => {
        if (!cancelled) {
          setFolders(data.data.folders);
        }
      })
      .catch((error) => {
        // 폴더는 부가 기능 — 실패해도 미분류 저장은 가능해야 한다.
        console.error("[share] 폴더 목록 로딩 실패", error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async () => {
    dispatch({ type: "SAVE_REQUESTED" });
    try {
      const { data } = await apiClient.post<SuccessResponse<CreatedLink>>(
        "/links",
        {
          url: sharedUrl,
          folderId: selectedFolderId,
          memo: memo.trim() || null,
          reminderAt: null,
        },
      );
      dispatch({ type: "SAVE_SUCCEEDED", linkId: data.data.linkId });
    } catch (error) {
      if (isDuplicateLinkError(error)) {
        dispatch({
          type: "SAVE_DUPLICATED",
          linkId: getDuplicateLinkId(error),
        });
        return;
      }
      dispatch({ type: "SAVE_FAILED" });
    }
  };

  if (state.phase === "editing" || state.phase === "saving") {
    return (
      <EntrySheet
        url={sharedUrl}
        isSaving={state.phase === "saving"}
        folders={folders}
        selectedFolderId={selectedFolderId}
        onSelectFolder={setSelectedFolderId}
        memo={memo}
        onChangeMemo={setMemo}
        onSave={save}
      />
    );
  }

  return <ResultSheet state={state} onRetry={save} />;
}

function EntrySheet({
  url,
  isSaving,
  folders,
  selectedFolderId,
  onSelectFolder,
  memo,
  onChangeMemo,
  onSave,
}: {
  url: string;
  isSaving: boolean;
  folders: FolderSummary[];
  selectedFolderId: number | null;
  onSelectFolder: (folderId: number | null) => void;
  memo: string;
  onChangeMemo: (memo: string) => void;
  onSave: () => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.handle} />
      <View style={styles.header}>
        <Pressable
          style={styles.headerButton}
          disabled={isSaving}
          onPress={() => close()}
        >
          <Text style={styles.headerButtonText}>취소</Text>
        </Pressable>
        <Text style={styles.headerTitle}>링크 저장</Text>
        <Pressable
          style={[styles.headerButton, styles.saveButton]}
          disabled={isSaving}
          onPress={onSave}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#1a1a1a" />
          ) : (
            <Text style={styles.saveButtonText}>저장</Text>
          )}
        </Pressable>
      </View>
      <View style={styles.urlCard}>
        <Text style={styles.urlText} numberOfLines={2}>
          {url}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>폴더</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.folderRow}
      >
        <FolderChip
          name="미분류"
          color={null}
          isSelected={selectedFolderId === null}
          isDisabled={isSaving}
          onPress={() => onSelectFolder(null)}
        />
        {folders.map((folder) => (
          <FolderChip
            key={folder.folderId}
            name={folder.folderName}
            color={folder.color}
            isSelected={selectedFolderId === folder.folderId}
            isDisabled={isSaving}
            onPress={() => onSelectFolder(folder.folderId)}
          />
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>메모</Text>
      <TextInput
        style={styles.memoInput}
        multiline
        maxLength={MEMO_MAX_LENGTH}
        editable={!isSaving}
        placeholder="저장한 이유나 기억하고 싶은 점을 적어보세요"
        placeholderTextColor="#6b6b6b"
        value={memo}
        onChangeText={onChangeMemo}
      />
      <Text style={styles.memoCounter}>
        {memo.length}/{MEMO_MAX_LENGTH}
      </Text>
    </View>
  );
}

function FolderChip({
  name,
  color,
  isSelected,
  isDisabled,
  onPress,
}: {
  name: string;
  color: string | null;
  isSelected: boolean;
  isDisabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      accessibilityState={{ selected: isSelected }}
      style={[styles.folderChip, isSelected && styles.folderChipSelected]}
      disabled={isDisabled}
      onPress={onPress}
    >
      {color != null && (
        <View style={[styles.folderDot, { backgroundColor: color }]} />
      )}
      <Text
        style={[
          styles.folderChipText,
          isSelected && styles.folderChipTextSelected,
        ]}
      >
        {name}
      </Text>
    </Pressable>
  );
}

// 시안(외부 공유 저장): 결과 4종은 같은 시트 구조에 문구·CTA 만 다르다.
const RESULT_CONTENT = {
  success: {
    title: "링크 저장을 완료했어요",
    subtitle: "저장한 링크는 AI 요약과 함께 확인할 수 있어요",
    cta: "링크 보러가기",
  },
  duplicate: {
    title: "이미 저장된 링크예요",
    subtitle: "이전에 저장한 링크를 확인해보세요",
    cta: "링크 보러가기",
  },
  failed: {
    title: "링크를 저장하지 못했어요",
    subtitle: "네트워크 연결을 확인한 뒤 다시 시도해주세요",
    cta: "다시 시도",
  },
  "retry-limit": {
    title: "링크를 저장하지 못했어요",
    subtitle: "잠시 후 다시 시도해주세요",
    cta: "닫기",
  },
} as const;

function ResultSheet({
  state,
  onRetry,
}: {
  state: Exclude<ShareSaveState, { phase: "editing" } | { phase: "saving" }>;
  onRetry: () => void;
}) {
  const content = RESULT_CONTENT[state.phase];

  const handleCta = () => {
    switch (state.phase) {
      case "success":
        openHostApp(`link/${state.linkId}`);
        return;
      case "duplicate":
        // 409 가 담아준 기존 링크 상세로 이동(서버 PR #109). 없으면(구버전) 홈.
        openHostApp(state.linkId != null ? `link/${state.linkId}` : "");
        return;
      case "failed":
        onRetry();
        return;
      case "retry-limit":
        close();
        return;
    }
  };

  return (
    <View style={[styles.container, styles.resultContainer]}>
      <View style={styles.handle} />
      <View style={styles.resultBody}>
        <Text style={styles.resultTitle}>{content.title}</Text>
        <Text style={styles.resultSubtitle}>{content.subtitle}</Text>
      </View>
      <Pressable style={styles.ctaButton} onPress={handleCta}>
        <Text style={styles.ctaText}>{content.cta}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3d3d3d",
    marginTop: 8,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerButton: {
    minWidth: 64,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2a2a2a",
  },
  headerButtonText: {
    color: "#ffffff",
    fontSize: 15,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#ffffff",
  },
  saveButtonText: {
    color: "#1a1a1a",
    fontSize: 15,
    fontWeight: "600",
  },
  urlCard: {
    backgroundColor: "#242424",
    borderRadius: 16,
    padding: 16,
  },
  urlText: {
    color: "#d0d0d0",
    fontSize: 14,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
  },
  folderRow: {
    flexDirection: "row",
    gap: 8,
  },
  folderChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#242424",
  },
  folderChipSelected: {
    backgroundColor: "#3a3a3a",
    borderWidth: 1,
    borderColor: "#ffffff",
  },
  folderDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  folderChipText: {
    color: "#a0a0a0",
    fontSize: 14,
  },
  folderChipTextSelected: {
    color: "#ffffff",
    fontWeight: "600",
  },
  memoInput: {
    minHeight: 96,
    borderRadius: 16,
    backgroundColor: "#242424",
    padding: 14,
    color: "#ffffff",
    fontSize: 14,
    textAlignVertical: "top",
  },
  memoCounter: {
    alignSelf: "flex-end",
    color: "#6b6b6b",
    fontSize: 12,
    marginTop: 6,
  },
  resultContainer: {
    justifyContent: "flex-end",
  },
  resultBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  resultTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  resultSubtitle: {
    color: "#a0a0a0",
    fontSize: 14,
  },
  ctaButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    color: "#1a1a1a",
    fontSize: 16,
    fontWeight: "600",
  },
});
