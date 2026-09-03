/** 우리가 쓰는 저장 영역. `local` 은 브라우저를 껐다 켜도 남고, `session` 은 사라진다. */
type StorageAreaName = "local" | "session";

export interface StorageEntry<T> {
  read(): Promise<T | null>;
  write(value: T): Promise<void>;
  clear(): Promise<void>;
  /** 값 변경을 구독한다. 다른 확장 컨텍스트가 쓴 변경까지 전파된다. */
  subscribe(onChange: (value: T | null) => void): () => void;
}

/**
 * 키 하나짜리 `chrome.storage` 래퍼.
 *
 * 사이드패널과 service worker 는 서로 다른 문서라 메모리를 공유하지 않는다 — 상태는 전부
 * storage 를 거쳐 오간다. 그래서 리프레시 토큰(local)과 저장 기록(session)이 읽기·쓰기·구독이라는
 * 같은 모양을 쓰고, 그 모양을 여기 한 번만 둔다.
 */
export function createStorageEntry<T>(
  areaName: StorageAreaName,
  key: string,
): StorageEntry<T> {
  // `chrome` 은 호출 시점에 읽는다 — 모듈 로드 시점에 붙잡아 두면 테스트의 스텁으로 갈아끼울 수 없다.
  const area = () => chrome.storage[areaName];

  return {
    async read() {
      const stored = await area().get(key);

      return (stored[key] as T | undefined) ?? null;
    },

    async write(value) {
      await area().set({ [key]: value });
    },

    async clear() {
      await area().remove(key);
    },

    subscribe(onChange) {
      const listener = (
        changes: Record<string, chrome.storage.StorageChange>,
        changedArea: string,
      ) => {
        if (changedArea !== areaName || !(key in changes)) return;

        onChange((changes[key]?.newValue as T | undefined) ?? null);
      };

      chrome.storage.onChanged.addListener(listener);

      return () => chrome.storage.onChanged.removeListener(listener);
    },
  };
}
