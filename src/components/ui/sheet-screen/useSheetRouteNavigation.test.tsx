const mockRouter = { push: jest.fn(), replace: jest.fn() };
const mockNavigation = { dispatch: jest.fn(), canGoBack: jest.fn(() => true) };
jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useNavigation: () => mockNavigation,
  useRoute: () => ({ key: "sheet" }),
}));

import { renderHook } from "@testing-library/react-native";

import { useSheetRouteNavigation } from "./useSheetRouteNavigation";

const { StackRouter } =
  jest.requireActual<typeof import("expo-router")>("expo-router");

const detailHref = { pathname: "/link/[id]", params: { id: "7" } } as const;

// 시트 위에 다른 라우트가 올라와 포커스를 가져간 루트 스택.
const rootStack = {
  stale: false as const,
  type: "stack" as const,
  key: "root-stack",
  index: 2,
  routeNames: ["(tabs)", "create-link", "link/[id]"],
  routes: [
    { key: "tabs", name: "(tabs)" },
    { key: "sheet", name: "create-link" },
    { key: "detail", name: "link/[id]" },
  ],
  preloadedRoutes: [],
};

function applyDispatchedAction(state: typeof rootStack) {
  const [thunk] = mockNavigation.dispatch.mock.calls[0];
  const action = typeof thunk === "function" ? thunk(state) : thunk;
  return StackRouter({}).getStateForAction(state, action, {
    routeNames: state.routeNames,
    routeParamList: {},
    routeGetIdList: {},
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockNavigation.canGoBack.mockReturnValue(true);
});

// 출처만 실은 back(navigation.goBack 포함)은 스택이 포커스된 라우트를 뺀다.
test("닫기는 포커스와 상관없이 시트 라우트 자신만 뺀다", async () => {
  const { result } = await renderHook(() => useSheetRouteNavigation());

  result.current.closeSheet();

  expect(
    applyDispatchedAction(rootStack)?.routes.map(({ key }) => key),
  ).toEqual(["tabs", "detail"]);
});

test("뒤로 갈 곳이 없으면(웹 직접 진입) 홈으로 대체한다", async () => {
  mockNavigation.canGoBack.mockReturnValue(false);
  const { result } = await renderHook(() => useSheetRouteNavigation());

  result.current.closeSheet();

  expect(mockRouter.replace).toHaveBeenCalledWith("/");
  expect(mockNavigation.dispatch).not.toHaveBeenCalled();
});

// iOS 는 투명 모달 시트가 떠 있는 채로 push 하면 새 화면이 시트 뒤에 쌓여 보이지 않는다.
test("시트가 떠 있는 동안 다른 화면으로 가면 시트 자리를 그 화면으로 바꾼다", async () => {
  const { result } = await renderHook(() => useSheetRouteNavigation());

  result.current.navigateFromSheet(detailHref);

  expect(mockRouter.replace).toHaveBeenCalledWith(detailHref);
  expect(mockRouter.push).not.toHaveBeenCalled();
});

test("시트 라우트가 사라진 뒤(스낵바 '보기' 등)에는 평소처럼 push 한다", async () => {
  const { result, unmount } = await renderHook(() => useSheetRouteNavigation());
  await unmount();

  result.current.navigateFromSheet(detailHref);

  expect(mockRouter.push).toHaveBeenCalledWith(detailHref);
  expect(mockRouter.replace).not.toHaveBeenCalled();
});

test("닫기를 시작한 뒤에는 시트가 사라지기 전이라도 push 한다", async () => {
  const { result } = await renderHook(() => useSheetRouteNavigation());
  result.current.closeSheet();

  result.current.navigateFromSheet(detailHref);

  expect(mockRouter.push).toHaveBeenCalledWith(detailHref);
  expect(mockRouter.replace).not.toHaveBeenCalled();
});

// 시트 자리를 다른 화면으로 바꾼 뒤 닫힘 애니메이션 콜백이 늦게 와도 그 화면을 빼거나 홈으로 바꾸지 않는다.
test("다른 화면으로 떠난 뒤 늦게 온 닫기는 무시한다", async () => {
  mockNavigation.canGoBack.mockReturnValue(false);
  const { result } = await renderHook(() => useSheetRouteNavigation());
  result.current.navigateFromSheet(detailHref);

  result.current.closeSheet();

  expect(mockNavigation.dispatch).not.toHaveBeenCalled();
  expect(mockRouter.replace).toHaveBeenCalledTimes(1);
});

test("시트 라우트가 사라진 뒤 늦게 온 닫기는 무시한다", async () => {
  const { result, unmount } = await renderHook(() => useSheetRouteNavigation());
  await unmount();

  result.current.closeSheet();

  expect(mockNavigation.dispatch).not.toHaveBeenCalled();
  expect(mockRouter.replace).not.toHaveBeenCalled();
});
