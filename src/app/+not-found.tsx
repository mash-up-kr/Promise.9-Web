import { Redirect } from "expo-router";

// 정의되지 않은(허용되지 않은) 경로로 접근하면 홈으로 돌려보낸다.
export default function NotFound() {
  return <Redirect href="/" />;
}
