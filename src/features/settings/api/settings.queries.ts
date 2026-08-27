import { apiClient, type SuccessResponse } from "@shared/api";
import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

// GET /users/me 응답. 설정 화면은 이메일만 쓰므로 email 만 검증하고 나머지는 통과시킨다
// (looseObject — 서버가 필드를 추가해도 깨지지 않는다).
export const userProfileSchema = z.looseObject({ email: z.string() });

export type UserProfile = z.infer<typeof userProfileSchema>;

const settingsKeys = {
  root: () => ["settings"] as const,
  profile: () => [...settingsKeys.root(), "profile"] as const,
};

export const settingsQueries = {
  keys: settingsKeys,
  // 내 프로필(이메일). 캐시에는 검증된 응답을 두고, 화면이 쓰는 email 만 select 로 뽑는다.
  profile: () =>
    queryOptions({
      queryKey: settingsKeys.profile(),
      queryFn: async ({ signal }) => {
        const { data } = await apiClient.get<SuccessResponse<unknown>>(
          "/users/me",
          { signal },
        );

        return userProfileSchema.parse(data.data);
      },
      select: (res) => res.email,
    }),
};
