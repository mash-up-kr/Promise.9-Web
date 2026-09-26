import type { PropsWithChildren, ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { KeyboardAvoidingView } from "./dialogKeyboardAvoidingView";

const EXTENSION_EDGE_GAP = 16;
const EXTENSION_SIDE_PADDING = 20;

export interface DialogProps {
  children: ReactNode;
  /**
   * 배경(dim)을 눌러 닫는 동작. 넘기지 않으면 배경을 아예 그리지 않는다 —
   * 호출부가 배경을 직접 그리는 경우(AlertDialog) dim 이 두 겹이 되지 않게 한다.
   */
  onDismiss?: () => void;
  dismissAccessibilityLabel?: string;
  /**
   * 카드에 텍스트 입력이 있는지 — iOS 공유 익스텐션에서만 쓴다. 입력 카드는 키보드에 가리지 않게
   * 위에 붙여 띄우고, 나머지(피커·알림)는 가운데 둔다.
   */
  hasTextInput?: boolean;
}

/**
 * 화면 중앙 카드 오버레이의 공통 뼈대.
 *
 * **정렬 · dim · 키보드 회피만** 담당하고 카드 겉모습(글래스/솔리드·폭·radius)은 children 이
 * 정한다 — 알림과 폼은 카드 스타일이 다르지만 띄우는 방식은 같기 때문이다.
 * 오버레이 호스트(RN Modal)도 여기서 만들지 않는다: 라우트 화면은 이미 투명 모달이라
 * Modal 이 필요 없고, 화면 안에서 띄우는 쪽만 Modal 로 감싼다.
 *
 * children 은 화면을 채우는 컨테이너의 **직계 자식**으로 둔다 — 배경을 직접 그리는
 * 호출부(AlertDialog)가 `absoluteFill` 로 화면 전체를 덮을 수 있어야 하기 때문이다.
 * 래퍼를 한 겹 끼우면 그 배경의 기준이 카드 크기로 줄어 dim 도 탭 영역도 카드만 해진다.
 */
export function Dialog({
  children,
  onDismiss,
  dismissAccessibilityLabel = "닫기",
  hasTextInput = false,
}: DialogProps) {
  const Container = !globalThis.__promise9ShareExtension
    ? KeyboardAvoidingContainer
    : hasTextInput
      ? ExtensionInputContainer
      : CenteredContainer;

  return (
    <Container>
      {onDismiss ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={dismissAccessibilityLabel}
          onPress={onDismiss}
          style={StyleSheet.absoluteFill}
          className="bg-opacity-black-50"
        />
      ) : null}
      {children}
    </Container>
  );
}

function KeyboardAvoidingContainer({ children }: PropsWithChildren) {
  return (
    <KeyboardAvoidingView
      behavior="padding"
      className="flex-1 items-center justify-center px-5"
    >
      {children}
    </KeyboardAvoidingView>
  );
}

// iOS 공유 익스텐션 프로세스는 RN 키보드 이벤트 좌표가 0 으로 와서 키보드 회피가 카드를 화면 밖으로
// 밀어낸다 — 익스텐션에선 회피하지 않는다. 키보드가 뜨지 않는 카드는 그대로 가운데 둔다.
function CenteredContainer({ children }: PropsWithChildren) {
  return (
    <View className="flex-1 items-center justify-center px-5">{children}</View>
  );
}

// 입력 카드는 위에 붙여 키보드가 올라와도 입력이 보이게 하고, 작은 화면에서 가려진 버튼은
// 네이티브 키보드 인셋으로 스크롤해 꺼낸다(EntrySheet 와 같은 방식).
// 익스텐션 root 는 상태바 아래에서 시작해 그 Safe Area 는 top 0 이다 — 화면 맨 위부터 덮는 모달 안에서 다시 잰다.
function ExtensionInputContainer({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider>
      <TopAnchoredScrollView>{children}</TopAnchoredScrollView>
    </SafeAreaProvider>
  );
}

function TopAnchoredScrollView({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
      // 배경(dim)도 스크롤 안에 있어 튕기면 dim 바깥이 드러난다.
      bounces={false}
      className="flex-1"
      // react-native-css 는 contentContainerClassName 을 contentContainerStyle 과 합치지 않는다 — 한곳에 둔다.
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: "center",
        paddingHorizontal: EXTENSION_SIDE_PADDING,
        paddingTop: insets.top + EXTENSION_EDGE_GAP,
        paddingBottom: insets.bottom + EXTENSION_EDGE_GAP,
      }}
    >
      {children}
    </ScrollView>
  );
}
