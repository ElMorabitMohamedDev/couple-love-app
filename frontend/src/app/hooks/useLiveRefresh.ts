import { useEffect } from "react";

interface LiveRefreshOptions {
  enabled?: boolean;
  intervalMs?: number;
}

export function useLiveRefresh(
  refresh: () => void | Promise<void>,
  { enabled = true, intervalMs = 15000 }: LiveRefreshOptions = {}
) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const runRefresh = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      void refresh();
    };

    const intervalId = window.setInterval(runRefresh, intervalMs);
    const handleVisibility = () => runRefresh();
    const handleFocus = () => runRefresh();
    const handleOnline = () => runRefresh();

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleOnline);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleOnline);
    };
  }, [enabled, intervalMs, refresh]);
}
