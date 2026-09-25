import { isUnauthorizedError } from "@shared/api";
import {
  getDuplicateLinkId,
  isAlreadySavedLinkError,
} from "@shared/entities/link/link.errors";
import { useCreateLinkMutation } from "@shared/entities/link/link.queries";
import { findLinkInText } from "@shared/link/link.utils";
import { QueryClientProvider } from "@tanstack/react-query";
import { useLayoutEffect, useReducer, useRef, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { BottomSheet } from "@/components/ui/bottom-sheet/BottomSheet";
import { useAuthGate } from "@/features/auth/hooks/useAuthGate";
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
export function ShareExtension({ url, text }: { url?: string; text?: string }) {
  // iOS 는 URL 로 오지만 지도·SNS 앱은 텍스트로 공유하고, Android 는 "제목\nURL" 처럼 섞어 보낸다 —
  // 첫 링크를 찾아 저장할 형태로 보정한다. 링크가 없으면 원문을 링크로 대신하지 않고 사유를 안내한다.
  const sharedText = url ?? text ?? "";
  const sharedLink = findLinkInText(sharedText);
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
              {/* 링크가 없으면 로그인해도 저장할 게 없다 — 로그인을 묻기 전에 바로 안내한다. */}
              {sharedLink.ok ? (
                <ShareAuthFlow
                  url={sharedLink.url}
                  onSavingChange={setIsSaving}
                />
              ) : (
                <ResultSheet
                  state={{ phase: "invalid-url", reason: sharedLink.reason }}
                  sharedText={sharedText}
                />
              )}
            </BottomSheet>
          </KeyboardProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

interface ShareFlowProps {
  url: string;
  onSavingChange: (isSaving: boolean) => void;
}

// 로그인 여부에 따라 확인 중·로그인 시트·저장 흐름 중 하나를 보여준다.
function ShareAuthFlow({ url, onSavingChange }: ShareFlowProps) {
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

  return (
    <>
      {(status === "checking" ||
        (status === "authenticated" && !isTokenReady)) && <CheckingSheet />}
      {status === "unauthenticated" && (
        <ExtensionLoginSheet
          sharedUrl={url}
          isSessionExpired={isSessionExpired}
        />
      )}
      {status === "authenticated" && isTokenReady && (
        <ShareSaveFlow url={url} onSavingChange={onSavingChange} />
      )}
    </>
  );
}

function ShareSaveFlow({ url, onSavingChange }: ShareFlowProps) {
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
