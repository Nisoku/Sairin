export {
  resource,
  resourceWithSignal,
  SuspenseBoundary,
  type Resource,
  type SuspenseConfig,
} from "./resource";
export {
  startTransition,
  getIsTransition,
  useTransition,
  deferred,
  useDeferred,
  useDeferredValue,
  type TransitionResult,
  type DeferredValueOptions,
} from "./transition";

import { resource, resourceWithSignal, type Resource } from "./resource";
import {
  useTransition,
  useDeferredValue,
  type TransitionResult,
} from "./transition";
import { Signal } from "../kernel/signal";
import { path } from "../kernel/path";
import { generateUniqueId } from "../kernel/dependency";

export function createResource<T>(
  loader: () => Promise<T>,
  initialValue?: T,
): Resource<T> {
  return resource(loader, initialValue ?? null);
}

export function createResourceFromSignal<T>(
  source: Signal<(() => Promise<T>) | null>,
  initialValue?: T,
): Resource<T> {
  return resourceWithSignal(source, initialValue ?? null);
}

export function useTransitionResult(): TransitionResult {
  return useTransition();
}

export function deferValue<T>(
  value: T,
  timeoutMs?: number,
): ReturnType<typeof useDeferredValue> {
  const sig = new Signal(path("async", "deferred", generateUniqueId()), value);
  return useDeferredValue(sig, timeoutMs);
}
