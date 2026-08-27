import { useCallback, useEffect, useState } from "react";
import { MESSAGE_TYPE, type SaveLinkPayload } from "@/lib/messages";
import { isSavableUrl } from "@/lib/savableUrl";
import type { SavePhase } from "@/lib/saveSession";
import {
  clearSaveRecord,
  readLoggedIn,
  readSaveRecord,
  type SaveRecord,
  subscribeSaveRecord,
  writeLoggedIn,
} from "@/lib/storage";
import { useActiveTab } from "@/lib/useActiveTab";
import { WEB_APP_PATH, webAppUrl } from "@/lib/webApp";
import { LoginScreen } from "@/sidepanel/screens/LoginScreen";
import { NewFolderScreen } from "@/sidepanel/screens/NewFolderScreen";
import {
  type ResultKind,
  ResultScreen,
} from "@/sidepanel/screens/ResultScreen";
import { SaveScreen } from "@/sidepanel/screens/SaveScreen";

/** 저장 phase → 결과 화면. `saving` 은 결과가 아니라 저장 화면이 그대로 뜬 채 버튼만 잠긴다. */
const RESULT_KIND: Partial<Record<SavePhase, ResultKind>> = {
  success: "success",
  duplicate: "duplicate",
  failed: "failed",
  "retry-limit": "retry-limit",
};

interface SessionState {
  loggedIn: boolean;
  saveRecord: SaveRecord | null;
}

/**
 * 링크 하나에 대해 사용자가 작성 중인 내용.
 *
 * 화면이 아니라 여기서 들고 있는 이유: 새 폴더 화면을 다녀오는 동안 저장 화면이 언마운트되므로,
 * 화면에 두면 적던 메모가 사라진다.
 */
interface Draft {
  /** 이 초안이 어느 링크의 것인지. 탭이 바뀌면 이 값이 달라져 초안을 버린다. */
  url: string | undefined;
  folderId: number | null;
  memo: string;
  isCreatingFolder: boolean;
}

const emptyDraft = (url: string | undefined): Draft => ({
  url,
  folderId: null,
  memo: "",
  isCreatingFolder: false,
});

export function SidePanelApp() {
  const tab = useActiveTab();
  const [session, setSession] = useState<SessionState | null>(null);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(undefined));

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [loggedIn, saveRecord] = await Promise.all([
        readLoggedIn(),
        readSaveRecord(),
      ]);
      if (!cancelled) setSession({ loggedIn, saveRecord });
    })();

    // 저장은 background 에서 돌기 때문에 결과는 storage 변경으로 도착한다.
    const unsubscribe = subscribeSaveRecord((saveRecord) => {
      setSession((previous) =>
        previous ? { ...previous, saveRecord } : previous,
      );
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  // 탭이 바뀌면 다른 링크를 저장하는 것이므로 이전 링크의 초안(폴더·메모·새 폴더 화면)은 버린다.
  // effect 가 아니라 렌더 중에 맞추는 이유: effect 로 하면 한 프레임 동안 이전 링크의 메모가
  // 새 링크 화면에 남아 보인다. React 가 권장하는 "이전 렌더 값과 다르면 조정" 패턴이다.
  const url = tab?.url;
  let current = draft;
  if (draft.url !== url) {
    current = emptyDraft(url);
    setDraft(current);
  }

  // 사이드패널에서 window.close() 는 패널 자체를 닫는다(시안의 '닫기' 라벨과 같은 동작).
  const closePanel = useCallback(() => window.close(), []);

  const openWebApp = useCallback((path: string) => {
    void chrome.tabs.create({ url: webAppUrl(path) });
    window.close();
  }, []);

  const startSave = useCallback((payload: SaveLinkPayload) => {
    void chrome.runtime.sendMessage({ type: MESSAGE_TYPE.saveLink, payload });
  }, []);

  const logIn = useCallback(async () => {
    // 임시: 실제 소셜 로그인(#auth) 전까지는 플래그만 세운다. 인증 자체는 마스터 토큰이 한다.
    await writeLoggedIn(true);
    setSession((previous) =>
      previous ? { ...previous, loggedIn: true } : previous,
    );
  }, []);

  // 활성 탭·로그인 상태를 읽는 동안. chrome 로컬 조회라 사실상 한 프레임이다.
  if (!tab || !session) return null;

  const { loggedIn, saveRecord } = session;

  if (!isSavableUrl(url)) {
    return <ResultScreen kind="restricted" onAction={closePanel} />;
  }

  if (!loggedIn) {
    return <LoginScreen onLogin={() => void logIn()} />;
  }

  if (current.isCreatingFolder) {
    return (
      <NewFolderScreen
        onCancel={() =>
          setDraft((previous) => ({ ...previous, isCreatingFolder: false }))
        }
        onCreated={(createdFolderId) => {
          // 새로 만든 폴더를 그대로 선택 상태로 되돌려준다(시안 정책).
          setDraft((previous) => ({
            ...previous,
            folderId: createdFolderId,
            isCreatingFolder: false,
          }));
        }}
      />
    );
  }

  // 결과는 "지금 보고 있는 탭의 저장" 일 때만 보여준다 — 다른 탭에서 만든 결과가 따라오면 안 된다.
  const record = saveRecord?.session.url === url ? saveRecord : null;
  const resultKind = record ? RESULT_KIND[record.session.phase] : undefined;

  if (record && resultKind) {
    return (
      <ResultScreen
        kind={resultKind}
        onAction={() => {
          switch (resultKind) {
            case "success":
              openWebApp(
                record.session.linkId === null
                  ? WEB_APP_PATH.home
                  : WEB_APP_PATH.linkDetail(record.session.linkId),
              );
              return;
            case "duplicate":
              // 서버가 중복 응답에 기존 linkId 를 주지 않아 그 링크로 바로 못 간다 → 웹앱 홈.
              openWebApp(WEB_APP_PATH.home);
              return;
            case "failed":
              void chrome.runtime.sendMessage({
                type: MESSAGE_TYPE.retrySave,
              });
              return;
            default:
              void clearSaveRecord();
              closePanel();
          }
        }}
      />
    );
  }

  return (
    <SaveScreen
      tab={tab}
      url={url}
      folderId={current.folderId}
      onFolderChange={(folderId) =>
        setDraft((previous) => ({ ...previous, folderId }))
      }
      memo={current.memo}
      onMemoChange={(memo) => setDraft((previous) => ({ ...previous, memo }))}
      isSaving={record?.session.phase === "saving"}
      onSave={startSave}
      onCreateFolder={() =>
        setDraft((previous) => ({ ...previous, isCreatingFolder: true }))
      }
    />
  );
}
