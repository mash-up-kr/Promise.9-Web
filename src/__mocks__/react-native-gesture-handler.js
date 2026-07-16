// react-native-gesture-handler jest stub
// 제스처는 네이티브 바인딩에 의존하므로 jest 에선 렌더 stub 만 제공한다.
// 실제 드래그 동작은 device 에서 검증한다(SortableFolderList).
const React = require("react");
const { View } = require("react-native");

const NOOP = () => {};

// Gesture.Pan() 등의 빌더: 모든 체이닝 메서드가 자기 자신을 반환한다.
const makeGestureBuilder = () => {
  const builder = {};
  const chain = () => builder;
  for (const method of [
    "onBegin",
    "onStart",
    "onUpdate",
    "onChange",
    "onEnd",
    "onFinalize",
    "onTouchesDown",
    "onTouchesMove",
    "onTouchesUp",
    "enabled",
    "minDistance",
    "activateAfterLongPress",
    "hitSlop",
    "shouldCancelWhenOutside",
    "simultaneousWithExternalGesture",
    "requireExternalGestureToFail",
    "blocksExternalGesture",
    "runOnJS",
  ]) {
    builder[method] = chain;
  }
  return builder;
};

const Gesture = {
  Pan: makeGestureBuilder,
  Tap: makeGestureBuilder,
  LongPress: makeGestureBuilder,
  Native: makeGestureBuilder,
  Simultaneous: (...gestures) => gestures[0],
  Race: (...gestures) => gestures[0],
  Exclusive: (...gestures) => gestures[0],
};

const GestureDetector = ({ children }) => children;

const GestureHandlerRootView = React.forwardRef((props, ref) =>
  React.createElement(View, { ...props, ref }),
);
GestureHandlerRootView.displayName = "GestureHandlerRootView";

module.exports = {
  __esModule: true,
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  Directions: { RIGHT: 1, LEFT: 2, UP: 4, DOWN: 8 },
  State: {
    UNDETERMINED: 0,
    FAILED: 1,
    BEGAN: 2,
    CANCELLED: 3,
    ACTIVE: 4,
    END: 5,
  },
  GestureHandlerRootHOC: (component) => component,
  gestureHandlerRootHOC: (component) => component,
  enableExperimentalWebImplementation: NOOP,
};
