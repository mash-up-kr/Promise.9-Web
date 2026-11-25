import { AsyncBoundary } from "@promise9/ui/async-boundary/AsyncBoundary";
import { InlineNotice } from "@promise9/ui/inline-notice/InlineNotice";
import { ListGroup } from "@promise9/ui/list-group/ListGroup";
import { ListRow } from "@promise9/ui/list-row/ListRow";
import { ListSection } from "@promise9/ui/list-section/ListSection";
import { Skeleton } from "@promise9/ui/skeleton/Skeleton";
import { Text } from "@promise9/ui/text/Text";
import { NetworkError } from "@shared/api";
import {
  type NotificationSettings,
  notificationSettingsQueries,
  useUpdateNotificationSettingsMutation,
} from "@shared/entities/user/user.notification.queries";
import {
  useQueryClient,
  useSuspenseQueries,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { BellOff } from "lucide-react-native";
import {
  type PropsWithChildren,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { View } from "react-native";
import { usePreservedCallback } from "react-simplikit";
import {
  AlertDialog,
  AlertDialogButton,
} from "@/components/ui/alert-dialog/AlertDialog";
import { useSnackbar } from "@/components/ui/snackbar/SnackbarProvider";
import { snackbarPresets } from "@/components/ui/snackbar/snackbar.presets";
import { isWeb } from "@/constants/platform.constants";
import { ROUTES } from "@/constants/routes.constants";
import {
  notificationQueries,
  openNotificationSettings,
  requestNotificationPermission,
} from "@/lib/notifications";

import { useRefocusEffect } from "../hooks/useRefocusEffect";

const APP_CAPTION = "리마인드를 설정한 시간에 알림을 보내드려요.";
const WEB_CAPTION =
  "웹에서는 이메일로 알려드려요. 앱에서는 푸시 알림도 받을 수 있어요.";
const PUSH_LABEL = "앱 푸시 알림";
const EMAIL_LABEL = "이메일 알림";
const SAVE_FAILED = "설정을 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.";

export function NotificationSection() {
  return (
    <ListSection title="알림">
      <AsyncBoundary
        pending={
          <NotificationPlaceholder
            trailing={
              <Skeleton
                surface="list"
                variant="circular"
                className="h-6 w-11"
              />
            }
          />
        }
        fallback={({ reset }) => (
          <NotificationPlaceholder
            trailing={
              <Text variant="body-2-normal" className="text-text-alternative">
                -
              </Text>
            }
            onRefocus={reset}
          />
        )}
      >
        {isWeb ? <WebNotificationSettings /> : <AppNotificationSettings />}
      </AsyncBoundary>
    </ListSection>
  );
}

function AppNotificationSettings() {
  const queryClient = useQueryClient();
  const [{ data: permission }, { data: settings }] = useSuspenseQueries({
    queries: [
      notificationQueries.permission(),
      notificationSettingsQueries.detail(),
    ],
  });
  const { save, isSaving } = useSaveNotificationSettings();
  const { show } = useSnackbar();
  const [isDeniedAlertOpen, setDeniedAlertOpen] = useState(false);
  const isAwaitingGrant = useRef(false);

  useRefocusEffect(async () => {
    const permissionKey = notificationQueries.permission().queryKey;
    await Promise.all(
      [permissionKey, notificationSettingsQueries.detail().queryKey].map(
        (queryKey) =>
          queryClient.refetchQueries({ queryKey }, { cancelRefetch: false }),
      ),
    );
    // 허용하지 않고 돌아왔으면 기다리지 않는다 — 나중에 다른 경로로 허용돼도 뒤늦게 켜지 않게.
    if (queryClient.getQueryData(permissionKey) !== "granted") {
      isAwaitingGrant.current = false;
    }
  });

  const handleGranted = usePreservedCallback(() => {
    if (!isAwaitingGrant.current) return;
    isAwaitingGrant.current = false;
    const notify = () => show(snackbarPresets.success("앱 푸시 알림을 켰어요"));
    if (settings.push) notify();
    else save({ push: true }, notify);
  });
  // 다른 저장이 끝난 뒤에 켜야 무시되지 않는다.
  useEffect(() => {
    if (permission === "granted" && !isSaving) handleGranted();
  }, [permission, isSaving, handleGranted]);

  const openSettingsForGrant = () => {
    isAwaitingGrant.current = true;
    setDeniedAlertOpen(false);
    openDeviceSettings();
  };

  const changePush = async (isOn: boolean) => {
    if (isSaving) return;
    if (!isOn) return save({ push: false });
    if (permission === "denied") return setDeniedAlertOpen(true);
    let isGranted = permission === "granted";
    if (!isGranted) {
      try {
        isGranted = (await requestNotificationPermission()) === "granted";
      } catch (error) {
        console.error("[notifications] 알림 권한 요청 실패", error);
        show(snackbarPresets.failed(SAVE_FAILED));
        return;
      }
    }
    if (isGranted && !settings.push) save({ push: true });
  };

  const isPushOn = permission === "granted" && settings.push;
  return (
    <>
      {permission === "denied" && settings.push && (
        <InlineNotice
          icon={BellOff}
          message="기기 알림이 꺼져 있어 앱 푸시를 받을 수 없어요."
          action={{ label: "설정 열기", onPress: openSettingsForGrant }}
        />
      )}
      <NotificationGroup
        caption={APP_CAPTION}
        isAllOff={!isPushOn && !settings.email}
      >
        <ListRow
          label={PUSH_LABEL}
          toggle={{ value: isPushOn, onChange: changePush }}
        />
        <ListRow
          label={EMAIL_LABEL}
          toggle={{
            value: settings.email,
            onChange: (email) => save({ email }),
          }}
        />
        <DeviceSettingsRow />
      </NotificationGroup>
      <DeniedAlert
        isOpen={isDeniedAlertOpen}
        onClose={() => setDeniedAlertOpen(false)}
        onOpenSettings={openSettingsForGrant}
      />
    </>
  );
}

function WebNotificationSettings() {
  const queryClient = useQueryClient();
  const { data: settings } = useSuspenseQuery(
    notificationSettingsQueries.detail(),
  );
  const { save } = useSaveNotificationSettings();

  useRefocusEffect(() => {
    queryClient.refetchQueries(
      { queryKey: notificationSettingsQueries.detail().queryKey },
      { cancelRefetch: false },
    );
  });

  return (
    <NotificationGroup caption={WEB_CAPTION} isAllOff={!settings.email}>
      <ListRow
        label={EMAIL_LABEL}
        toggle={{ value: settings.email, onChange: (email) => save({ email }) }}
      />
      <AppInstallRow />
    </NotificationGroup>
  );
}

function useSaveNotificationSettings() {
  const { mutate, isPending } = useUpdateNotificationSettingsMutation();
  const { show } = useSnackbar();

  const save = (
    change: Partial<NotificationSettings>,
    onSaved?: () => void,
  ) => {
    if (isPending) return;
    mutate(change, {
      onSuccess: onSaved,
      onError: (error) =>
        show(
          error instanceof NetworkError
            ? snackbarPresets.offline("인터넷 연결을 확인해 주세요.")
            : snackbarPresets.failed(SAVE_FAILED),
        ),
    });
  };
  return { save, isSaving: isPending };
}

interface NotificationPlaceholderProps {
  trailing: ReactNode;
  onRefocus?: () => void;
}

function NotificationPlaceholder({
  trailing,
  onRefocus = () => {},
}: NotificationPlaceholderProps) {
  useRefocusEffect(onRefocus);
  const labels = isWeb ? [EMAIL_LABEL] : [PUSH_LABEL, EMAIL_LABEL];
  return (
    <NotificationGroup caption={isWeb ? WEB_CAPTION : APP_CAPTION}>
      {labels.map((label) => (
        <ListRow key={label} label={label} trailing={trailing} />
      ))}
      {isWeb ? <AppInstallRow /> : <DeviceSettingsRow />}
    </NotificationGroup>
  );
}

function openDeviceSettings() {
  openNotificationSettings().catch((error) => {
    console.error("[notifications] 기기 알림 설정을 열지 못함", error);
  });
}

function DeviceSettingsRow() {
  return (
    <ListRow label="기기 알림 설정" chevron onPress={openDeviceSettings} />
  );
}

function AppInstallRow() {
  const router = useRouter();
  return (
    <ListRow
      label="앱 설치하고 푸시 알림 받기"
      chevron
      onPress={() => router.push(ROUTES.APP_INSTALL)}
    />
  );
}

interface DeniedAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

function DeniedAlert({ isOpen, onClose, onOpenSettings }: DeniedAlertProps) {
  return (
    <AlertDialog
      isOpen={isOpen}
      onClose={onClose}
      title="기기 알림이 꺼져 있어요"
      description={"앱 푸시를 받으려면\n기기 설정에서 알림을 허용해 주세요."}
      actions={
        <>
          <AlertDialogButton
            label="취소"
            variant="secondary"
            onPress={onClose}
          />
          <AlertDialogButton
            label="설정 열기"
            variant="primary"
            onPress={onOpenSettings}
          />
        </>
      }
    />
  );
}

interface NotificationGroupProps extends PropsWithChildren {
  caption: string;
  isAllOff?: boolean;
}

function NotificationGroup({
  caption,
  isAllOff = false,
  children,
}: NotificationGroupProps) {
  return (
    <View className="gap-2">
      <ListGroup>{children}</ListGroup>
      {isAllOff ? (
        <Text variant="body-3" className="px-1 text-text-normal">
          알림이 모두 꺼져 있어서 리마인드를 알려드릴 수 없어요.
        </Text>
      ) : (
        // 시안 Caption-1-regular 는 자간 0 — caption-1 토큰(0.03em)과 자간만 다르다.
        <Text
          variant="caption-1"
          className="px-1 text-text-alternative tracking-[0px]"
        >
          {caption}
        </Text>
      )}
    </View>
  );
}
