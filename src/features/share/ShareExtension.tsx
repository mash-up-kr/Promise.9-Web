import { apiClient } from "@shared/api";
import type { SuccessResponse } from "@shared/api/api.types";
import {
  FOLDER_TONE_HEX,
  folderToneToHex,
  type SelectableFolderColor,
} from "@shared/folder/folder.constants";
import { Calendar, Clock, Plus } from "lucide-react-native";
import type { PropsWithChildren } from "react";
import { useEffect, useReducer, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { BellIcon } from "@/components/ui/icon/BellIcon";
import { DiceIcon } from "@/components/ui/icon/DiceIcon";
import { FolderIcon } from "@/components/ui/icon/FolderIcon";
import { isAndroid } from "@/constants/platform.constants";
import { isDuplicateFolderNameError } from "@/entities/folder/folder.errors";
import {
  getDuplicateLinkId,
  isDuplicateLinkError,
} from "@/entities/link/link.errors";
import { FOLDER_COLOR_OPTIONS } from "@/features/archive/archive.constants";
import {
  formatReminderDate,
  formatReminderTime,
  getRandomReminderDays,
  type ReminderValue,
  toReminderAtIso,
} from "@/features/link/reminder.utils";
import {
  addDaysDate,
  getTomorrowDate,
  roundUpToQuarter,
} from "@/utils/datetime";

import {
  INITIAL_SHARE_SAVE_STATE,
  type ShareSaveState,
  shareSaveReducer,
} from "./share.reducer";
import { close, openHostApp } from "./shareHost";

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
  // 리마인드 — 인앱 ReminderSection 과 같은 의미 구조(값·프리셋). 날짜/시간 정밀 조정
  // 피커와 알림 권한 요청은 익스텐션 프로세스 제약으로 메인 앱에 맡긴다.
  const [reminder, setReminder] = useState<ReminderValue | null>(null);
  const [selectedPresetDays, setSelectedPresetDays] = useState<number | null>(
    null,
  );
  const sharedUrl = url ?? "";

  const toggleReminder = (isEnabled: boolean) => {
    if (!isEnabled) {
      setSelectedPresetDays(null);
      setReminder(null);
      return;
    }
    setSelectedPresetDays(1);
    setReminder({ date: getTomorrowDate(), ...roundUpToQuarter() });
  };

  const selectPreset = (days: number) => {
    if (!reminder) return;
    setSelectedPresetDays(days);
    setReminder({ ...reminder, date: addDaysDate(days) });
  };

  const selectRandomDate = () => {
    if (!reminder) return;
    setSelectedPresetDays(null);
    setReminder({ ...reminder, date: addDaysDate(getRandomReminderDays()) });
  };

  // 인앱 시트와 같은 정책 — 방금 만든 폴더는 곧바로 선택한다.
  const handleFolderCreated = (folder: FolderSummary) => {
    setFolders((prev) => [...prev, folder]);
    setSelectedFolderId(folder.folderId);
  };

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
          reminderAt: reminder ? toReminderAtIso(reminder) : null,
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

  const isEditing = state.phase === "editing" || state.phase === "saving";

  return (
    <ShareSheetContainer height={isEditing ? 650 : 400}>
      {isEditing ? (
        <EntrySheet
          url={sharedUrl}
          isSaving={state.phase === "saving"}
          folders={folders}
          selectedFolderId={selectedFolderId}
          onSelectFolder={setSelectedFolderId}
          onFolderCreated={handleFolderCreated}
          reminder={reminder}
          selectedPresetDays={selectedPresetDays}
          onToggleReminder={toggleReminder}
          onSelectPreset={selectPreset}
          onSelectRandomDate={selectRandomDate}
          memo={memo}
          onChangeMemo={setMemo}
          onSave={save}
        />
      ) : (
        <ResultSheet state={state} onRetry={save} />
      )}
    </ShareSheetContainer>
  );
}

// iOS 는 익스텐션 컨테이너 자체가 시트라 그대로 통과시키고,
// Android 는 반투명 액티비티 전체 위에 딤 + 하단 시트를 직접 그린다(탭 아웃 = 닫기).
function ShareSheetContainer({
  height,
  children,
}: PropsWithChildren<{ height: number }>) {
  if (!isAndroid) {
    return children;
  }
  return (
    <View style={styles.androidRoot}>
      <Pressable
        accessibilityLabel="닫기"
        style={StyleSheet.absoluteFill}
        onPress={() => close()}
      />
      <View style={[styles.androidSheet, { height }]}>{children}</View>
    </View>
  );
}

function EntrySheet({
  url,
  isSaving,
  folders,
  selectedFolderId,
  onSelectFolder,
  onFolderCreated,
  reminder,
  selectedPresetDays,
  onToggleReminder,
  onSelectPreset,
  onSelectRandomDate,
  memo,
  onChangeMemo,
  onSave,
}: {
  url: string;
  isSaving: boolean;
  folders: FolderSummary[];
  selectedFolderId: number | null;
  onSelectFolder: (folderId: number | null) => void;
  onFolderCreated: (folder: FolderSummary) => void;
  reminder: ReminderValue | null;
  selectedPresetDays: number | null;
  onToggleReminder: (isEnabled: boolean) => void;
  onSelectPreset: (days: number) => void;
  onSelectRandomDate: () => void;
  memo: string;
  onChangeMemo: (memo: string) => void;
  onSave: () => void;
}) {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

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
      {/* 시트 높이는 빌드 타임 고정(iOS) — 콘텐츠가 넘치는 작은 화면·리마인드 On 상태는
          세로 스크롤로 흡수한다. 헤더(취소·저장)는 스크롤 밖에 고정. */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.entryScrollContent}
      >
        <View style={styles.urlCard}>
          <Text style={styles.urlText} numberOfLines={2}>
            {url}
          </Text>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, styles.sectionTitleInRow]}>
            폴더
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="폴더 추가"
            hitSlop={8}
            disabled={isSaving}
            onPress={() => setIsCreatingFolder((isOpen) => !isOpen)}
          >
            <Plus size={24} color="#fffe66" />
          </Pressable>
        </View>
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
        {isCreatingFolder && (
          <FolderCreateForm
            isDisabled={isSaving}
            onCreated={(folder) => {
              setIsCreatingFolder(false);
              onFolderCreated(folder);
            }}
          />
        )}

        <View style={styles.reminderHeader}>
          <Text style={[styles.sectionTitle, styles.sectionTitleInRow]}>
            리마인드
          </Text>
          <ReminderToggle
            isOn={reminder !== null}
            isDisabled={isSaving}
            onToggle={onToggleReminder}
          />
        </View>
        {reminder === null ? (
          <View style={[styles.reminderCard, styles.reminderOffRow]}>
            <BellIcon color="#8A8A93" />
            <Text style={styles.reminderPlaceholder}>
              잊지 않도록 다시 알려드려요
            </Text>
          </View>
        ) : (
          <ReminderOnCard
            reminder={reminder}
            selectedPresetDays={selectedPresetDays}
            isDisabled={isSaving}
            onSelectPreset={onSelectPreset}
            onSelectRandomDate={onSelectRandomDate}
          />
        )}

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
      </ScrollView>
    </View>
  );
}

// 미분류 folder 아이콘 색 — 인앱 FolderChipList 와 동일한 Figma 기준(folder/gray).
const UNCLASSIFIED_FOLDER_COLOR = "#65656B";

const FOLDER_NAME_MAX_LENGTH = 20;

// 인앱 폴더 생성 폼(FolderFormSheet)의 익스텐션판 — 이름·색을 받아 POST /folders 로
// 만들고 성공 시 목록에 반영한다. 기본 색은 인앱과 동일하게 blue.
function FolderCreateForm({
  isDisabled,
  onCreated,
}: {
  isDisabled: boolean;
  onCreated: (folder: FolderSummary) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<SelectableFolderColor>("blue");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    const folderName = name.trim();
    if (folderName === "" || isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const { data } = await apiClient.post<SuccessResponse<FolderSummary>>(
        "/folders",
        { folderName, color: folderToneToHex(color) },
      );
      onCreated(data.data);
    } catch (error) {
      setErrorMessage(
        isDuplicateFolderNameError(error)
          ? "이미 있는 폴더 이름이에요"
          : "폴더를 만들지 못했어요. 다시 시도해주세요",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.folderCreateForm}>
      <TextInput
        style={styles.folderNameInput}
        placeholder="폴더 이름"
        placeholderTextColor="#6b6b6b"
        maxLength={FOLDER_NAME_MAX_LENGTH}
        editable={!isDisabled && !isSubmitting}
        value={name}
        onChangeText={setName}
      />
      <View style={styles.colorSwatchRow}>
        {FOLDER_COLOR_OPTIONS.map((tone) => (
          <Pressable
            key={tone}
            accessibilityRole="button"
            accessibilityLabel={`색상 ${tone}`}
            accessibilityState={{ selected: color === tone }}
            disabled={isDisabled || isSubmitting}
            onPress={() => setColor(tone)}
            style={[
              styles.colorSwatch,
              { backgroundColor: FOLDER_TONE_HEX[tone] },
              color === tone && styles.colorSwatchSelected,
            ]}
          />
        ))}
      </View>
      {errorMessage != null && (
        <Text style={styles.folderCreateError}>{errorMessage}</Text>
      )}
      <Pressable
        style={styles.folderCreateButton}
        disabled={isDisabled || isSubmitting || name.trim() === ""}
        onPress={submit}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#1a1a1a" />
        ) : (
          <Text style={styles.folderCreateButtonText}>만들기</Text>
        )}
      </Pressable>
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
      <FolderIcon size={16} color={color ?? UNCLASSIFIED_FOLDER_COLOR} />
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

// 인앱 ReminderSection 의 프리셋과 동일(컴포넌트는 NativeWind 의존이라 값만 미러링).
const REMINDER_PRESETS = [
  { days: 1, label: "내일" },
  { days: 3, label: "3일 후" },
  { days: 7, label: "7일 후" },
  { days: 14, label: "14일 후" },
];

// 인앱 Toggle 시안 미러 — 트랙 On=gray-50/Off=gray-400, 노브 On=20/Off=16 모두 gray-800.
function ReminderToggle({
  isOn,
  isDisabled,
  onToggle,
}: {
  isOn: boolean;
  isDisabled: boolean;
  onToggle: (isEnabled: boolean) => void;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel="리마인드"
      accessibilityState={{ checked: isOn }}
      hitSlop={8}
      disabled={isDisabled}
      onPress={() => onToggle(!isOn)}
      style={[styles.toggleTrack, isOn && styles.toggleTrackOn]}
    >
      <View style={[styles.toggleKnob, isOn && styles.toggleKnobOn]} />
    </Pressable>
  );
}

function ReminderOnCard({
  reminder,
  selectedPresetDays,
  isDisabled,
  onSelectPreset,
  onSelectRandomDate,
}: {
  reminder: ReminderValue;
  selectedPresetDays: number | null;
  isDisabled: boolean;
  onSelectPreset: (days: number) => void;
  onSelectRandomDate: () => void;
}) {
  return (
    <View style={styles.reminderCardOn}>
      <View style={styles.reminderQuestionRow}>
        <BellIcon color="#E9E9EB" />
        <Text style={styles.reminderQuestion}>언제 알려드릴까요?</Text>
      </View>
      <View style={styles.presetRow}>
        {REMINDER_PRESETS.map((preset) => (
          <PresetChip
            key={preset.days}
            label={preset.label}
            isSelected={selectedPresetDays === preset.days}
            isDisabled={isDisabled}
            onPress={() => onSelectPreset(preset.days)}
          />
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="랜덤 날짜"
          style={styles.presetChip}
          disabled={isDisabled}
          onPress={onSelectRandomDate}
        >
          <DiceIcon />
        </Pressable>
      </View>
      <View style={styles.reminderDivider} />
      <View style={styles.reminderValueRow}>
        <View style={styles.reminderValueItem}>
          <Calendar size={16} color="#E9E9EB" />
          <Text style={styles.reminderValueText}>
            {formatReminderDate(reminder.date)}
          </Text>
        </View>
        <View style={styles.reminderValueItem}>
          <Clock size={16} color="#E9E9EB" />
          <Text style={styles.reminderValueText}>
            {formatReminderTime(reminder.hour, reminder.minute)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function PresetChip({
  label,
  isSelected,
  isDisabled,
  onPress,
}: {
  label: string;
  isSelected: boolean;
  isDisabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isSelected }}
      disabled={isDisabled}
      onPress={onPress}
      style={[styles.presetChip, isSelected && styles.presetChipSelected]}
    >
      <Text
        style={[
          styles.presetChipText,
          isSelected && styles.presetChipTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// 시안(외부 공유 저장): 결과 4종은 같은 시트 구조에 그래픽·문구·CTA 만 다르다.
// 그래픽은 시트 배경(#1a1a1a)과 같은 색으로 flatten 된 통짜 PNG(@2x·@3x 밀도 선택).
const RESULT_GRAPHICS = {
  success: require("@/assets/images/share/result-success.png"),
  duplicate: require("@/assets/images/share/result-duplicate.png"),
  failed: require("@/assets/images/share/result-failed.png"),
  "retry-limit": require("@/assets/images/share/result-retry-limit.png"),
} as const;

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
        <Image
          testID={`share-result-${state.phase}`}
          source={RESULT_GRAPHICS[state.phase]}
          style={styles.resultImage}
        />
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
  androidRoot: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  androidSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
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
  // 인앱 Folder Chip / SaveSheet 미러 — h40·px12·gap4, 선택=white-10 bg, 비선택=white-05 테두리.
  folderChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ffffff0d",
  },
  folderChipSelected: {
    backgroundColor: "#ffffff1a",
    borderColor: "transparent",
  },
  folderChipText: {
    color: "#8a8a93",
    fontSize: 14,
  },
  folderChipTextSelected: {
    color: "#fafafa",
  },
  entryScrollContent: {
    paddingBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 10,
  },
  folderCreateForm: {
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: "#ffffff1a",
    padding: 16,
    gap: 12,
  },
  folderNameInput: {
    height: 44,
    borderRadius: 12,
    backgroundColor: "#0000004d",
    paddingHorizontal: 14,
    color: "#ffffff",
    fontSize: 14,
  },
  colorSwatchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  colorSwatch: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  colorSwatchSelected: {
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  folderCreateError: {
    color: "#ee97a4",
    fontSize: 13,
  },
  folderCreateButton: {
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  folderCreateButtonText: {
    color: "#1a1a1a",
    fontSize: 14,
    fontWeight: "600",
  },
  reminderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitleInRow: {
    marginTop: 0,
    marginBottom: 0,
  },
  // 인앱 카드 토큰 미러 — bg opacity-white-10(#ffffff1a), placeholder text-alternative 근사.
  reminderCard: {
    borderRadius: 16,
    backgroundColor: "#ffffff1a",
    padding: 16,
  },
  reminderPlaceholder: {
    color: "#8A8A93",
    fontSize: 14,
  },
  reminderCardOn: {
    borderRadius: 16,
    backgroundColor: "#ffffff1a",
    padding: 16,
    gap: 12,
  },
  reminderOffRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reminderQuestionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reminderQuestion: {
    color: "#ffffff",
    fontSize: 14,
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 4,
  },
  presetChip: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0000004d",
  },
  presetChipSelected: {
    backgroundColor: "#ffffffcc",
  },
  presetChipText: {
    color: "#ffffffb2",
    fontSize: 13,
    fontWeight: "600",
  },
  presetChipTextSelected: {
    color: "#17171b",
  },
  reminderDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#ffffff1a",
  },
  reminderValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reminderValueItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reminderValueText: {
    color: "#ffffff",
    fontSize: 14,
  },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 4,
    backgroundColor: "#65656b",
  },
  toggleTrackOn: {
    justifyContent: "flex-end",
    padding: 2,
    backgroundColor: "#fafafa",
  },
  toggleKnob: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#242426",
  },
  toggleKnobOn: {
    width: 20,
    height: 20,
    borderRadius: 10,
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
  resultImage: {
    width: 160,
    height: 160,
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
