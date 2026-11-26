import { apiClient, type SuccessResponse } from "@shared/api";
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { z } from "zod";

/** 리마인드 알림 채널별 수신 설정. 서버는 설정한 적 없는 채널을 true 로 준다. */
export const notificationSettingsSchema = z.looseObject({
  email: z.boolean(),
  push: z.boolean(),
});

export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;

export const notificationSettingsKeys = {
  detail: () => ["user", "notification-settings"] as const,
};

const PATH = "/users/me/notification-settings";

export const notificationSettingsQueries = {
  keys: notificationSettingsKeys,
  detail: () =>
    queryOptions({
      queryKey: notificationSettingsKeys.detail(),
      queryFn: async ({ signal }) => {
        const { data } = await apiClient.get<SuccessResponse<unknown>>(PATH, {
          signal,
        });

        return notificationSettingsSchema.parse(data.data);
      },
    }),
};

/**
 * PATCH — 보낸 채널만 바뀐다. 누르는 즉시 보이도록 캐시에 먼저 반영하고,
 * 실패하면 이전 값으로 되돌린다. 성공하면 서버가 준 전체 값으로 맞춘다.
 */
export function useUpdateNotificationSettingsMutation() {
  const queryClient = useQueryClient();
  const queryKey = notificationSettingsKeys.detail();

  return useMutation({
    mutationFn: async (change: Partial<NotificationSettings>) => {
      const { data } = await apiClient.patch<SuccessResponse<unknown>>(
        PATH,
        change,
      );

      return notificationSettingsSchema.parse(data.data);
    },
    // 오프라인이면 멈춰 기다리지 않고 바로 실패해 토글을 되돌린다.
    networkMode: "always",
    onMutate: async (change) => {
      // 진행 중인 조회가 끝나며 낙관적 값을 덮어쓰지 않게 한다.
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<NotificationSettings>(queryKey);
      if (previous)
        queryClient.setQueryData(queryKey, { ...previous, ...change });

      return { previous };
    },
    onError: (_error, _change, context) => {
      if (context?.previous)
        queryClient.setQueryData(queryKey, context.previous);
    },
    onSuccess: (settings) => queryClient.setQueryData(queryKey, settings),
  });
}
