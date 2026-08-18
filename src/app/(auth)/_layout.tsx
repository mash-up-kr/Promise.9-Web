import { Stack } from "expo-router";

// 인증 화면(로그인 등)은 헤더 없이 풀스크린으로 띄운다.
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
