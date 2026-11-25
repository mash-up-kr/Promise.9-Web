import {
  type MarketingTouch,
  marketingTouchSchema,
} from "@shared/entities/user/user.attribution.contracts";

const UTM_FIELDS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;
export function captureUtm(
  values: Record<string, unknown>,
  touchId: string,
  capturedAt: string,
): MarketingTouch | null {
  const utm = Object.fromEntries(
    UTM_FIELDS.map((key) => [
      key,
      typeof values[key] === "string" ? values[key].trim() || null : null,
    ]),
  );
  if (!Object.values(utm).some(Boolean)) return null;
  return marketingTouchSchema.parse({
    ...utm,
    touch_id: touchId,
    captured_at: capturedAt,
  });
}
