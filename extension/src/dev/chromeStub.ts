/**
 * 개발용 chrome API 스텁 — **dev 빌드에서만** 쓴다.
 *
 * 목적: 확장을 chrome 에 설치하지 않고도 `pnpm dev` 로 띄운 주소를 일반 탭에서 열어
 * 패널 UI 를 바로 확인하기 위한 것. 실제 저장은 하지 않고, background 로 보낸 메시지는
 * 콘솔에만 남긴다.
 *
 * 프로덕션 빌드에는 들어가지 않는다(main.tsx 가 `import.meta.env.DEV` 로만 동적 import).
 */

interface DevTab {
  url: string;
  title: string;
  favIconUrl?: string;
}

const DEFAULT_TAB: DevTab = {
  url: "https://toss.tech/article/50893",
  title: "누군가는 토스를 테스트하는 동안, 우리는 테스트하는 법을 만듭니다.",
  favIconUrl: "https://static.toss.im/icons/png/4x/icon-toss-logo.png",
};

type StorageListener = (
  changes: Record<string, { newValue?: unknown }>,
  areaName: string,
) => void;

/** addListener/removeListener 를 실제로 반영하는 이벤트 스텁. */
function createEvent<T extends (...args: never[]) => void>() {
  const listeners: T[] = [];

  return {
    listeners,
    fire: () => {
      for (const listener of [...listeners]) (listener as () => void)();
    },
    event: {
      addListener: (listener: T) => {
        listeners.push(listener);
      },
      removeListener: (listener: T) => {
        const index = listeners.indexOf(listener);
        if (index >= 0) listeners.splice(index, 1);
      },
    },
  };
}

function createArea(
  store: Map<string, unknown>,
  notify: (key: string) => void,
) {
  return {
    get: async (key: string) => {
      const value = store.get(key);

      return value === undefined ? {} : { [key]: value };
    },
    set: async (items: Record<string, unknown>) => {
      for (const [key, value] of Object.entries(items)) {
        store.set(key, value);
        notify(key);
      }
    },
    remove: async (key: string) => {
      store.delete(key);
      notify(key);
    },
  };
}

export function installDevChromeStub(): void {
  const local = new Map<string, unknown>();
  const session = new Map<string, unknown>();
  const storageChange = createEvent<StorageListener>();
  const activated = createEvent<() => void>();
  const updated = createEvent<() => void>();

  let tab: DevTab = DEFAULT_TAB;

  const notifySession = (key: string) => {
    for (const listener of [...storageChange.listeners]) {
      listener({ [key]: { newValue: session.get(key) } }, "session");
    }
  };

  // 일반 페이지에도 window.chrome 이 이미 있고 non-configurable 이라 defineProperty 는 던진다.
  // writable 이므로 통째로 덮어쓴다.
  (globalThis as { chrome?: unknown }).chrome = {
    tabs: {
      query: async () => [tab],
      create: async ({ url }: { url: string }) => {
        console.info("[dev-stub] tabs.create", url);
      },
      onActivated: activated.event,
      onUpdated: updated.event,
    },
    storage: {
      local: createArea(local, () => undefined),
      session: createArea(session, notifySession),
      onChanged: storageChange.event,
    },
    runtime: {
      // 실제 저장은 background 가 하지만 dev 페이지에는 background 가 없다.
      sendMessage: async (message: unknown) => {
        console.info("[dev-stub] runtime.sendMessage", message);
      },
      onMessage: { addListener: () => undefined },
    },
  };

  /**
   * 콘솔에서 탭 전환을 흉내 낸다 — 사이드패널의 핵심 동작(탭 따라가기)을 확장 설치 없이 보려고 둔다.
   * 예: `__devSwitchTab({ url: "https://example.com", title: "다른 페이지" })`
   */
  (globalThis as { __devSwitchTab?: unknown }).__devSwitchTab = (
    next: Partial<DevTab>,
  ) => {
    tab = { ...tab, ...next };
    activated.fire();
    updated.fire();

    return tab;
  };

  console.info(
    "[dev-stub] chrome API 스텁을 설치했습니다. 실제 저장은 동작하지 않습니다. " +
      "탭 전환은 __devSwitchTab({ url, title }) 으로 흉내 낼 수 있습니다.",
  );
}
