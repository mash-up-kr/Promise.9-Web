import { createLink } from "@shared/entities/link/link.queries";

import { handleLoginHandoff } from "@/lib/auth/handoff";
import { installTokenPersistence } from "@/lib/auth/session";

import {
  type ExtensionMessage,
  isExtensionMessage,
  MESSAGE_TYPE,
  type SaveLinkPayload,
} from "@/lib/messages";
import { resolveFailure, resolveSuccess, startSaving } from "@/lib/saveSession";
import {
  readSaveRecord,
  type SaveRecord,
  writeSaveRecord,
} from "@/lib/storage";

/**
 * 저장을 수행한다.
 *
 * 패널이 아니라 여기서 도는 이유: 사용자가 저장 도중 패널을 닫으면 그 문서가 파괴되면서
 * 요청까지 함께 죽는다. background 는 진행 중인 fetch 가 있는 동안 살아 있으므로 저장이 끝까지 간다.
 * 결과는 storage 에 남겨 패널이 (열려 있으면 즉시, 닫혀 있었으면 다시 열 때) 읽어간다.
 */
async function runSave(request: SaveLinkPayload): Promise<void> {
  // service worker 는 유휴 시 종료됐다 다시 뜨면서 메모리의 액세스 토큰을 잃는다.
  // 저장소만 다시 붙여두면 첫 401 에서 인터셉터가 리프레시 토큰으로 복원한다.
  installTokenPersistence();

  const previous = await readSaveRecord();
  let record: SaveRecord = {
    session: startSaving(request.url, previous?.session ?? null),
    request,
  };
  await writeSaveRecord(record);

  try {
    const created = await createLink({
      url: request.url,
      folderId: request.folderId,
      memo: request.memo,
      reminderAt: request.reminderAt,
    });
    record = {
      ...record,
      session: resolveSuccess(record.session, created.linkId),
    };
  } catch (error) {
    record = { ...record, session: resolveFailure(record.session, error) };
  }

  await writeSaveRecord(record);
}

async function retrySave(): Promise<void> {
  const previous = await readSaveRecord();
  if (!previous) return;

  await runSave(previous.request);
}

function handleMessage(message: ExtensionMessage): void {
  switch (message.type) {
    case MESSAGE_TYPE.saveLink:
      void runSave(message.payload);
      return;
    case MESSAGE_TYPE.retrySave:
      void retrySave();
      return;
  }
}

chrome.runtime.onMessage.addListener((message: unknown) => {
  if (!isExtensionMessage(message)) return false;

  handleMessage(message);

  // 결과는 응답이 아니라 storage 로 전달한다 — 패널이 이미 닫혀 응답을 받을 수 없을 수 있다.
  return false;
});

/**
 * 아이콘 클릭 = 사이드패널 열기.
 *
 * `default_popup` 이 없을 때 크롬이 아이콘 클릭을 사이드패널로 연결해주는 설정이다.
 * 이걸 켜지 않으면 아이콘을 눌러도 아무 일도 일어나지 않는다.
 */
chrome.runtime.onInstalled.addListener(() => {
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

/**
 * 웹앱 탭에서 오는 로그인 인계.
 *
 * 익스텐션은 로그인 UI 가 없다 — 패널이 웹앱 `/login?return=extension` 을 새 탭으로 열고,
 * 웹앱이 `POST /auth/extension-token` 으로 발급받은 익스텐션 전용 토큰쌍을
 * `chrome.runtime.sendMessage(확장ID, …)` 로 보내면 여기서 받아 저장한다.
 * 끝나면 그 탭은 닫아 사용자를 원래 페이지로 돌려보낸다.
 */
chrome.runtime.onMessageExternal.addListener(
  (message: unknown, sender, sendResponse) => {
    installTokenPersistence();

    void handleLoginHandoff(message, sender.url).then((result) => {
      sendResponse(result);

      // 로그인이 끝났으면 웹앱 탭은 볼일이 없다. 패널은 storage 변경으로 알아서 바뀐다.
      if (result.ok && sender.tab?.id !== undefined) {
        void chrome.tabs.remove(sender.tab.id);
      }
    });

    // 비동기로 응답하겠다는 표시 — 없으면 sendResponse 채널이 즉시 닫힌다.
    return true;
  },
);
