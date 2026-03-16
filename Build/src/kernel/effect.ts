import {
  getGlobalActiveComputation,
  setGlobalActiveComputation,
} from "./dependency";
import { scheduleEffect } from "./batch";
import { getSairinLogger } from "./config";

export type CleanupFn = (() => void) | void;

type ScheduleFn = (runner: () => void) => void;

interface EffectContext {
  cleanups: CleanupFn[];
}

let currentEffect: EffectContext | null = null;

export function onCleanup(fn: () => void): void {
  if (currentEffect) {
    currentEffect.cleanups.push(fn);
  }
}

function runCleanup(cleanups: CleanupFn[]): void {
  while (cleanups.length > 0) {
    const fn = cleanups.pop();
    if (fn) fn();
  }
}

function createEffect(fn: () => CleanupFn, schedule: ScheduleFn): () => void {
  let cleanupFn: CleanupFn;
  let disposed = false;
  const logger = getSairinLogger();
  const effectContext: EffectContext = { cleanups: [] };

  const runner = () => {
    if (disposed) return;

    // Run any onCleanup-registered handlers first
    runCleanup(effectContext.cleanups);

    // Call the previous cleanup function if it exists
    if (typeof cleanupFn === "function") {
      cleanupFn();
    }

    const prev = getGlobalActiveComputation();
    const prevEffect = currentEffect;
    currentEffect = effectContext;
    effectContext.cleanups = [];

    setGlobalActiveComputation(runner);

    try {
      cleanupFn = fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (logger) {
        logger.error(`Effect threw: ${message}`, { tags: ["effect", "runtime"] });
      }
    } finally {
      setGlobalActiveComputation(prev);
      currentEffect = prevEffect;
    }
  };

  schedule(runner);

  return () => {
    disposed = true;
    runCleanup(effectContext.cleanups);
    if (typeof cleanupFn === "function") {
      cleanupFn();
    }
  };
}

export const effect = (fn: () => CleanupFn) => createEffect(fn, scheduleEffect);
export const effectSync = (fn: () => CleanupFn) => createEffect(fn, r => r());

export const effectIdle = (fn: () => CleanupFn) => createEffect(fn, (runner) => {
  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(() => runner());
  } else {
    setTimeout(() => runner(), 0);
  }
});

export function untracked<T>(fn: () => T): T {
  const previousComputation = getGlobalActiveComputation();
  setGlobalActiveComputation(null);

  try {
    return fn();
  } finally {
    setGlobalActiveComputation(previousComputation);
  }
}
