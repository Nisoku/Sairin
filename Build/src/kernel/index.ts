export { Signal, signal, isSignal } from "./signal";
export { Derived, derived, type DerivedOptions } from "./derived";
export {
  effect,
  effectSync,
  effectIdle,
  onCleanup,
  untracked,
  type CleanupFn,
} from "./effect";
export { batch, scheduleEffect, isFlushing, hasPendingEffects } from "./batch";
export {
  trackDependency,
  generateId,
  generateUniqueId,
  getGlobalActiveComputation,
  setGlobalActiveComputation,
  type Subscriber,
} from "./dependency";
export {
  path,
  matchesPath,
  isPathKey,
  getParentPath,
  joinPath,
  type PathKey,
} from "./path";
export { path as Path }; // Re-export for convenience
export {
  getNode,
  hasNode,
  deleteNode,
  getAllNodes,
  getNodesUnder,
  subscribe,
  unsubscribe,
  notifySubscribers,
  trackNode,
  getOrCreateNode,
  watch,
  lock,
  unlock,
  isLocked,
  checkLock,
  assertLock,
  scheduleIncrementalCleanup,
  capRetainedMemory,
  __resetRegistryForTesting,
  alias,
  resolveAlias,
  unalias,
  isAlias,
  type ReactiveNode,
  type ReactiveKind,
} from "./graph";
export {
  configureSairin,
  getSairinConfig,
  type SairinConfig,
  type LockViolationBehavior,
} from "./config";

import { Signal } from "./signal";
import { Derived } from "./derived";
import { effect, effectSync, onCleanup, untracked } from "./effect";
import { batch } from "./batch";
import { type PathKey, path } from "./path";

export function createSignal<T>(path: PathKey, value: T): Signal<T> {
  return new Signal(path, value);
}

export function createMemo<T>(
  path: PathKey,
  fn: () => T,
  options?: { eager?: boolean },
): Derived<T> {
  return new Derived(path, fn, options);
}

export function createEffect(fn: () => void | (() => void)): () => void {
  return effect(fn);
}

export function createEffectSync(fn: () => void | (() => void)): () => void {
  return effectSync(fn);
}

export function onDispose(fn: () => void): void {
  onCleanup(fn);
}

export function untrack<T>(fn: () => T): T {
  return untracked(fn);
}

export function batched(fn: () => void): void {
  batch(fn);
}
