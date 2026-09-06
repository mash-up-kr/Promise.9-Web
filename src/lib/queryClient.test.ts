import { createQueryClient } from "./queryClient";

// 앱과 공유 익스텐션이 각자 인스턴스를 만들되 기본값은 갈라지지 않아야 한다.
it("기본 쿼리 옵션은 재시도 1회 · 포커스 재조회 없음", () => {
  const queries = createQueryClient().getDefaultOptions().queries;

  expect(queries?.retry).toBe(1);
  expect(queries?.refetchOnWindowFocus).toBe(false);
});
