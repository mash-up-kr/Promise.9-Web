import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

/** 실패를 즉시 단언할 수 있도록 재시도를 끈 테스트 전용 QueryClient. */
function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

export function renderPanel(ui: ReactElement) {
  return render(ui, { wrapper: createWrapper() });
}
