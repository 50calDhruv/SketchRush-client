import { useSyncExternalStore } from "react";

// One shared 4 Hz clock for every countdown on screen, running only while something listens.
let now = Date.now();
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  if (listeners.size === 1) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      for (const notify of listeners) notify();
    }, 250);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) clearInterval(timer);
  };
};

const getNow = () => now;

/** Whole seconds until `deadline` (a local `Date.now()` timestamp), never negative. */
export const useSecondsLeft = (deadline: number | null): number => {
  const current = useSyncExternalStore(subscribe, getNow);
  return deadline === null ? 0 : Math.max(0, Math.ceil((deadline - current) / 1000));
};
