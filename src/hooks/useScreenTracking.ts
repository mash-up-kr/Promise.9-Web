import type { AnalyticsClient } from "@shared/analytics/analytics.client";
import {
  createScreenTracking,
  type ScreenTracking,
} from "@shared/analytics/analytics.screen";
import { useMemo, useState } from "react";

export function useScreenTracking(
  client: AnalyticsClient | null,
  newId: (() => string) | null,
): ScreenTracking | null {
  const [, setVisitId] = useState<string | null>(null);
  return useMemo(
    () =>
      client && newId ? createScreenTracking(client, newId, setVisitId) : null,
    [client, newId],
  );
}
