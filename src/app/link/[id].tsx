import { Redirect } from "expo-router";
import { Suspense } from "react";
import { View } from "react-native";

import { ErrorBoundary } from "@/components/ui/error-boundary/ErrorBoundary";
import { LinkDetailScreen } from "@/features/link/LinkDetailScreen";

const LoadingFallback = () => <View className="flex-1 bg-background-base" />;
// 존재하지 않는 링크 등 접근할 수 없는 상태면 홈으로 돌려보낸다.
const ErrorFallback = () => <Redirect href="/" />;

export default function Route() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <Suspense fallback={<LoadingFallback />}>
        <LinkDetailScreen />
      </Suspense>
    </ErrorBoundary>
  );
}
