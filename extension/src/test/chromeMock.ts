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
  createTab: ReturnType<typeof vi.fn>;
  /** storage.onChanged 를 흉내 내 background 가 결과를 쓴 상황을 만든다. */
  emitSessionChange: (key: string, newValue: unknown) => void;
  /** 이후 tabs.query 가 돌려줄 활성 탭을 바꾼다. */
  setActiveTab: (tab: MockTab) => void;
  /** 사용자가 다른 탭으로 전환한 상황. */
  emitTabActivated: () => void;
  /** 같은 탭에서 페이지가 바뀐 상황. */
  emitTabUpdated: () => void;
  /** 언마운트 후 리스너가 남아 있는지 확인용. */
  tabListenerCount: () => number;
  /** background 가 로그인을 끝내 storage.local 에 토큰을 쓴 상황. */
  emitLocalChange: (key: string, newValue: unknown) => void;
}

type StorageListener = (
  changes: Record<string, chrome.storage.StorageChange>,
  areaName: string,
) => void;

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
  const updated = createEvent<() => void>();

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

  vi.stubGlobal("chrome", {
    tabs: {
      query: vi.fn(async () => [activeTab]),
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
      onMessage: { addListener: vi.fn() },
      onMessageExternal: { addListener: vi.fn() },
    },
  });

  return {
    sendMessage,
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
    emitTabUpdated: () => {
      for (const listener of [...updated.listeners]) listener();
    },
    tabListenerCount: () =>
      activated.listeners.length + updated.listeners.length,
    emitLocalChange: (key, newValue) => {
      local.set(key, newValue);
      for (const listener of [...storageChange.listeners]) {
        listener({ [key]: { newValue } }, "local");
      }
    },
  };
}
