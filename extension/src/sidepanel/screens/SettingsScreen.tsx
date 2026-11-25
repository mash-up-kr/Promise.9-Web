import { AppInstallQr } from "@promise9/ui/app-install/AppInstallQr";
import { ListGroup } from "@promise9/ui/list-group/ListGroup";
import { ListRow } from "@promise9/ui/list-row/ListRow";
import { ListSection } from "@promise9/ui/list-section/ListSection";
import { SheetHandle, SheetSurface } from "@promise9/ui/sheet/SheetChrome";
import { ChevronLeft } from "lucide-react-native";
import { useEffect, useId, useRef, useState } from "react";

import { IconButton } from "@/sidepanel/components/IconButton";

export interface SettingsScreenProps {
  onBack: () => void;
}

/** 시안 `setting / web / main` 의 알림 섹션. 이메일 알림 스위치는 서버 수신 설정 API(Server#151) 이후. */
export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [isAppInstallOpen, setIsAppInstallOpen] = useState(false);

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
              <ListRow
                label="앱 설치하고 푸시 알림 받기"
                chevron
                onPress={() => setIsAppInstallOpen(true)}
              />
            </ListGroup>
            {/* 시안 Caption-1-regular 는 자간 0 — caption-1 토큰(0.03em)과 자간만 다르다. */}
            <p className="px-1 text-caption-1 text-text-alternative tracking-[0px]">
              웹에서는 이메일로 알려드려요. 앱에서는 푸시 알림도 받을 수 있어요.
            </p>
          </div>
        </ListSection>
      </div>

      {isAppInstallOpen ? (
        <AppInstallSheet onClose={() => setIsAppInstallOpen(false)} />
      ) : null}
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
