export { Signal, signal } from './signal';
export { Derived, derived } from './derived';
export { effect, effectSync, onCleanup, untracked } from './effect';
export { batch, scheduleEffect, isFlushing, hasPendingEffects } from './batch';
export { trackDependency, generateId, getGlobalActiveComputation, setGlobalActiveComputation, type Subscriber } from './dependency';

import { Signal } from './signal';
import { Derived } from './derived';
import { effect, effectSync, onCleanup, untracked } from './effect';
import { batch } from './batch';

export function createSignal<T>(value: T): Signal<T> {
  return new Signal(value);
}

export function createMemo<T>(fn: () => T, options?: { eager?: boolean }): Derived<T> {
  return new Derived(fn, options);
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
