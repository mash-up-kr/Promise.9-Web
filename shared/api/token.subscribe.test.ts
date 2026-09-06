import {
  clearTokens,
  setTokenPersistence,
  setTokens,
  subscribeTokens,
} from "./token";

const memoryPersistence = () => {
  let stored: string | null = null;
  return {
    getRefreshToken: async () => stored,
    setRefreshToken: async (token: string | null) => {
      stored = token;
    },
  };
};

beforeEach(() => {
  setTokenPersistence(memoryPersistence());
});

afterEach(async () => {
  setTokenPersistence(memoryPersistence());
  await clearTokens();
  setTokenPersistence(null);
});

test("setTokens 가 저장을 마친 뒤 구독자에게 알린다", async () => {
  const listener = jest.fn();
  const unsubscribe = subscribeTokens(listener);

  await setTokens("atk", "rtk");

  expect(listener).toHaveBeenCalledTimes(1);
  unsubscribe();
});

test("clearTokens 도 구독자에게 알린다", async () => {
  const listener = jest.fn();
  const unsubscribe = subscribeTokens(listener);

  await clearTokens();

  expect(listener).toHaveBeenCalledTimes(1);
  unsubscribe();
});

test("해제 함수를 호출하면 더 이상 알리지 않는다", async () => {
  const listener = jest.fn();
  const unsubscribe = subscribeTokens(listener);
  unsubscribe();

  await setTokens("atk", "rtk");

  expect(listener).not.toHaveBeenCalled();
});

test("저장소 쓰기가 실패하면 알리지 않는다", async () => {
  setTokenPersistence({
    getRefreshToken: async () => null,
    setRefreshToken: async () => {
      throw new Error("disk");
    },
  });
  const listener = jest.fn();
  subscribeTokens(listener);

  await expect(setTokens("atk", "rtk")).rejects.toThrow("disk");

  expect(listener).not.toHaveBeenCalled();
});
