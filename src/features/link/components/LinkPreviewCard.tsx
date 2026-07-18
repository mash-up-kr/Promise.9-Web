import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "lucide-react-native";
import { type ReactNode, Suspense } from "react";
import { Image, View } from "react-native";

import { ErrorBoundary } from "@/components/ui/error-boundary/ErrorBoundary";
import { Icon } from "@/components/ui/icon/Icon";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { Text } from "@/components/ui/text/Text";
import { linkQueries } from "@/features/link/api/link.queries";

const FAILED_TITLE = "링크 정보를 가져오지 못했어요.";
const FAILED_DESCRIPTION = "잠시 후에 다시 시도해 주세요.";

export interface LinkPreviewCardProps {
  url: string;
}

export function LinkPreviewCard({ url }: LinkPreviewCardProps) {
  if (url.length === 0) {
    return null;
  }

  return (
    <ErrorBoundary resetKeys={[url]} fallback={<PreviewFailed />}>
      <Suspense fallback={<PreviewSkeleton />}>
        <PreviewLoaded url={url} />
      </Suspense>
    </ErrorBoundary>
  );
}

function PreviewLoaded({ url }: { url: string }) {
  const { data } = useSuspenseQuery(linkQueries.preview(url));

  return (
    <PreviewShell>
      <ThumbnailSlot thumbnailUrl={data.thumbnailUrl} />
      <PreviewTexts
        title={data.title}
        subtitle={data.description ?? data.source}
      />
    </PreviewShell>
  );
}

function PreviewFailed() {
  return (
    <PreviewShell>
      <PlaceholderIcon />
      <PreviewTexts title={FAILED_TITLE} subtitle={FAILED_DESCRIPTION} />
    </PreviewShell>
  );
}

function PreviewSkeleton() {
  return (
    <PreviewShell>
      <Skeleton testID="link-preview-skeleton" className="size-16 rounded-xl" />
      <View className="flex-1 gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </View>
    </PreviewShell>
  );
}

function PreviewShell({ children }: { children: ReactNode }) {
  return (
    <View
      testID="link-preview-card"
      className="w-full flex-row items-center gap-3 rounded-2xl bg-background-input p-3"
    >
      {children}
    </View>
  );
}

function PreviewTexts({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View className="flex-1 gap-1">
      <Text
        variant="body-2-normal"
        numberOfLines={2}
        className="text-text-strong"
      >
        {title}
      </Text>
      <Text variant="body-4" numberOfLines={2} className="text-text-assistive">
        {subtitle}
      </Text>
    </View>
  );
}

function ThumbnailSlot({ thumbnailUrl }: { thumbnailUrl: string | null }) {
  if (thumbnailUrl) {
    return (
      <Image
        testID="link-preview-thumbnail"
        source={{ uri: thumbnailUrl }}
        resizeMode="cover"
        className="size-16 rounded-xl bg-background-thumbnail"
      />
    );
  }

  return <PlaceholderIcon />;
}

function PlaceholderIcon() {
  return (
    <View
      testID="link-preview-placeholder"
      className="size-16 items-center justify-center rounded-xl bg-background-thumbnail"
    >
      <Icon iconNode={Link} size={24} className="text-text-assistive" />
    </View>
  );
}
