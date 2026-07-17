import { Suspense } from "react";
import { View } from "react-native";

import { ErrorBoundary } from "@/components/ui/error-boundary/ErrorBoundary";
import { ArchiveScreen } from "@/features/archive/ArchiveScreen";

const Fallback = () => <View className="flex-1 bg-background-base" />;

export default function Route() {
  return (
    <ErrorBoundary fallback={<Fallback />}>
      <Suspense fallback={<Fallback />}>
        <ArchiveScreen />
      </Suspense>
    </ErrorBoundary>
  );
}
