import { AppInstallQr } from "@promise9/ui/app-install/AppInstallQr";
import { FrownIcon } from "@promise9/ui/icon/FrownIcon";
import { Icon } from "@promise9/ui/icon/Icon";
import { WifiOffIcon } from "@promise9/ui/icon/WifiOffIcon";
import { ListGroup } from "@promise9/ui/list-group/ListGroup";
import { ListRow } from "@promise9/ui/list-row/ListRow";
import { ListSection } from "@promise9/ui/list-section/ListSection";
import { SheetHandle, SheetSurface } from "@promise9/ui/sheet/SheetChrome";
import { NetworkError } from "@shared/api";
import {
  notificationSettingsQueries,
  useUpdateNotificationSettingsMutation,
} from "@shared/entities/user/user.notification.queries";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { ChevronLeft, CircleAlert } from "lucide-react-native";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { AsyncBoundary } from "@/sidepanel/components/AsyncBoundary";
import { IconButton } from "@/sidepanel/components/IconButton";
import { Snackbar } from "@/sidepanel/components/Snackbar";

type SaveFailure = "offline" | "failed";

const SAVE_FAILURE_SNACKBAR = {
  offline: { icon: <WifiOffIcon />, message: "인터넷 연결을 확인해 주세요." },
  failed: {
    icon: <FrownIcon />,
    message: "설정을 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.",
  },
} satisfies Record<SaveFailure, { icon: ReactNode; message: string }>;

export interface SettingsScreenProps {
  onBack: () => void;
}

/** 시안 `setting / web / main` 의 알림 섹션. */
export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [isAppInstallOpen, setIsAppInstallOpen] = useState(false);
  // 같은 실패가 다시 나도 2.5초를 새로 세도록 매번 새 key 로 띄운다.
  const [saveFailure, setSaveFailure] = useState<{
    id: number;
    kind: SaveFailure;
  } | null>(null);
  const dismissSnackbar = useCallback(() => setSaveFailure(null), []);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <header className="flex h-15 shrink-0 items-center gap-4 px-5 py-2.5">
        <IconButton iconNode={ChevronLeft} label="뒤로 가기" onClick={onBack} />
        <h1 className="text-text-strong text-title">설정</h1>
      </header>

      <div className="pt-5 pb-6">
        <ListSection title="알림">
          <div className="flex flex-col gap-2">
            <ListGroup>
              <AsyncBoundary
                pending={<EmailRowPending />}
                rejected={(retry) => <EmailRowRejected onRetry={retry} />}
              >
                <EmailRow
                  onSaveFailure={(kind) =>
                    setSaveFailure({ id: Date.now(), kind })
                  }
                />
              </AsyncBoundary>
              <ListRow
                label="앱 설치하고 푸시 알림 받기"
                chevron
                onPress={() => setIsAppInstallOpen(true)}
              />
            </ListGroup>
            <NotificationCaption />
          </div>
        </ListSection>
      </div>

      {isAppInstallOpen ? (
        <AppInstallSheet onClose={() => setIsAppInstallOpen(false)} />
      ) : null}
      {saveFailure ? (
        <Snackbar
          key={saveFailure.id}
          {...SAVE_FAILURE_SNACKBAR[saveFailure.kind]}
          onDismiss={dismissSnackbar}
        />
      ) : null}
    </div>
  );
}

/** 누르는 즉시 반영하고, 실패하면 되돌린다(뮤테이션). 저장 중에 다시 누른 것은 무시한다. */
function EmailRow({
  onSaveFailure,
}: {
  onSaveFailure: (kind: SaveFailure) => void;
}) {
  const { data } = useSuspenseQuery(notificationSettingsQueries.detail());
  const { mutate, isPending } = useUpdateNotificationSettingsMutation();

  return (
    <ListRow
      label="이메일 알림"
      toggle={{
        value: data.email,
        onChange: (email) => {
          if (isPending) return;
          mutate(
            { email },
            {
              onError: (error) =>
                onSaveFailure(
                  error instanceof NetworkError ? "offline" : "failed",
                ),
            },
          );
        },
      }}
    />
  );
}

/** 이메일 행과 같은 캐시를 본다. 불러오는 중·실패면 기본 안내를 둔다. */
function NotificationCaption() {
  const { data } = useQuery(notificationSettingsQueries.detail());

  return data?.email === false ? <AllOffCaption /> : <ChannelCaption />;
}

function ChannelCaption() {
  return (
    // 시안 Caption-1-regular 는 자간 0 — caption-1 토큰(0.03em)과 자간만 다르다.
    <p className="px-1 text-caption-1 text-text-alternative tracking-[0px]">
      웹에서는 이메일로 알려드려요. 앱에서는 푸시 알림도 받을 수 있어요.
    </p>
  );
}

/** 시안 `setting / notification / all-off` — 웹·익스텐션은 이메일이 꺼지면 모두 꺼진 것이다. */
function AllOffCaption() {
  return (
    <p className="flex items-center gap-1.5 px-1 text-body-3 text-text-normal">
      <Icon iconNode={CircleAlert} size={14} className="text-icon-normal" />
      알림이 모두 꺼져 있어서 리마인드를 알려드릴 수 없어요.
    </p>
  );
}

function EmailRowPending() {
  return <div className="h-[52px] animate-pulse bg-background-list" />;
}

function EmailRowRejected({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex h-[52px] items-center justify-between gap-3 bg-background-list px-4">
      <p className="text-body-3 text-text-alternative">
        알림 설정을 불러오지 못했어요.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="shrink-0 rounded-full bg-background-list-selected px-3 py-1.5 text-body-3 text-text-normal"
      >
        다시 시도
      </button>
    </div>
  );
}

/** 시안 `setting / web / app-install-extension` — Bottom Sheet + Content/App Install(Desktop). */
function AppInstallSheet({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opener = document.activeElement;
    dialogRef.current?.focus();
    return () => {
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 flex flex-col justify-end"
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
        // 시트 안에 탭 가능한 요소가 없어 Tab 을 막고 시트에 머문다 — 버튼 등이 생기면 순환 트랩으로.
        if (event.key === "Tab") {
          event.preventDefault();
          dialogRef.current?.focus();
        }
      }}
    >
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-opacity-black-60"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative outline-none"
      >
        <SheetSurface>
          <SheetHandle />
          <div className="flex flex-col gap-6 pb-14">
            <div className="flex h-15 flex-col items-center justify-center gap-0.5 px-5 text-center">
              <h2 id={titleId} className="text-heading-2 text-text-strong">
                앱에서 푸시 알림을 받아보세요!
              </h2>
              <p className="text-caption-1 text-text-alternative tracking-[0px]">
                리마인드를 앱 알림으로 받을 수 있어요.
              </p>
            </div>
            <div className="px-5">
              <AppInstallQr />
            </div>
          </div>
        </SheetSurface>
      </div>
    </div>
  );
}
