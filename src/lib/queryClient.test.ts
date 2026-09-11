import { createQueryClient } from "./queryClient";

// 앱과 공유 익스텐션이 각자 인스턴스를 만들되 기본값은 갈라지지 않아야 한다.
it("기본 쿼리 옵션은 재시도 1회", () => {
  const queries = createQueryClient().getDefaultOptions().queries;

  expect(queries?.retry).toBe(1);
});

// 공유 익스텐션(별도 프로세스)·크롬 익스텐션(별도 탭)·다른 기기에서 저장한 링크는 앱이
// 다시 포커스될 때만 알 수 있다 — react-query 기본값(포커스 재조회)을 끄지 않는다.
it("포커스 복귀 시 재조회를 끄지 않는다", () => {
  const queries = createQueryClient().getDefaultOptions().queries;

  expect(queries?.refetchOnWindowFocus).not.toBe(false);
});
