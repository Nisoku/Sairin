import {
  getGlobalActiveComputation,
  setGlobalActiveComputation,
} from "./dependency";
import { scheduleEffect } from "./batch";
import {
  subscribe,
  unsubscribe,
  getOrCreateNode,
  type PathKey,
  type EffectNode,
} from "./graph";
import { getSairinLogger } from "./config";

export type CleanupFn = (() => void) | void;

const EFFECT_POOL_SIZE = 10;
const effectPool: { fn: () => CleanupFn; cleanup: CleanupFn }[] = [];

function getEffectFromPool(): { fn: () => CleanupFn; cleanup: CleanupFn } {
  if (effectPool.length > 0) {
    return effectPool.pop()!;
  }
  return { fn: () => undefined, cleanup: undefined };
}

function returnEffectToPool(effect: { fn: () => CleanupFn; cleanup: CleanupFn }): void {
  if (effectPool.length < EFFECT_POOL_SIZE) {
    effect.cleanup = undefined;
    effectPool.push(effect);
  }
}

let cleanupStack: CleanupFn[] = [];

export function onCleanup(fn: () => void): void {
  cleanupStack.push(fn);
}

function runCleanup(): void {
  while (cleanupStack.length > 0) {
    const fn = cleanupStack.pop();
    if (fn) fn();
  }
}

type ScheduleFn = (runner: () => void) => void;

function createEffect(fn: () => CleanupFn, schedule: ScheduleFn): () => void {
  const pooled = getEffectFromPool();
  let cleanupFn = pooled.cleanup;
  let disposed = false;
  const logger = getSairinLogger();

  const runner = () => {
    if (disposed) return;

    // Prefer stack-based cleanup first; if cleanupStack contained functions
    // they represent onCleanup-registered handlers. We run them and ignore
    // the previous returned cleanupFn to avoid double-cleanup. If no stack
    // cleanup ran, we invoke the previous cleanupFn (returned by the
    // previous effect invocation).
    const hadStackCleanup = cleanupStack.length > 0;
    runCleanup();
    if (!hadStackCleanup) {
      if (typeof cleanupFn === "function") {
        cleanupFn();
      }
    }

    const prev = getGlobalActiveComputation();
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
    }
  };

  schedule(runner);

  return () => {
    disposed = true;
    runCleanup();
    if (typeof cleanupFn === "function") {
      cleanupFn();
    }
    returnEffectToPool({ fn, cleanup: cleanupFn });
  };
}

export const effect = (fn: () => CleanupFn) => createEffect(fn, scheduleEffect);
export const effectSync = (fn: () => CleanupFn) => createEffect(fn, r => r());
export const effectIdle = (fn: () => CleanupFn) => createEffect(fn,
  r => typeof requestIdleCallback !== "undefined"
    ? requestIdleCallback(() => r())
    : setTimeout(() => r(), 0)
);

export function untracked<T>(fn: () => T): T {
  const previousComputation = getGlobalActiveComputation();
  setGlobalActiveComputation(null);

  try {
    return fn();
  } finally {
    setGlobalActiveComputation(previousComputation);
  }
}
