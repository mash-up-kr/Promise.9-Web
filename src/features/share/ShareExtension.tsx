import { isUnauthorizedError } from "@shared/api";
import { extractFirstUrl } from "@shared/link/link.utils";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { KeyboardProvider } from "react-native-keyboard-controller";

import {
  getDuplicateLinkId,
  isDuplicateLinkError,
} from "@/entities/link/link.errors";
import { useCreateLinkMutation } from "@/entities/link/link.queries";
import {
  type AuthGateStatus,
  useAuthGate,
} from "@/features/auth/hooks/useAuthGate";
import { linkUrlSchema } from "@/features/link/link.contracts";
import {
  type ReminderValue,
  toReminderAtIso,
} from "@/features/link/reminder.utils";
import { createQueryClient } from "@/lib/queryClient";

import { EntrySheet } from "./components/EntrySheet";
import { CheckingSheet, ResultSheet } from "./components/ResultSheet";
import {
  ShareSheetContainer,
  type ShareSheetHandle,
} from "./components/ShareSheetContainer";
import {
  EXTENSION_LOGIN_SHEET_HEIGHT,
  ExtensionLoginSheet,
} from "./ExtensionLoginSheet";
import { INITIAL_SHARE_SAVE_STATE, shareSaveReducer } from "./share.reducer";
import { close } from "./shareHost";
import { useAccessTokenWarmup } from "./useAccessTokenWarmup";

// 익스텐션 엔트리도 global.css 를 로드해 NativeWind(className)·인앱 컴포넌트를 쓸 수 있다.

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

  // 익스텐션 프로세스 전용 클라이언트 — 기본값(재시도 1회 등)은 앱과 같은 팩토리에서 온다.
  // 모듈 싱글턴이 아니라 마운트마다 새로 만들어 테스트 간 캐시가 새지 않게 한다.
  const [queryClient] = useState(createQueryClient);

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

interface ShareSaveFlowProps {
  url: string;
  onDismiss: () => void;
  onEditingChange: (isEditing: boolean) => void;
}

function ShareSaveFlow({
  url,
  onDismiss,
  onEditingChange,
}: ShareSaveFlowProps) {
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
