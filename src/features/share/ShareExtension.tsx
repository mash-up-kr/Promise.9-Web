import { isUnauthorizedError } from "@shared/api";
import {
  getDuplicateLinkId,
  isAlreadySavedLinkError,
} from "@shared/entities/link/link.errors";
import { useCreateLinkMutation } from "@shared/entities/link/link.queries";
import { extractFirstUrl } from "@shared/link/link.utils";
import { QueryClientProvider } from "@tanstack/react-query";
import { useLayoutEffect, useReducer, useRef, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { BottomSheet } from "@/components/ui/bottom-sheet/BottomSheet";
import { useAuthGate } from "@/features/auth/hooks/useAuthGate";
import { linkUrlSchema } from "@/features/link/link.contracts";
import {
  type ReminderValue,
  toReminderAtIso,
} from "@/features/link/reminder.utils";
import { createQueryClient } from "@/lib/queryClient";

import { EntrySheet } from "./components/EntrySheet";
import { CheckingSheet, ResultSheet } from "./components/ResultSheet";
import { ExtensionLoginSheet } from "./ExtensionLoginSheet";
import { INITIAL_SHARE_SAVE_STATE, shareSaveReducer } from "./share.reducer";
import { close } from "./shareHost";
import { useAccessTokenWarmup } from "./useAccessTokenWarmup";

// 익스텐션 엔트리도 global.css 를 로드해 NativeWind(className)·인앱 컴포넌트를 쓸 수 있다.

/**
 * 공유 익스텐션 루트 — 공유받은 URL 을 익스텐션 안에서 바로 저장한다.
 * 시트 크롬(백드롭·핸들·드래그·키보드)은 인앱과 같은 BottomSheet 가 맡고, 컨테이너는 전체 화면이다.
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
  // 저장 중엔 인앱 저장 시트처럼 백드롭 탭·끌어 내리기로 닫히지 않는다.
  const [isSaving, setIsSaving] = useState(false);

  // 익스텐션 프로세스 전용 클라이언트 — 기본값(재시도 1회 등)은 앱과 같은 팩토리에서 온다.
  // 모듈 싱글턴이 아니라 마운트마다 새로 만들어 테스트 간 캐시가 새지 않게 한다.
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {/* 앱 _layout 과 같은 루트 프로바이더 — 시트 제스처(gesture-handler)·인셋·Dialog 키보드 회피. */}
      <GestureHandlerRootView className="flex-1">
        <SafeAreaProvider>
          <KeyboardProvider>
            <BottomSheet
              onClose={close}
              backdropPressBehavior={isSaving ? "none" : "close"}
              isLocked={isSaving}
            >
              {(status === "checking" ||
                (status === "authenticated" && !isTokenReady)) && (
                <CheckingSheet />
              )}
              {status === "unauthenticated" && (
                <ExtensionLoginSheet
                  sharedUrl={sharedUrl}
                  isSessionExpired={isSessionExpired}
                />
              )}
              {status === "authenticated" && isTokenReady && (
                <ShareSaveFlow url={sharedUrl} onSavingChange={setIsSaving} />
              )}
            </BottomSheet>
          </KeyboardProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

interface ShareSaveFlowProps {
  url: string;
  onSavingChange: (isSaving: boolean) => void;
}

function ShareSaveFlow({ url, onSavingChange }: ShareSaveFlowProps) {
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
      if (isAlreadySavedLinkError(error)) {
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
  const isSaving = state.phase === "saving";

  useLayoutEffect(() => {
    onSavingChange(isSaving);
  }, [isSaving, onSavingChange]);

  return (
    <>
      {isEditing ? (
        <EntrySheet
          url={url}
          isSaving={isSaving}
          selectedFolderId={selectedFolderId}
          onSelectFolder={setSelectedFolderId}
          reminder={reminder}
          onChangeReminder={setReminder}
          memo={memo}
          onChangeMemo={setMemo}
          onSave={save}
        />
      ) : (
        <ResultSheet state={state} onRetry={save} />
      )}
    </>
  );
}
