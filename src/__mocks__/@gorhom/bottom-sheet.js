// @gorhom/bottom-sheet jest stub
// gorhom 는 reanimated/gesture-handler 네이티브에 의존하므로 jest 에선 렌더 stub 만 제공한다.
// 실제 시트 애니·제스처·키보드는 device 에서 검증한다.
const React = require("react");
const { View, Pressable, ScrollView, TextInput } = require("react-native");

// useBottomSheet(자손에서 close 등 명령 호출)를 흉내내기 위한 컨텍스트.
const SheetContext = React.createContext(null);

const BottomSheet = React.forwardRef(
  (
    {
      children,
      onChange,
      backdropComponent: Backdrop,
      enablePanDownToClose = true,
    },
    ref,
  ) => {
    const commands = {
      snapToIndex: () => {},
      expand: () => {},
      collapse: () => {},
      close: () => onChange?.(-1),
      forceClose: () => onChange?.(-1),
    };
    React.useImperativeHandle(ref, () => commands);
    // "sheet-dismiss" 를 누르면 시트 닫힘(index -1)을 시뮬레이션한다(pan-down 대체).
    // enablePanDownToClose=false(isLocked) 면 무시한다.
    // 백드롭에는 onDismiss 를 주입해 pressBehavior="close" 탭 닫힘을 시뮬레이션한다.
    return React.createElement(
      SheetContext.Provider,
      { value: commands },
      React.createElement(
        View,
        null,
        Backdrop
          ? React.createElement(Backdrop, {
              onDismiss: () => onChange?.(-1),
            })
          : null,
        React.createElement(Pressable, {
          accessibilityLabel: "sheet-dismiss",
          onPress: () => {
            if (enablePanDownToClose) onChange?.(-1);
          },
        }),
        children,
      ),
    );
  },
);
BottomSheet.displayName = "BottomSheet";

const passthrough = (name, Base) => {
  const C = React.forwardRef(({ children, ...props }, ref) =>
    React.createElement(Base, { ...props, ref }, children),
  );
  C.displayName = name;
  return C;
};

module.exports = {
  __esModule: true,
  default: BottomSheet,
  useBottomSheet: () => React.useContext(SheetContext),
  useBottomSheetSpringConfigs: (config) => config,
  BottomSheetModal: BottomSheet,
  BottomSheetModalProvider: ({ children }) => children,
  BottomSheetView: passthrough("BottomSheetView", View),
  BottomSheetScrollView: passthrough("BottomSheetScrollView", ScrollView),
  BottomSheetTextInput: passthrough("BottomSheetTextInput", TextInput),
  // pressBehavior="close" 백드롭 탭 닫힘 시뮬레이션 — BottomSheet mock 이 onDismiss 를 주입한다.
  BottomSheetBackdrop: ({ pressBehavior, onDismiss }) =>
    React.createElement(Pressable, {
      accessibilityLabel: "sheet-backdrop",
      onPress: () => {
        if (pressBehavior === "close") onDismiss?.();
      },
    }),
  BottomSheetHandle: passthrough("BottomSheetHandle", View),
  BottomSheetFooter: passthrough("BottomSheetFooter", View),
};
