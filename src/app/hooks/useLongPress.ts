import { useRef, type MouseEvent } from "react";

interface LongPressOptions {
  delay?: number;
  onLongPress: () => void;
}

export function useLongPress({ delay = 450, onLongPress }: LongPressOptions) {
  const timerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const start = () => {
    clearTimer();
    longPressTriggeredRef.current = false;
    timerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      onLongPress();
    }, delay);
  };

  const cancel = () => {
    clearTimer();
  };

  return {
    onPointerDown: start,
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    onContextMenu: (event: MouseEvent) => {
      event.preventDefault();
      onLongPress();
    },
    didLongPress: () => longPressTriggeredRef.current,
  };
}
