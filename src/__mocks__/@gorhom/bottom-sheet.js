// @gorhom/bottom-sheet jest stub
// gorhom 는 reanimated/gesture-handler 네이티브에 의존하므로 jest 에선 렌더 stub 만 제공한다.
// 실제 시트 애니·제스처·키보드는 device 에서 검증한다.
const React = require("react");
const { View, Pressable, ScrollView, TextInput } = require("react-native");

const BottomSheet = React.forwardRef(({ children, onChange }, ref) => {
  React.useImperativeHandle(ref, () => ({
    snapToIndex: () => {},
    expand: () => {},
    collapse: () => {},
    close: () => onChange?.(-1),
    forceClose: () => onChange?.(-1),
  }));
  // "sheet-dismiss" 를 누르면 시트 닫힘(index -1)을 시뮬레이션한다.
  return React.createElement(
    View,
    null,
    React.createElement(Pressable, {
      accessibilityLabel: "sheet-dismiss",
      onPress: () => onChange?.(-1),
    }),
    children,
  );
});
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
  BottomSheetModal: BottomSheet,
  BottomSheetModalProvider: ({ children }) => children,
  BottomSheetView: passthrough("BottomSheetView", View),
  BottomSheetScrollView: passthrough("BottomSheetScrollView", ScrollView),
  BottomSheetTextInput: passthrough("BottomSheetTextInput", TextInput),
  BottomSheetBackdrop: passthrough("BottomSheetBackdrop", View),
  BottomSheetHandle: passthrough("BottomSheetHandle", View),
  BottomSheetFooter: passthrough("BottomSheetFooter", View),
};
