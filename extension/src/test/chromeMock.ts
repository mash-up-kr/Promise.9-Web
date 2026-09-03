import { vi } from "vitest";

export interface MockTab {
  id?: number;
  url?: string;
  title?: string;
  favIconUrl?: string;
}

export interface ChromeMockOptions {
  tab?: MockTab;
  /** chrome.storage.local 초기값 — 로그인 플래그 등. */
  local?: Record<string, unknown>;
  /** chrome.storage.session 초기값 — 저장 기록. */
  session?: Record<string, unknown>;
}

export interface ChromeMock {
  sendMessage: ReturnType<typeof vi.fn>;
  /** 활성 탭 조회 횟수 — 불필요한 재조회를 확인할 때 쓴다. */
  queryTabs: ReturnType<typeof vi.fn>;
  createTab: ReturnType<typeof vi.fn>;
  /** storage.onChanged 를 흉내 내 background 가 결과를 쓴 상황을 만든다. */
  emitSessionChange: (key: string, newValue: unknown) => void;
  /** 이후 tabs.query 가 돌려줄 활성 탭을 바꾼다. */
  setActiveTab: (tab: MockTab) => void;
  /** 사용자가 다른 탭으로 전환한 상황. */
  emitTabActivated: () => void;
  /** 같은 탭에서 페이지가 바뀐 상황. 기본값은 활성 탭의 주소가 바뀐 경우. */
  emitTabUpdated: (
    changeInfo?: chrome.tabs.OnUpdatedInfo,
    tab?: Partial<chrome.tabs.Tab>,
  ) => void;
  /** 언마운트 후 리스너가 남아 있는지 확인용. */
  tabListenerCount: () => number;
  /** background 가 로그인을 끝내 storage.local 에 토큰을 쓴 상황. */
  emitLocalChange: (key: string, newValue: unknown) => void;
  /** 패널이 background 로 메시지를 보낸 상황(runtime.onMessage). */
  emitMessage: (message: unknown) => void;
  /** 웹앱 탭이 background 로 메시지를 보낸 상황(runtime.onMessageExternal). */
  emitExternalMessage: (
    message: unknown,
    sender: { url?: string },
    sendResponse: (response: unknown) => void,
  ) => void;
}

type StorageListener = (
  changes: Record<string, chrome.storage.StorageChange>,
  areaName: string,
) => void;

type TabUpdatedListener = (
  tabId: number,
  changeInfo: chrome.tabs.OnUpdatedInfo,
  tab: chrome.tabs.Tab,
) => void;

type MessageListener = (message: unknown) => boolean;

type ExternalMessageListener = (
  message: unknown,
  sender: { url?: string },
  sendResponse: (response: unknown) => void,
) => boolean;

/** addListener/removeListener 를 실제로 배열에 반영하는 이벤트 스텁. */
function createEvent<T>() {
  const listeners: T[] = [];

  return {
    listeners,
    event: {
      addListener: vi.fn((listener: T) => {
        listeners.push(listener);
      }),
      removeListener: vi.fn((listener: T) => {
        const index = listeners.indexOf(listener);
        if (index >= 0) listeners.splice(index, 1);
      }),
    },
  };
}

/**
 * 사이드패널 테스트용 chrome API 스텁.
 *
 * 실제 확장 런타임이 없는 jsdom 에서 UI 를 그대로 렌더하기 위해, 우리가 쓰는 표면
 * (tabs.query/create/onActivated/onUpdated, storage.local/session, runtime.sendMessage)만 만든다.
 */
export function installChromeMock(options: ChromeMockOptions = {}): ChromeMock {
  const local = new Map(Object.entries(options.local ?? {}));
  const session = new Map(Object.entries(options.session ?? {}));
  const storageChange = createEvent<StorageListener>();
  const activated = createEvent<() => void>();
  const updated = createEvent<TabUpdatedListener>();
  const message = createEvent<MessageListener>();
  const externalMessage = createEvent<ExternalMessageListener>();

  let activeTab: MockTab = options.tab ?? {};

  const area = (store: Map<string, unknown>) => ({
    get: vi.fn(async (key: string) => {
      const value = store.get(key);

      return value === undefined ? {} : { [key]: value };
    }),
    set: vi.fn(async (items: Record<string, unknown>) => {
      for (const [key, value] of Object.entries(items)) store.set(key, value);
    }),
    remove: vi.fn(async (key: string) => {
      store.delete(key);
    }),
  });

  const sendMessage = vi.fn(async () => undefined);
  const createTab = vi.fn(async () => undefined);
  const queryTabs = vi.fn(async () => [activeTab]);

  vi.stubGlobal("chrome", {
    tabs: {
      query: queryTabs,
      create: createTab,
      remove: vi.fn(async () => undefined),
      onActivated: activated.event,
      onUpdated: updated.event,
    },
    storage: {
      local: area(local),
      session: area(session),
      onChanged: storageChange.event,
    },
    runtime: {
      sendMessage,
      onMessage: message.event,
      onMessageExternal: externalMessage.event,
      onInstalled: createEvent<() => void>().event,
    },
    sidePanel: { setPanelBehavior: vi.fn(async () => undefined) },
  });

  return {
    sendMessage,
    queryTabs,
    createTab,
    emitSessionChange: (key, newValue) => {
      session.set(key, newValue);
      for (const listener of [...storageChange.listeners]) {
        listener({ [key]: { newValue } }, "session");
      }
    },
    setActiveTab: (tab) => {
      activeTab = tab;
    },
    emitTabActivated: () => {
      for (const listener of [...activated.listeners]) listener();
    },
    emitTabUpdated: (changeInfo, tab) => {
      for (const listener of [...updated.listeners]) {
        listener(activeTab.id ?? 1, changeInfo ?? { url: activeTab.url }, {
          active: true,
          ...tab,
        } as chrome.tabs.Tab);
      }
    },
    tabListenerCount: () =>
      activated.listeners.length + updated.listeners.length,
    emitLocalChange: (key, newValue) => {
      local.set(key, newValue);
      for (const listener of [...storageChange.listeners]) {
        listener({ [key]: { newValue } }, "local");
      }
    },
    emitMessage: (payload) => {
      for (const listener of [...message.listeners]) listener(payload);
    },
    emitExternalMessage: (payload, sender, sendResponse) => {
      for (const listener of [...externalMessage.listeners]) {
        listener(payload, sender, sendResponse);
      }
    },
  };
}
