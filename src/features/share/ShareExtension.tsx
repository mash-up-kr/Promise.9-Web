import { apiClient, isUnauthorizedError } from "@shared/api";
import type { SuccessResponse } from "@shared/api/api.types";
import {
  folderToneToHex,
  type SelectableFolderColor,
} from "@shared/folder/folder.constants";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Calendar, ChevronRight, Clock, Plus } from "lucide-react-native";
import type { PropsWithChildren } from "react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ActionButton } from "@/components/ui/action-button/ActionButton";
import { Dialog } from "@/components/ui/dialog/Dialog";
import { BellIcon } from "@/components/ui/icon/BellIcon";
import { DiceIcon } from "@/components/ui/icon/DiceIcon";
import { FolderIcon } from "@/components/ui/icon/FolderIcon";
import { Input, InputField } from "@/components/ui/input/Input";
import { Text as UIText } from "@/components/ui/text/Text";
import { isAndroid } from "@/constants/platform.constants";
import { isDuplicateFolderNameError } from "@/entities/folder/folder.errors";
import {
  getDuplicateLinkId,
  isDuplicateLinkError,
} from "@/entities/link/link.errors";
import { DuplicateFolderNameAlert } from "@/features/archive/components/DuplicateFolderNameAlert";
import { FolderColorPicker } from "@/features/archive/components/FolderColorPicker";
import {
  type AuthGateStatus,
  useAuthGate,
} from "@/features/auth/hooks/useAuthGate";
import { DatePickerModal } from "@/features/link/components/DatePickerModal";
import { LinkPreviewCard } from "@/features/link/components/LinkPreviewCard";
import { TimePickerModal } from "@/features/link/components/TimePickerModal";
import { linkUrlSchema } from "@/features/link/link.contracts";
import {
  formatRemainingPeriod,
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
  EXTENSION_LOGIN_SHEET_HEIGHT,
  ExtensionLoginSheet,
} from "./ExtensionLoginSheet";
import {
  INITIAL_SHARE_SAVE_STATE,
  type ShareSaveState,
  shareSaveReducer,
} from "./share.reducer";
import { close, openHostApp } from "./shareHost";
import { SheetText, sheetStyles } from "./sheet.primitives";
import { useAccessTokenWarmup } from "./useAccessTokenWarmup";

// 익스텐션 엔트리도 global.css 를 로드해 NativeWind(className)·인앱 컴포넌트를 쓸 수 있다.
// 기존 스타일은 StyleSheet 로 남겨둔다(동작 동일, 전환은 불필요한 churn).

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
 */
export function ShareExtension({ url }: { url?: string }) {
  const sharedUrl = url ?? "";
  const status = useAuthGate();
  const isTokenReady = useAccessTokenWarmup(status);
  // 한 번 인증됐다가 풀린 경우(저장 중 401 → refresh 실패)는 "다시 로그인" 안내로 구분한다.
  const wasAuthenticated = useRef(false);
  // 렌더 중 기록하지만 단조 래치라 멱등 — effect 로 옮기면 만료 안내가 한 렌더 늦어진다.
  if (status === "authenticated") {
    wasAuthenticated.current = true;
  }
  const isSessionExpired =
    status === "unauthenticated" && wasAuthenticated.current;

  // 닫기 요청은 항상 컨테이너의 퇴장 애니메이션(시트 다운 → dim 페이드)을 거친다.
  const sheetRef = useRef<ShareSheetHandle>(null);
  const dismissSheet = useCallback(() => {
    if (sheetRef.current) {
      sheetRef.current.dismiss();
    } else {
      close();
    }
  }, []);

  const [isEditing, setIsEditing] = useState(true);

  // 세션이 끊겨 저장 흐름이 내려가면 다음 로그인은 편집 시트(600)부터 시작해야 한다.
  useEffect(() => {
    if (status !== "authenticated") setIsEditing(true);
  }, [status]);

  // 익스텐션 프로세스 전용 클라이언트 — LinkPreviewCard(react-query) 재사용을 위해 둔다.
  // 모듈 싱글턴이 아니라 마운트마다 새로 만들어 테스트 간 캐시가 새지 않게 한다.
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {/* Dialog(폴더 생성·피커)의 키보드 회피는 KeyboardProvider 가 있어야 동작한다 — 앱 _layout 처럼 감싼다. */}
      <KeyboardProvider>
        <ShareSheetContainer
          ref={sheetRef}
          height={sheetHeightFor(status, isEditing)}
          onClosed={close}
        >
          {(status === "checking" ||
            (status === "authenticated" && !isTokenReady)) && <CheckingSheet />}
          {status === "unauthenticated" && (
            <ExtensionLoginSheet
              sharedUrl={sharedUrl}
              isSessionExpired={isSessionExpired}
            />
          )}
          {status === "authenticated" && isTokenReady && (
            <ShareSaveFlow
              url={sharedUrl}
              onDismiss={dismissSheet}
              onEditingChange={setIsEditing}
            />
          )}
        </ShareSheetContainer>
      </KeyboardProvider>
    </QueryClientProvider>
  );
}

// 편집·확인 중 시트는 길고(600) 결과 시트만 짧다(400). 확인 중을 600 으로 두는 이유:
// 컨테이너가 마운트 시점 높이로 슬라이드 거리를 잡아, 400 이면 iOS 첫 프레임에 시트 일부가 보인다.
function sheetHeightFor(status: AuthGateStatus, isEditing: boolean): number {
  if (status === "unauthenticated") return EXTENSION_LOGIN_SHEET_HEIGHT;
  if (status === "authenticated" && !isEditing) return 400;
  return 600;
}

function CheckingSheet() {
  return (
    <View style={[sheetStyles.container, sheetStyles.resultContainer]}>
      <View style={sheetStyles.handle} />
    </View>
  );
}

function ShareSaveFlow({
  url,
  onDismiss,
  onEditingChange,
}: {
  url: string;
  onDismiss: () => void;
  onEditingChange: (isEditing: boolean) => void;
}) {
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

  // 날짜/시간 정밀 선택 — 인앱 ReminderSection 과 같은 피커 모달을 그대로 띄운다.
  // (global.css 로드로 인앱 컴포넌트 재사용 가능; 직접 선택 시 프리셋 해제도 동일 정책.)
  const [openPicker, setOpenPicker] = useState<"date" | "time" | null>(null);

  const confirmPickedDate = (date: string) => {
    if (reminder) {
      setSelectedPresetDays(null);
      setReminder({ ...reminder, date });
    }
    setOpenPicker(null);
  };

  const confirmPickedTime = (time: { hour: number; minute: number }) => {
    if (reminder) {
      setReminder({ ...reminder, ...time });
    }
    setOpenPicker(null);
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
    if (!linkUrlSchema.safeParse(url).success) {
      dispatch({ type: "SAVE_REJECTED_INVALID_URL" });
      return;
    }
    dispatch({ type: "SAVE_REQUESTED" });
    try {
      const { data } = await apiClient.post<SuccessResponse<CreatedLink>>(
        "/links",
        {
          url,
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
      // 401 은 refresh 실패 → clearTokens 로 가드가 로그인 시트를 띄운다 — 실패 시트를 스치지 않게 여기선 끝낸다.
      if (isUnauthorizedError(error)) {
        return;
      }
      dispatch({ type: "SAVE_FAILED" });
    }
  };

  const isEditing = state.phase === "editing" || state.phase === "saving";

  useLayoutEffect(() => {
    onEditingChange(isEditing);
  }, [isEditing, onEditingChange]);

  return (
    <>
      {isEditing ? (
        <EntrySheet
          url={url}
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
          onOpenDatePicker={() => setOpenPicker("date")}
          onOpenTimePicker={() => setOpenPicker("time")}
          memo={memo}
          onChangeMemo={setMemo}
          onSave={save}
          onCancel={onDismiss}
        />
      ) : (
        <ResultSheet state={state} onRetry={save} onClose={onDismiss} />
      )}
      {openPicker === "date" && reminder && (
        <DatePickerModal
          value={reminder.date}
          onConfirm={confirmPickedDate}
          onClose={() => setOpenPicker(null)}
        />
      )}
      {openPicker === "time" && reminder && (
        <TimePickerModal
          value={{ hour: reminder.hour, minute: reminder.minute }}
          onConfirm={confirmPickedTime}
          onClose={() => setOpenPicker(null)}
        />
      )}
    </>
  );
}

// 시트 등장·퇴장 모션 값 — dim 은 슬라이드가 아니라 페이드로 나타나고,
// 닫힐 때는 시트가 먼저 내려간 뒤 스르륵 사라진다(iOS dim 은 시스템 프레젠테이션 담당).
const SHEET_ENTER_MS = 260;
const SHEET_EXIT_MS = 220;
// iOS 시트는 네이티브가 고정한 컨테이너(app.json expo-share-extension height) 를 꽉 채우므로,
// 슬라이드 거리는 논리 높이(400·520)가 아니라 이 값이어야 화면 밖까지 완전히 나간다.
const IOS_SHEET_CONTAINER_HEIGHT = 600;
const DIM_FADE_MS = 180;
const DRAG_DISMISS_DISTANCE = 120;
const DRAG_DISMISS_VELOCITY = 0.8;

interface ShareSheetHandle {
  dismiss: () => void;
}

// iOS 는 익스텐션 컨테이너(높이 고정)가 곧 시트 영역이고, Android 는 반투명 액티비티
// 전체 위에 딤 + 하단 시트를 직접 그린다. 양쪽 모두 시트 슬라이드·상단 스와이프 다운은
// 여기서 담당한다(탭 아웃 닫기는 Android 전용 — iOS 는 시트 밖이 호스트 앱 영역).
const ShareSheetContainer = forwardRef<
  ShareSheetHandle,
  PropsWithChildren<{ height: number; onClosed: () => void }>
>(function ShareSheetContainer({ height, onClosed, children }, ref) {
  const slideDistance = isAndroid ? height : IOS_SHEET_CONTAINER_HEIGHT;
  const sheetY = useRef(new Animated.Value(slideDistance)).current;
  const dimOpacity = useRef(new Animated.Value(0)).current;
  const slideDistanceRef = useRef(slideDistance);
  slideDistanceRef.current = slideDistance;
  // 퇴장은 한 번만 — 스와이프 중 탭아웃처럼 겹치면 첫 애니메이션이 중단된 채 닫혀 시트가 반쯤 남는다.
  const isClosingRef = useRef(false);

  useEffect(
    function enterAnimation() {
      Animated.timing(sheetY, {
        toValue: 0,
        duration: SHEET_ENTER_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      if (isAndroid) {
        Animated.timing(dimOpacity, {
          toValue: 1,
          duration: DIM_FADE_MS,
          useNativeDriver: true,
        }).start();
      }
    },
    [sheetY, dimOpacity],
  );

  const dismiss = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    Animated.timing(sheetY, {
      toValue: slideDistanceRef.current,
      duration: SHEET_EXIT_MS,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      if (!isAndroid) {
        onClosed();
        return;
      }
      Animated.timing(dimOpacity, {
        toValue: 0,
        duration: DIM_FADE_MS,
        useNativeDriver: true,
      }).start(() => onClosed());
    });
  }, [sheetY, dimOpacity, onClosed]);

  useImperativeHandle(ref, () => ({ dismiss }), [dismiss]);

  const dismissRef = useRef(dismiss);
  dismissRef.current = dismiss;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_, gesture) => {
        if (!isClosingRef.current && gesture.dy > 0) {
          sheetY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (isClosingRef.current) return;
        if (
          gesture.dy > DRAG_DISMISS_DISTANCE ||
          gesture.vy > DRAG_DISMISS_VELOCITY
        ) {
          dismissRef.current();
          return;
        }
        Animated.timing(sheetY, {
          toValue: 0,
          duration: 160,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  const sheet = (
    <Animated.View
      style={[
        isAndroid ? [styles.androidSheet, { height }] : styles.iosSheet,
        { transform: [{ translateY: sheetY }] },
      ]}
    >
      {children}
      <View
        accessibilityLabel="시트 끌어서 닫기"
        style={styles.dragZone}
        {...panResponder.panHandlers}
      />
    </Animated.View>
  );

  if (!isAndroid) {
    return sheet;
  }
  return (
    <View style={styles.androidRoot}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.androidDim,
          { opacity: dimOpacity },
        ]}
      />
      <Pressable
        accessibilityLabel="닫기"
        style={StyleSheet.absoluteFill}
        onPress={() => dismissRef.current()}
      />
      {sheet}
    </View>
  );
});

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
  onOpenDatePicker,
  onOpenTimePicker,
  memo,
  onChangeMemo,
  onSave,
  onCancel,
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
  onOpenDatePicker: () => void;
  onOpenTimePicker: () => void;
  memo: string;
  onChangeMemo: (memo: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  return (
    <View style={sheetStyles.container}>
      <View style={sheetStyles.handle} />
      <View style={styles.header}>
        <Pressable
          style={styles.headerButton}
          disabled={isSaving}
          onPress={onCancel}
        >
          <SheetText style={styles.headerButtonText}>취소</SheetText>
        </Pressable>
        <SheetText style={styles.headerTitle}>링크 저장</SheetText>
        <Pressable
          style={[styles.headerButton, styles.saveButton]}
          disabled={isSaving}
          onPress={onSave}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#1a1a1a" />
          ) : (
            <SheetText style={styles.saveButtonText}>저장</SheetText>
          )}
        </Pressable>
      </View>
      {/* 시트 높이는 빌드 타임 고정(iOS) — 콘텐츠가 넘치는 작은 화면·리마인드 On 상태는
          세로 스크롤로 흡수한다. 헤더(취소·저장)는 스크롤 밖에 고정. */}
      <ScrollView
        testID="share-entry-scroll"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        // 시트 컨테이너는 키보드에 밀리지 않는다 — 스크롤 인셋으로 메모 입력이 키보드 위로 올라오게 한다(iOS).
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.entryScrollContent}
      >
        {/* 시안 통합 카드(인앱 CreateLinkSheet 미러) — 프리뷰(파비콘·제목)와 URL 을 한 카드로. */}
        <View style={styles.urlCard}>
          <LinkPreviewCard url={url} isBare />
          <SheetText style={styles.urlText} numberOfLines={2}>
            {url}
          </SheetText>
        </View>

        <View style={styles.sectionHeaderRow}>
          <SheetText style={[styles.sectionTitle, styles.sectionTitleInRow]}>
            폴더
          </SheetText>
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
          <FolderCreateModal
            onClose={() => setIsCreatingFolder(false)}
            onCreated={(folder) => {
              setIsCreatingFolder(false);
              onFolderCreated(folder);
            }}
          />
        )}

        <View style={styles.reminderHeader}>
          <SheetText style={[styles.sectionTitle, styles.sectionTitleInRow]}>
            리마인드
          </SheetText>
          <ReminderToggle
            isOn={reminder !== null}
            isDisabled={isSaving}
            onToggle={onToggleReminder}
          />
        </View>
        {reminder === null ? (
          <View style={[styles.reminderCard, styles.reminderOffRow]}>
            <BellIcon color="#8A8A93" />
            <SheetText style={styles.reminderPlaceholder}>
              잊지 않도록 다시 알려드려요
            </SheetText>
          </View>
        ) : (
          <ReminderOnCard
            reminder={reminder}
            selectedPresetDays={selectedPresetDays}
            isDisabled={isSaving}
            onSelectPreset={onSelectPreset}
            onSelectRandomDate={onSelectRandomDate}
            onOpenDatePicker={onOpenDatePicker}
            onOpenTimePicker={onOpenTimePicker}
          />
        )}

        <SheetText style={styles.sectionTitle}>메모</SheetText>
        <TextInput
          allowFontScaling={
            globalThis.__promise9ShareExtension ? false : undefined
          }
          style={styles.memoInput}
          multiline
          maxLength={MEMO_MAX_LENGTH}
          editable={!isSaving}
          placeholder="저장한 이유나 기억하고 싶은 점을 적어보세요"
          placeholderTextColor="#6b6b6b"
          value={memo}
          onChangeText={onChangeMemo}
        />
        <SheetText style={styles.memoCounter}>
          {memo.length}/{MEMO_MAX_LENGTH}
        </SheetText>
      </ScrollView>
    </View>
  );
}

// 미분류 folder 아이콘 색 — 인앱 FolderChipList 와 동일한 Figma 기준(folder/gray).
const UNCLASSIFIED_FOLDER_COLOR = "#65656B";

const FOLDER_NAME_MAX_LENGTH = 20;

// 인앱 폴더 생성 모달(FolderFormSheet)의 익스텐션판 — 같은 카드(Dialog·Input·색상 그리드)를
// 재사용하고, 폼 상태만 로컬로 든다. 성공 시 목록 반영은 부모(onCreated)가 맡는다.
function FolderCreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (folder: FolderSummary) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<SelectableFolderColor>("blue");
  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    const folderName = name.trim();
    if (folderName === "" || isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    setHasFailed(false);
    try {
      const { data } = await apiClient.post<SuccessResponse<FolderSummary>>(
        "/folders",
        { folderName, color: folderToneToHex(color) },
      );
      onCreated(data.data);
    } catch (error) {
      if (isDuplicateFolderNameError(error)) {
        setIsDuplicateOpen(true);
      } else {
        setHasFailed(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      transparent
      statusBarTranslucent
      visible
      animationType="fade"
      onRequestClose={onClose}
    >
      <Dialog onDismiss={onClose}>
        <View className="w-full max-w-[335px] gap-10 rounded-[36px] border border-opacity-white-05 bg-gray-800 p-5">
          <View className="gap-4">
            <UIText
              variant="heading-2"
              className="text-center text-text-strong"
            >
              새 폴더 만들기
            </UIText>

            <View className="gap-5">
              <View className="gap-2">
                <UIText variant="heading-3" className="text-icon-normal">
                  이름
                </UIText>
                <Input variant="field">
                  <InputField
                    allowFontScaling={
                      globalThis.__promise9ShareExtension ? false : undefined
                    }
                    placeholder="폴더 이름을 입력하세요."
                    maxLength={FOLDER_NAME_MAX_LENGTH}
                    editable={!isSubmitting}
                    value={name}
                    onChangeText={setName}
                  />
                </Input>
              </View>

              <View className="gap-5">
                <UIText variant="heading-3" className="text-icon-normal">
                  색상
                </UIText>
                <FolderColorPicker value={color} onChange={setColor} />
              </View>

              {hasFailed && (
                <UIText variant="caption-1" className="text-action-destructive">
                  폴더를 만들지 못했어요. 다시 시도해주세요
                </UIText>
              )}
            </View>
          </View>

          <View className="flex-row gap-2">
            <ActionButton
              variant="assistive"
              className="flex-1"
              onPress={onClose}
            >
              취소
            </ActionButton>
            <ActionButton
              className="flex-1"
              disabled={isSubmitting || name.trim() === ""}
              onPress={submit}
            >
              저장
            </ActionButton>
          </View>
        </View>
      </Dialog>

      <DuplicateFolderNameAlert
        isOpen={isDuplicateOpen}
        onClose={() => setIsDuplicateOpen(false)}
      />
    </Modal>
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
      <SheetText
        style={[
          styles.folderChipText,
          isSelected && styles.folderChipTextSelected,
        ]}
      >
        {name}
      </SheetText>
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
  onOpenDatePicker,
  onOpenTimePicker,
}: {
  reminder: ReminderValue;
  selectedPresetDays: number | null;
  isDisabled: boolean;
  onSelectPreset: (days: number) => void;
  onSelectRandomDate: () => void;
  onOpenDatePicker: () => void;
  onOpenTimePicker: () => void;
}) {
  return (
    <View style={styles.reminderCardOn}>
      <View style={styles.reminderQuestionRow}>
        <BellIcon color="#E9E9EB" />
        <SheetText style={styles.reminderQuestion}>
          언제 알려드릴까요?
        </SheetText>
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="날짜 선택"
        style={styles.reminderValueRow}
        disabled={isDisabled}
        onPress={onOpenDatePicker}
      >
        <View style={styles.reminderValueItem}>
          <Calendar size={16} color="#E9E9EB" />
          <SheetText style={styles.reminderValueText}>
            {formatReminderDate(reminder.date)}
          </SheetText>
        </View>
        <View style={styles.reminderValueItem}>
          <SheetText style={styles.reminderRemainingText}>
            {formatRemainingPeriod(reminder.date)}
          </SheetText>
          <ChevronRight size={16} color="#8A8A93" />
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="시간 선택"
        style={styles.reminderValueRow}
        disabled={isDisabled}
        onPress={onOpenTimePicker}
      >
        <View style={styles.reminderValueItem}>
          <Clock size={16} color="#E9E9EB" />
          <SheetText style={styles.reminderValueText}>
            {formatReminderTime(reminder.hour, reminder.minute)}
          </SheetText>
        </View>
        <ChevronRight size={16} color="#8A8A93" />
      </Pressable>
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
      <SheetText
        style={[
          styles.presetChipText,
          isSelected && styles.presetChipTextSelected,
        ]}
      >
        {label}
      </SheetText>
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
  "invalid-url": require("@/assets/images/share/result-failed.png"),
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
  "invalid-url": {
    title: "저장할 수 없는 링크예요",
    subtitle: "올바른 주소인지 확인한 뒤 다시 공유해주세요",
    cta: "닫기",
  },
} as const;

function ResultSheet({
  state,
  onRetry,
  onClose,
}: {
  state: Exclude<ShareSaveState, { phase: "editing" } | { phase: "saving" }>;
  onRetry: () => void;
  onClose: () => void;
}) {
  const content = RESULT_CONTENT[state.phase];

  const handleCta = () => {
    switch (state.phase) {
      case "success":
        openHostApp(`link/${state.linkId}`);
        return;
      case "duplicate":
        // 409 가 담아준 기존 링크 상세로 이동(서버 PR #109). 없으면(구버전) 홈 —
        // 빈 경로는 iOS 네이티브가 첫 세그먼트를 읽다 크래시하므로 "/" 로 보낸다.
        openHostApp(state.linkId != null ? `link/${state.linkId}` : "/");
        return;
      case "failed":
        onRetry();
        return;
      case "retry-limit":
      case "invalid-url":
        onClose();
        return;
    }
  };

  return (
    <View style={[sheetStyles.container, sheetStyles.resultContainer]}>
      <View style={sheetStyles.handle} />
      <View style={sheetStyles.resultBody}>
        <Image
          testID={`share-result-${state.phase}`}
          source={RESULT_GRAPHICS[state.phase]}
          style={sheetStyles.resultImage}
        />
        <SheetText style={sheetStyles.resultTitle}>{content.title}</SheetText>
        <SheetText style={sheetStyles.resultSubtitle}>
          {content.subtitle}
        </SheetText>
      </View>
      <Pressable style={styles.ctaButton} onPress={handleCta}>
        <SheetText style={styles.ctaText}>{content.cta}</SheetText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  androidRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  androidDim: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  iosSheet: {
    flex: 1,
  },
  // 핸들 영역(8+4+12pt)만 덮는다 — 헤더 버튼(24pt 부터)까지 덮으면 그 윗부분 탭이 먹지 않는다.
  dragZone: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 24,
  },
  androidSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
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
    gap: 12,
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
  reminderRemainingText: {
    color: "#fbffc2",
    fontSize: 14,
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
