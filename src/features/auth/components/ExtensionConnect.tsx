import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ActionButton } from "@/components/ui/action-button/ActionButton";
import { Text } from "@/components/ui/text/Text";
import { ROUTES } from "@/constants/routes.constants";

import { connectExtension } from "../extensionHandoff";
import { LoginGraphic } from "./LoginGraphic";

type ConnectStatus = "connecting" | "done" | "failed";

const COPY: Record<ConnectStatus, { title: string; description: string }> = {
  connecting: {
    title: "링딩동 계정 연결",
    description: "익스텐션에 계정을 연결하고 있어요",
  },
  done: {
    title: "로그인 완료!",
    description: "익스텐션에 계정이 연결됐어요",
  },
  failed: {
    title: "링딩동 계정 연결",
    description: "연결에 실패했어요. 다시 시도해주세요.",
  },
};

/**
 * 익스텐션이 연 탭(`?return=extension`)에서 로그인이 확인된 뒤 보여주는 연결 화면.
 *
 * 계정 연결(`connectExtension`)을 스스로 실행하고 결과를 보여준다 — 홈으로 이동하지 않고,
 * 완료 안내와 함께 "원래 탭으로 돌아가기" 버튼으로 사용자가 직접 이 탭을 닫게 한다
 * (자동으로 닫으면 로그인이 끝났다는 걸 볼 새가 없다).
 */
export interface ExtensionConnectProps {
  /**
   * 웹 세션이 만료·폐기돼 연결할 수 없을 때.
   *
   * 재시도해도 결과가 같으므로 이 화면에 붙잡아 두지 않고 로그인 화면이 다시 로그인시킨다.
   */
  onUnauthenticated: () => void;
}

export function ExtensionConnect({ onUnauthenticated }: ExtensionConnectProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<ConnectStatus>("connecting");

  // "connecting" 이 곧 실행 명령이다 — 마운트 직후와 재시도(retry)가 같은 경로로 연결을 시도한다.
  useEffect(() => {
    if (status !== "connecting") return;

    let cancelled = false;

    connectExtension().then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setStatus("done");
        return;
      }
      if (result.reason === "unauthenticated") {
        onUnauthenticated();
        return;
      }
      setStatus("failed");
    });

    return () => {
      cancelled = true;
    };
  }, [status, onUnauthenticated]);

  const retry = () => setStatus("connecting");

  // 연결이 안 되더라도 로그인 자체는 끝났다 — 웹앱을 쓰러 나갈 길을 남긴다.
  const goHome = () => router.replace(ROUTES.HOME);

  // 이 탭은 익스텐션(chrome.tabs.create)이 열었고 내비게이션 이력이 1이라 window.close() 로
  // 닫을 수 있다 — 닫히면 크롬이 직전에 보던 탭을 다시 활성화한다. (RN 네이티브엔 close 가 없다.)
  const returnToOriginalTab = () =>
    (globalThis as { close?: () => void }).close?.();

  return (
    <View
      className="flex-1 bg-background-base"
      style={{
        paddingTop: insets.top,
        paddingBottom: Math.max(insets.bottom, 16),
      }}
    >
      <View className="flex-1 justify-center px-5">
        <LoginGraphic />
        <View className="mt-10 items-center gap-1">
          <Text variant="heading-3" className="text-text-strong">
            {COPY[status].title}
          </Text>
          <Text variant="body-2-reading" className="text-text-alternative">
            {COPY[status].description}
          </Text>
        </View>
      </View>

      {status === "done" && (
        <View className="px-5">
          <ActionButton onPress={returnToOriginalTab}>
            원래 탭으로 돌아가기
          </ActionButton>
        </View>
      )}
      {status === "failed" && (
        <View className="gap-3 px-5">
          <ActionButton onPress={retry}>다시 시도</ActionButton>
          <ActionButton variant="assistive" onPress={goHome}>
            홈으로 가기
          </ActionButton>
        </View>
      )}
    </View>
  );
}
