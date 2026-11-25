import { Pressable, View } from "react-native";

import { Icon, type IconComponent } from "../icon/Icon";
import { Text } from "../text/Text";

export interface InlineNoticeAction {
  label: string;
  onPress: () => void;
}

export interface InlineNoticeProps {
  icon: IconComponent;
  message: string;
  action?: InlineNoticeAction;
}

// Figma Inline Notice: 화면·그룹 위에 띄우는 상태 안내 카드. 노란색은 액션(Text Button primary)에만 쓴다.
export function InlineNotice({ icon, message, action }: InlineNoticeProps) {
  return (
    <View className="flex-row items-center gap-2.5 rounded-2xl bg-background-list p-4">
      <Icon iconNode={icon} size={20} className="text-icon-normal" />
      <Text variant="body-3" className="flex-1">
        {message}
      </Text>
      {action ? <NoticeAction {...action} /> : null}
    </View>
  );
}

function NoticeAction({ label, onPress }: InlineNoticeAction) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      // 시안: 터치 영역 최소 44px — 버튼 높이 20 + 위아래 12.
      hitSlop={12}
      className="shrink-0 items-center justify-center rounded-xl py-0.5 active:opacity-60"
    >
      <Text variant="label-2-semibold" className="text-action-primary">
        {label}
      </Text>
    </Pressable>
  );
}
