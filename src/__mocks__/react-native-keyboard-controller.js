// react-native-keyboard-controller jest stub
// 네이티브 바인딩 초기화 없이 최소 인터페이스만 제공한다.
// 실제 keyboard 동작(높이 변화)은 device 테스트(Task 13)에서 검증한다.
const NOOP = () => {};

const sharedValue = (init) => ({
  value: init,
  get: () => init,
  set: NOOP,
  addListener: NOOP,
  removeListener: NOOP,
  modify: NOOP,
});

module.exports = {
  useReanimatedKeyboardAnimation: () => ({
    height: sharedValue(0),
    progress: sharedValue(0),
  }),
  KeyboardProvider: ({ children }) => children,
  KeyboardController: {
    setInputMode: NOOP,
    setDefaultMode: NOOP,
  },
  AndroidSoftInputModes: {
    SOFT_INPUT_ADJUST_RESIZE: 16,
  },
};
