import { apiClient, type SuccessResponse } from "@shared/api";
import {
  type MarketingTouch,
  type UserAttribution,
  userAttributionSchema,
} from "./user.attribution";
export async function fetchUserAttribution(
  signal: AbortSignal,
): Promise<UserAttribution> {
  const { data } = await apiClient.get<SuccessResponse<unknown>>(
    "/users/me/attribution",
    { signal },
  );
  return userAttributionSchema.parse(data.data);
}

export async function saveMarketingTouch(
  touch: MarketingTouch,
  signal: AbortSignal,
): Promise<UserAttribution> {
  const { data } = await apiClient.patch<SuccessResponse<unknown>>(
    "/users/me/attribution",
    touch,
    { signal },
  );
  return userAttributionSchema.parse(data.data);
}
