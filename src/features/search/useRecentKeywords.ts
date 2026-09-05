import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

import { addRecentKeyword } from "./search.utils";

// 최근 검색어는 서버 정책 없이 기기 로컬에만 둔다(웹은 localStorage 백엔드).
const STORAGE_KEY = "search.recentKeywords";

function parseStoredKeywords(raw: string | null): string[] {
  if (raw == null) {
    return [];
  }
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed.filter((item): item is string => typeof item === "string");
}

/** 최근 검색어 목록 — 기기에 영속되며, 추가 규칙(중복 앞 이동·최대 개수)은 addRecentKeyword 를 따른다. */
export function useRecentKeywords() {
  const [keywords, setKeywords] = useState<string[]>([]);

  useEffect(function loadPersistedKeywords() {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!cancelled) {
          setKeywords(parseStoredKeywords(raw));
        }
      })
      .catch((error) => {
        // 손상된 값·저장소 오류는 빈 목록으로 시작하면 된다 — 화면을 막지 않는다.
        console.error("[search] 최근 검색어 로딩 실패", error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const addKeyword = (keyword: string) => {
    setKeywords((prev) => {
      const next = addRecentKeyword(prev, keyword);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(
        console.error,
      );
      return next;
    });
  };

  const clearKeywords = () => {
    setKeywords([]);
    AsyncStorage.removeItem(STORAGE_KEY).catch(console.error);
  };

  return { keywords, addKeyword, clearKeywords };
}
