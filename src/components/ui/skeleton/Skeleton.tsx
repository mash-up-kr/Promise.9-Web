import type { ReactNode } from "react";
import { View, type ViewProps } from "react-native";

import { tv } from "@/lib/tv";

// gluestack-ui v5 Skeleton 을 차용해 우리 tv + 토큰으로 작성. pulse 는 animate-pulse.
export const skeletonStyles = tv({
  base: "animate-pulse rounded-md bg-background-thumbnail",
  variants: {
    variant: {
      sharp: "rounded-none",
      circular: "rounded-full",
      rounded: "rounded-md",
    },
  },
});

const skeletonTextStyles = tv({
  base: "gap-2",
  variants: {
    gap: {
      1: "gap-1",
      2: "gap-2",
      3: "gap-3",
      4: "gap-4",
    },
  },
});

export interface SkeletonProps extends Omit<ViewProps, "className"> {
  className?: string;
  variant?: "sharp" | "circular" | "rounded";
  isLoaded?: boolean;
  children?: ReactNode;
}

export function Skeleton({
  className,
  variant,
  isLoaded = false,
  children,
  ...props
}: SkeletonProps) {
  if (isLoaded) {
    return children;
  }

  return (
    <View
      className={skeletonStyles({ variant, class: className })}
      {...props}
    />
  );
}

export interface SkeletonTextProps extends Omit<ViewProps, "className"> {
  className?: string;
  lines?: number;
  gap?: 1 | 2 | 3 | 4;
  isLoaded?: boolean;
  children?: ReactNode;
}

export function SkeletonText({
  className,
  lines = 1,
  gap = 2,
  isLoaded = false,
  children,
  ...props
}: SkeletonTextProps) {
  if (isLoaded) {
    return children;
  }

  const lineClassName = className ? `h-4 ${className}` : "h-4";

  if (lines <= 1) {
    return <Skeleton className={lineClassName} {...props} />;
  }

  return (
    <View className={skeletonTextStyles({ gap })}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          // 정적 목록이라 index 키가 안전하다.
          key={index}
          className={lineClassName}
          {...props}
        />
      ))}
    </View>
  );
}
