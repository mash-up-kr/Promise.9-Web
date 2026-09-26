import { getPendingRefresh } from "@shared/api";
import type { QueryClient } from "@tanstack/react-query";

export const PENDING_WORK_TIMEOUT_MS = 5000;

/**
 * iOS 는 공유를 끝내면 익스텐션 프로세스를 곧 종료한다(expo-share-extension 패치). 토큰 재발급(RTR)
 * 도중에 끊기면 서버만 리프레시 토큰을 회전하고 새 토큰은 저장되지 못해 앱까지 로그아웃되고,
 * 로그인·저장 요청 도중이면 그 결과가 버려진다. 진행 중인 재발급과 queryClient 의 요청이 끝난 뒤 —
 * 늦어도 제한 시간 뒤 — run 을 부른다. 기다릴 것이 없으면 바로 부른다.
 */
export function runAfterPendingWork(
  run: () => void,
  queryClient?: QueryClient,
): void {
  const pendingWork = [
    getPendingRefresh(),
    queryClient ? getPendingMutations(queryClient) : null,
  ].filter((work) => work !== null);
  if (pendingWork.length === 0) {
    run();
    return;
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, PENDING_WORK_TIMEOUT_MS);
  });
  // 기다리던 작업이 실패해도 run 은 부른다 — 결과는 작업을 시작한 쪽이 처리한다.
  const finish = () => {
    clearTimeout(timer);
    run();
  };
  void Promise.race([Promise.all(pendingWork), timeout]).then(finish, finish);
}

function getPendingMutations(queryClient: QueryClient): Promise<void> | null {
  if (queryClient.isMutating() === 0) return null;
  return new Promise((resolve) => {
    const unsubscribe = queryClient.getMutationCache().subscribe(() => {
      if (queryClient.isMutating() > 0) return;
      unsubscribe();
      resolve();
    });
  });
}
