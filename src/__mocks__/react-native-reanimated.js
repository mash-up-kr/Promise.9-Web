// react-native-reanimated jest stub
// reanimated 4.x 는 react-native-worklets 네이티브 초기화를 필요로 해
// jest 환경에서 로드하면 "Native part of Worklets doesn't seem to be initialized" 에러가 발생한다.
// 이 stub 은 BottomSheet 테스트(children 렌더·백드롭 탭)에 필요한 API 만 제공한다.
// 실제 animation·gesture·keyboard 동작은 device 테스트(Task 13)에서 검증한다.
const React = require("react");
const { View, Text, Image } = require("react-native");

const NOOP = () => {};
const ID = (t) => t;

const makeSharedValue = (init) => {
  const holder = { value: init };
  return new Proxy(holder, {
    get(target, prop) {
      if (prop === "value") return target.value;
      if (prop === "get") return () => target.value;
      if (prop === "set")
        return (v) => {
          target.value = v;
        };
      if (prop === "addListener") return NOOP;
      if (prop === "removeListener") return NOOP;
      if (prop === "modify") return NOOP;
    },
    set(target, prop, v) {
      if (prop === "value") {
        target.value = v;
        return true;
      }
      return false;
    },
  });
};

// withTiming mock: withTiming(toValue, config, callback) — 콜백을 동기 실행해
// runOnJS(onClose)() 가 테스트 내에서 즉시 호출되도록 한다.
const withTiming = (toValue, _config, callback) => {
  if (callback) callback(true);
  return toValue;
};

const withSpring = (toValue, _config, callback) => {
  if (callback) callback(true);
  return toValue;
};

// runOnJS mock: identity 함수로, runOnJS(fn)() === fn()
const runOnJS = ID;
const runOnUI = ID;

// useSharedValue 는 makeSharedValue 로 반환
const useSharedValue = makeSharedValue;

// useAnimatedStyle 은 worklet 을 즉시 실행해 스타일 객체를 반환
const useAnimatedStyle = (worklet) => {
  try {
    return worklet();
  } catch {
    return {};
  }
};

// Animated.View 등은 기본 RN View 로 대체
const AnimatedView = React.forwardRef((props, ref) =>
  React.createElement(View, { ...props, ref }),
);
AnimatedView.displayName = "Animated.View";

const AnimatedText = React.forwardRef((props, ref) =>
  React.createElement(Text, { ...props, ref }),
);
AnimatedText.displayName = "Animated.Text";

const Animated = {
  View: AnimatedView,
  Text: AnimatedText,
  Image,
  createAnimatedComponent: ID,
};

const interpolate = NOOP;
const interpolateColor = NOOP;

module.exports = {
  __esModule: true,
  default: Animated,
  // hooks
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue: (fn) => makeSharedValue(fn()),
  useAnimatedRef: () => ({ current: null }),
  useAnimatedScrollHandler: () => NOOP,
  useAnimatedProps: (fn) => {
    try {
      return fn();
    } catch {
      return {};
    }
  },
  useAnimatedReaction: NOOP,
  // gesture-handler 의 reanimatedWrapper 가 require 후 useEvent 존재 여부를 확인한다.
  useEvent: () => NOOP,
  useHandler: () => ({
    context: {},
    doDependenciesDiffer: false,
    shouldUseWorklet: false,
  }),
  setGestureState: NOOP,
  // animation
  withTiming,
  withSpring,
  withDelay: (_delay, animation) => animation,
  withSequence: (...animations) => animations[animations.length - 1],
  withRepeat: (animation) => animation,
  cancelAnimation: NOOP,
  // worklet helpers
  runOnJS,
  runOnUI,
  // interpolation
  interpolate,
  interpolateColor,
  Extrapolation: { CLAMP: "clamp", EXTEND: "extend", IDENTITY: "identity" },
  Extrapolate: { CLAMP: "clamp", EXTEND: "extend", IDENTITY: "identity" },
  // Easing
  Easing: {
    linear: ID,
    ease: ID,
    quad: ID,
    cubic: ID,
    bezier: () => ID,
    bezierFn: () => ID,
    in: ID,
    out: ID,
    inOut: ID,
    back: () => ID,
    bounce: ID,
    elastic: () => ID,
    circle: ID,
    sin: ID,
    exp: ID,
    poly: () => ID,
    step0: ID,
    step1: ID,
  },
  // misc
  enableLayoutAnimations: NOOP,
  makeMutable: makeSharedValue,
  createWorkletRuntime: NOOP,
  runOnRuntime: NOOP,
  isReanimated3: () => false,
};
