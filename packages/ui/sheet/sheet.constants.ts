// 시안 FolderSheet 주석: enter/exit spring 420/40. overshootClamping 은 목표 지점을 지나쳐 되튕기는 동작을 없앤다.
// mass 4 는 인앱 시트(gorhom → Reanimated withSpring)의 기본값이다 — RN Animated 의 기본값은 1 이라
// 명시하지 않으면 iOS 공유 시트만 두 배 빠르게 움직인다.
export const SHEET_SPRING = {
  stiffness: 420,
  damping: 40,
  mass: 4,
  overshootClamping: true,
} as const;

export const SHEET_BACKDROP_OPACITY = 0.6;
