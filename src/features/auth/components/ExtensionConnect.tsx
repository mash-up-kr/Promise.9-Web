import { useEffect, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ActionButton } from "@/components/ui/action-button/ActionButton";
import { Text } from "@/components/ui/text/Text";

import { connectExtension } from "../extensionHandoff";
import { LoginGraphic } from "./LoginGraphic";

type ConnectStatus = "connecting" | "done" | "failed";

const DESCRIPTION: Record<ConnectStatus, string> = {
  connecting: "익스텐션에 계정을 연결하고 있어요",
  done: "연결됐어요! 이 탭은 곧 닫혀요",
  failed: "연결에 실패했어요. 다시 시도해주세요.",
};

/**
 * 익스텐션이 연 탭(`?return=extension`)에서 로그인이 확인된 뒤 보여주는 연결 화면.
 *
 * 계정 연결(`connectExtension`)을 스스로 실행하고 결과만 보여준다 — 성공하면 익스텐션
 * background 가 이 탭을 닫아 사용자를 원래 페이지로 돌려보내므로, 홈으로 이동하지 않는다.
 */
export function ExtensionConnect() {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<ConnectStatus>("connecting");

  // "connecting" 이 곧 실행 명령이다 — 마운트 직후와 재시도(retry)가 같은 경로로 연결을 시도한다.
  useEffect(() => {
    if (status !== "connecting") return;

    let cancelled = false;

    connectExtension().then((ok) => {
      if (!cancelled) setStatus(ok ? "done" : "failed");
    });

    return () => {
      cancelled = true;
    };
  }, [status]);

  const retry = () => setStatus("connecting");

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
            링딩동 계정 연결
          </Text>
          <Text variant="body-2-reading" className="text-text-alternative">
            {DESCRIPTION[status]}
          </Text>
        </View>
      </View>

      {status === "failed" && (
        <View className="px-5">
          <ActionButton onPress={retry}>다시 시도</ActionButton>
        </View>
      )}
    </View>
  );
}
