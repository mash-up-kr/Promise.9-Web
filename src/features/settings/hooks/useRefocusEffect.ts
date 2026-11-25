import { focusManager } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { usePreservedCallback } from "react-simplikit";

/** 탭 화면은 떠나도 마운트돼 있어, 다시 들어오거나 앱으로 돌아올 때를 따로 알린다. */
export function useRefocusEffect(onRefocus: () => void): void {
  const callback = usePreservedCallback(onRefocus);
  const isFirstFocus = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      callback();
    }, [callback]),
  );

  useEffect(
    () =>
      focusManager.subscribe((isFocused) => {
        if (isFocused) callback();
      }),
    [callback],
  );
}
