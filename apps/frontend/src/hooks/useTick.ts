import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTickMutation } from "./useTickMutation";

const ACTIVE_INTERVAL_MS = 1_000;
const INACTIVE_INTERVAL_MS = 10_000;
const STOP_AFTER_HIDDEN_MS = 5 * 60 * 1_000;

export function useTick(): { tickCount: number } {
  const queryClient = useQueryClient();
  const [tickCount, setTickCount] = useState(0);
  const { mutate } = useTickMutation(() => setTickCount((c) => c + 1));

  // Keep mutate in a ref so the effect closure never goes stale
  const mutateRef = useRef(mutate);
  useEffect(() => {
    mutateRef.current = mutate;
  });

  const hiddenAtRef = useRef<number | null>(null);
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function tick() {
      // If hidden for 5+ min, stop the interval
      if (
        hiddenAtRef.current !== null &&
        Date.now() - hiddenAtRef.current >= STOP_AFTER_HIDDEN_MS
      ) {
        if (intervalIdRef.current !== null) {
          clearInterval(intervalIdRef.current);
          intervalIdRef.current = null;
        }
        return;
      }
      mutateRef.current();
    }

    function startInterval(ms: number) {
      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current);
      }
      intervalIdRef.current = setInterval(tick, ms);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
        startInterval(INACTIVE_INTERVAL_MS);
      } else {
        const wasHiddenFor = hiddenAtRef.current !== null ? Date.now() - hiddenAtRef.current : 0;
        hiddenAtRef.current = null;
        if (wasHiddenFor >= STOP_AFTER_HIDDEN_MS) {
          queryClient.invalidateQueries({ queryKey: ["resort"] });
        }
        startInterval(ACTIVE_INTERVAL_MS);
      }
    }

    startInterval(ACTIVE_INTERVAL_MS);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [queryClient]);

  return { tickCount };
}
