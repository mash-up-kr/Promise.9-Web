// 시안 FolderSheet 주석: enter/exit spring 420/40. overshootClamping 은 목표 지점을 지나쳐 되튕기는 동작을 없앤다.
// mass 4 는 인앱 시트(gorhom → Reanimated withSpring)의 기본값이다 — RN Animated 기본값(1)이면
// 같은 420/40 이 거의 임계 감쇠라 목표까지 ~654ms 걸린다(mass 4 는 ~233ms 로 인앱과 같다).
export const SHEET_SPRING = {
  stiffness: 420,
  damping: 40,
  mass: 4,
  overshootClamping: true,
} as const;

export const SHEET_BACKDROP_OPACITY = 0.6;
