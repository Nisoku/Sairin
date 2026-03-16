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
const effectPool: CleanupFn[] = [];

function getEffectFromPool(): CleanupFn {
  if (effectPool.length > 0) {
    return effectPool.pop()!;
  }
  return undefined;
}

function returnEffectToPool(cleanup: CleanupFn): void {
  if (effectPool.length < EFFECT_POOL_SIZE) {
    effectPool.push(cleanup);
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
  let cleanupFn = getEffectFromPool();
  let disposed = false;
  const logger = getSairinLogger();

  const runner = () => {
    if (disposed) return;

    // Run any onCleanup-registered handlers first
    runCleanup();

    // Call the previous cleanup function if it exists
    if (typeof cleanupFn === "function") {
      cleanupFn();
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
    returnEffectToPool(cleanupFn);
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
