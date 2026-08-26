import { useQuery } from "@tanstack/react-query";
import { Link } from "lucide-react-native";
import { type ReactNode, useEffect, useState } from "react";
import { Image, View } from "react-native";
import { Icon } from "@/components/ui/icon/Icon";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { Text } from "@/components/ui/text/Text";
import { linkQueries } from "@/entities/link/link.queries";
import { getDomain } from "@/features/link/link.utils";

const FALLBACK_TITLE = "제목을 불러오지 못했어요";
// 스켈레톤 최대 노출 시간(시안 정책) — 이후엔 도메인 폴백으로 전환한다.
const TIMEOUT_MS = 5000;

export interface LinkPreviewCardProps {
  url: string;
}

// 5초 타임아웃이 pending 상태를 직접 다뤄야 해 Suspense(useSuspenseQuery) 대신
// 명시적 상태 머신(useQuery)을 쓴다 — 프로젝트 기본은 Suspense 지만 이 카드만 예외.
export function LinkPreviewCard({ url }: LinkPreviewCardProps) {
  const { data, isPending, isError, fetchStatus } = useQuery({
    ...linkQueries.preview(url),
    enabled: url.length > 0,
    refetchOnReconnect: "always", // 네트워크 복구 시 자동 재로딩(시안 정책)
    retry: false,
  });
  const [isTimedOut, setIsTimedOut] = useState(false);

  useEffect(() => {
    setIsTimedOut(false);
    if (url.length === 0) return;
    const timer = setTimeout(() => setIsTimedOut(true), TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [url]);

  if (url.length === 0) {
    return null;
  }

  const domain = getDomain(url);
  // 오프라인이면 networkMode 기본값('online')에 의해 fetch 가 paused 된다 —
  // 시안 정책: 이 경우 스켈레톤 없이 즉시 폴백(복구 시 refetchOnReconnect 가 다시 채운다).
  const isPaused = fetchStatus === "paused";

  if (isPending && !isTimedOut && !isPaused) {
    return <PreviewSkeleton />;
  }

  if ((isPending && (isTimedOut || isPaused)) || isError || !data) {
    return <PreviewFallback title={domain ?? FALLBACK_TITLE} />;
  }

  return (
    <PreviewShell>
      <ThumbnailSlot thumbnailUrl={data.thumbnailUrl} />
      <PreviewTitle title={data.title ?? domain ?? FALLBACK_TITLE} />
    </PreviewShell>
  );
}

function PreviewFallback({ title }: { title: string }) {
  return (
    <PreviewShell>
      <PlaceholderIcon />
      <PreviewTitle title={title} />
    </PreviewShell>
  );
}

function PreviewSkeleton() {
  return (
    <PreviewShell>
      <Skeleton testID="link-preview-skeleton" className="size-16 rounded-xl" />
      <View className="flex-1 gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </View>
    </PreviewShell>
  );
}

function PreviewShell({ children }: { children: ReactNode }) {
  return (
    <View
      testID="link-preview-card"
      className="w-full flex-row items-center gap-3 rounded-2xl bg-opacity-white-10 p-3"
    >
      {children}
    </View>
  );
}

function PreviewTitle({ title }: { title: string }) {
  return (
    <View className="flex-1">
      <Text
        variant="body-2-normal"
        numberOfLines={2}
        className="text-text-strong"
      >
        {title}
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
