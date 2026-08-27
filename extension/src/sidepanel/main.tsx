import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { createExtensionQueryClient } from "@/lib/queryClient";
import { SidePanelApp } from "@/sidepanel/SidePanelApp";
import "@/styles/global.css";

const queryClient = createExtensionQueryClient();

async function bootstrap() {
  // 확장으로 설치하지 않고 `pnpm dev` 주소를 일반 탭에서 열었을 때만 chrome API 를 흉내 낸다.
  // 프로덕션 빌드에서는 이 분기 자체가 제거된다.
  if (import.meta.env.DEV && typeof chrome?.tabs === "undefined") {
    const { installDevChromeStub } = await import("@/dev/chromeStub");
    installDevChromeStub();
  }

  const container = document.getElementById("root");
  if (!container) throw new Error("#root 를 찾을 수 없습니다.");

  createRoot(container).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <SidePanelApp />
      </QueryClientProvider>
    </StrictMode>,
  );
}

bootstrap().catch((error) => {
  console.error("패널을 띄우지 못했습니다.", error);
});
