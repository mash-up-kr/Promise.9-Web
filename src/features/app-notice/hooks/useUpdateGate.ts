import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { APP_VERSION } from "@/constants/app.constants";
import { isIOS } from "@/constants/platform.constants";

import { appNoticeQueries } from "../api/appNotice.queries";
import { getSnoozedUpdateVersion, snoozeUpdateVersion } from "../noticeStorage";
import { resolveUpdateKind, type UpdateKind } from "../version.utils";

export interface UpdateGate {
  /** 띄울 안내. `none` 이면 아무것도 띄우지 않는다. */
  kind: UpdateKind;
  /** 스토어에 올라가 있는 최신 버전 — 안내 문구에 쓴다. 기준을 못 읽었으면 null. */
  latestVersion: string | null;
  /** 판단이 끝났는지(기준 조회·건너뛴 기록 확인 완료). 끝나기 전엔 kind 가 none 이다. */
  isReady: boolean;
  /** 권유 안내의 "나중에" — 그 버전 동안 다시 띄우지 않는다. 필수 안내에는 효과가 없다. */
  dismiss: () => void;
}

/**
 * 설치 버전과 원격 기준을 맞춰 어떤 업데이트 안내를 띄울지 정한다.
 *
 * 기준을 못 읽었을 때(오프라인·파일 오류)는 `none` 이다 — 안내를 띄우려다 앱을 막는 일이 없어야 한다.
 */
export function useUpdateGate(): UpdateGate {
  const { data, isFetched } = useQuery(appNoticeQueries.release());
  // undefined = 아직 읽지 못함. 읽기 전에 판단하면 이미 건너뛴 안내가 한 프레임 보인다.
  const [snoozedVersion, setSnoozedVersion] = useState<string | null>();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(function loadSnoozedVersion() {
    let isCancelled = false;
    getSnoozedUpdateVersion().then((version) => {
      if (!isCancelled) {
        setSnoozedVersion(version);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, []);

  const release = data ? (isIOS ? data.ios : data.android) : null;
  const isReady = isFetched && snoozedVersion !== undefined;

  if (!isReady || !release) {
    return { kind: "none", latestVersion: null, isReady, dismiss: noop };
  }

  const { latestVersion } = release;
  const kind = resolveUpdateKind({
    currentVersion: APP_VERSION,
    latestVersion,
    minSupportedVersion: release.minSupportedVersion,
  });

  const dismiss = () => {
    setIsDismissed(true);
    snoozeUpdateVersion(latestVersion);
  };

  // 필수 안내는 건너뛸 수 없다 — 기록도 남기지 않는다.
  if (kind === "force") {
    return { kind, latestVersion, isReady, dismiss: noop };
  }

  const isSnoozed = isDismissed || snoozedVersion === latestVersion;
  return {
    kind: isSnoozed ? "none" : kind,
    latestVersion,
    isReady,
    dismiss,
  };
}

function noop() {}
