import { isUnauthorizedError } from "@shared/api";
import { extractFirstUrl } from "@shared/link/link.utils";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
  Animated,
  Easing,
  Image,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  KeyboardProvider,
  useReanimatedKeyboardAnimation,
} from "react-native-keyboard-controller";
import Reanimated, { useAnimatedStyle } from "react-native-reanimated";
import { AsyncBoundary } from "@/components/ui/async-boundary/AsyncBoundary";
import { BottomSheetHeader } from "@/components/ui/bottom-sheet/BottomSheetHeader";
import { Text } from "@/components/ui/text/Text";
import { isAndroid } from "@/constants/platform.constants";
import { useCreateFolderMutation } from "@/entities/folder/folder.queries";
import {
  getDuplicateLinkId,
  isDuplicateLinkError,
} from "@/entities/link/link.errors";
import { useCreateLinkMutation } from "@/entities/link/link.queries";
import { FolderFormCard } from "@/features/archive/components/FolderFormCard";
import {
  type AuthGateStatus,
  useAuthGate,
} from "@/features/auth/hooks/useAuthGate";
import { FolderChipList } from "@/features/link/components/FolderChipList";
import { LinkPreviewCard } from "@/features/link/components/LinkPreviewCard";
import { MemoField } from "@/features/link/components/MemoField";
import { ReminderSection } from "@/features/link/components/ReminderSection";
import { linkUrlSchema } from "@/features/link/link.contracts";
import {
  type ReminderValue,
  toReminderAtIso,
} from "@/features/link/reminder.utils";

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

/**
 * iOS Share Extension 루트 — 공유받은 URL 을 익스텐션 안에서 바로 저장한다.
 * 결과 시트(성공/실패/중복/반복실패) 전이는 share.reducer 가 정한다.
 */
export function ShareExtension({ url }: { url?: string }) {
  const sharedText = url ?? "";
  // Android 는 "제목\nURL" 로 오기도 한다 — URL 이 없으면 원문을 넘겨 기존 '저장할 수 없는 링크' 경로로 흐르게 한다.
  const sharedUrl = extractFirstUrl(sharedText) ?? sharedText;
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
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [memo, setMemo] = useState("");
  const [reminder, setReminder] = useState<ReminderValue | null>(null);
  const createLinkMutation = useCreateLinkMutation();

  const save = async () => {
    if (!linkUrlSchema.safeParse(url).success) {
      dispatch({ type: "SAVE_REJECTED_INVALID_URL" });
      return;
    }
    dispatch({ type: "SAVE_REQUESTED" });
    try {
      const created = await createLinkMutation.mutateAsync({
        url,
        folderId: selectedFolderId,
        memo: memo.trim() || null,
        reminderAt: reminder ? toReminderAtIso(reminder) : null,
      });
      dispatch({ type: "SAVE_SUCCEEDED", linkId: created.linkId });
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
          selectedFolderId={selectedFolderId}
          onSelectFolder={setSelectedFolderId}
          reminder={reminder}
          onChangeReminder={setReminder}
          memo={memo}
          onChangeMemo={setMemo}
          onSave={save}
          onCancel={onDismiss}
        />
      ) : (
        <ResultSheet state={state} onRetry={save} onClose={onDismiss} />
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
  selectedFolderId,
  onSelectFolder,
  reminder,
  onChangeReminder,
  memo,
  onChangeMemo,
  onSave,
  onCancel,
}: {
  url: string;
  isSaving: boolean;
  selectedFolderId: number | null;
  onSelectFolder: (folderId: number | null) => void;
  reminder: ReminderValue | null;
  onChangeReminder: (reminder: ReminderValue | null) => void;
  memo: string;
  onChangeMemo: (memo: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  // Android 시트는 화면 바닥에 붙어 있어 키보드 높이(열리면 음수)만큼 스크롤 영역 아래를 띄우면 된다.
  // KeyboardAvoidingView 는 부모 기준 좌표로 겹침을 계산해 시트 안에서는 0 이 나온다.
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  const keyboardPaddingStyle = useAnimatedStyle(() => ({
    paddingBottom: isAndroid ? -keyboardHeight.value : 0,
  }));

  return (
    <View style={sheetStyles.container}>
      <View style={sheetStyles.handle} />
      {/* 헤더가 자체 좌우 여백을 가져 시트 컨테이너의 여백을 상쇄한다. */}
      <View pointerEvents={isSaving ? "none" : "auto"} className="-mx-5">
        <BottomSheetHeader
          title="링크 저장"
          onCancel={onCancel}
          onConfirm={onSave}
          isConfirmPending={isSaving}
        />
      </View>
      {/* 시트 높이는 빌드 타임 고정(iOS) — 콘텐츠가 넘치는 작은 화면·리마인드 On 상태는
          세로 스크롤로 흡수한다. 헤더(취소·저장)는 스크롤 밖에 고정. */}
      {/* 시트 컨테이너는 키보드에 밀리지 않는다 — iOS 는 스크롤 인셋, Android(edge-to-edge 창은
          adjustResize 로 줄지 않음)는 패딩으로 스크롤 영역을 줄여 메모 입력이 키보드 위로 올라오게 한다. */}
      <Reanimated.View
        testID="share-entry-keyboard-area"
        style={[styles.entryScrollArea, keyboardPaddingStyle]}
      >
        <ScrollView
          testID="share-entry-scroll"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.entryScrollContent}
        >
          <View pointerEvents={isSaving ? "none" : "auto"} className="gap-6">
            {/* 시안 통합 카드(인앱 CreateLinkSheet 미러) — 프리뷰(파비콘·제목)와 URL 을 한 카드로. */}
            <View className="w-full rounded-[20px] bg-opacity-white-10">
              <View className="px-4 pt-4">
                <LinkPreviewCard url={url} isBare />
                <View className="mt-4 h-px w-full bg-opacity-white-10" />
              </View>
              <View className="px-4 py-3">
                <Text
                  variant="body-2-normal"
                  className="text-text-alternative"
                  numberOfLines={2}
                >
                  {url}
                </Text>
              </View>
            </View>

            {/* 폴더는 부가 기능 — 조회가 실패하면 칩만 숨기고 미분류 저장은 계속된다. */}
            <AsyncBoundary pending={null} fallback={null}>
              <FolderChipList
                value={selectedFolderId}
                onChange={onSelectFolder}
                onAddFolder={() => setIsCreatingFolder(true)}
              />
            </AsyncBoundary>

            <ReminderSection value={reminder} onChange={onChangeReminder} />

            <MemoField memo={memo} onChangeMemo={onChangeMemo} />
          </View>
          {isCreatingFolder && (
            <FolderCreateModal onClose={() => setIsCreatingFolder(false)} />
          )}
        </ScrollView>
      </Reanimated.View>
    </View>
  );
}

// 인앱 폴더 생성 카드를 익스텐션 시트 위에 띄운다 — 시트는 라우트가 아니라 화면 안이라
// RN Modal 로 감싼다. 생성한 폴더의 선택은 FolderChipList 의 목록 재조회가 맡는다.
function FolderCreateModal({ onClose }: { onClose: () => void }) {
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
  entryScrollArea: {
    flex: 1,
  },
  entryScrollContent: {
    paddingBottom: 16,
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
