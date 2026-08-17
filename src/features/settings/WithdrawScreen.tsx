import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ActionButton } from "@/components/ui/action-button/ActionButton";
import { Header } from "@/components/ui/header/Header";
import { HeaderBackButton } from "@/components/ui/header/HeaderBackButton";
import { Text } from "@/components/ui/text/Text";

import { WithdrawGraphic } from "./components/WithdrawGraphic";
import { useWithdraw } from "./hooks/useWithdraw";

export function WithdrawScreen() {
  const withdraw = useWithdraw();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background-base">
      <Header title="회원 탈퇴" left={<HeaderBackButton />} />

      <View className="flex-1 items-center justify-center gap-16 px-5">
        <View className="items-center gap-1">
          <Text variant="heading-2" className="text-center text-text-strong">
            링띵동을 정말 떠나시나요?
          </Text>
          <Text
            variant="body-2-normal"
            className="text-center text-text-alternative"
          >
            지금까지 저장된 링크, 폴더 내역이 모두 사라져요.
          </Text>
        </View>
        <WithdrawGraphic />
      </View>

      <View className="px-5 pt-5" style={{ paddingBottom: insets.bottom + 20 }}>
        <ActionButton
          variant="destructive"
          className="w-full"
          onPress={withdraw}
        >
          탈퇴하기
        </ActionButton>
      </View>
    </View>
  );
}
