import { Signal, signal } from "../kernel/signal";
import { effect, effectSync, onCleanup } from "../kernel/effect";
import { path } from "../kernel/path";
import { generateUniqueId } from "../kernel/dependency";

let isTransition = false;
const transitionStack: boolean[] = [];

export function startTransition(fn: () => void): void {
  transitionStack.push(isTransition);
  isTransition = true;

  try {
    fn();
  } finally {
    isTransition = transitionStack.pop() ?? false;
  }
}

export function getIsTransition(): boolean {
  return isTransition;
}

export interface TransitionResult {
  pending: Signal<boolean>;
  start: (fn: () => void) => void;
}

export function useTransition(timeout = 0): TransitionResult {
  const pending = signal(
    path("transition", "pending", generateUniqueId()),
    false,
  );

  const start = (fn: () => void) => {
    pending.set(true);

    const performTransition = () => {
      try {
        startTransition(fn);
      } finally {
        pending.set(false);
      }
    };

    if (timeout > 0) {
      setTimeout(performTransition, timeout);
    } else {
      queueMicrotask(performTransition);
    }
  };

  return {
    pending,
    start,
  };
}

export interface DeferredValueOptions<T> {
  timeoutMs?: number;
  equals?: (a: T, b: T) => boolean;
}

export function deferred<T>(
  value: Signal<T>,
  options: DeferredValueOptions<T> = {},
): { signal: Signal<T>; dispose: () => void } {
  const { timeoutMs = 0, equals = Object.is } = options;
  const deferredValue = signal(
    path("transition", "deferred", generateUniqueId()),
    value.peek(),
  );

  const dispose = effect(() => {
    const newValue = value.get();

    if (equals(deferredValue.peek(), newValue)) {
      return;
    }

    if (timeoutMs > 0) {
      setTimeout(() => {
        if (!equals(deferredValue.peek(), newValue)) {
          deferredValue.set(newValue);
        }
      }, timeoutMs);
    } else {
      queueMicrotask(() => {
        if (!equals(deferredValue.peek(), newValue)) {
          deferredValue.set(newValue);
        }
      });
    }
  });

  return { signal: deferredValue, dispose };
}

export function useDeferred<T>(value: Signal<T>, timeoutMs = 0): Signal<T> {
  let deferredSignal: Signal<T>;
  effectSync(() => {
    const result = deferred(value, { timeoutMs });
    deferredSignal = result.signal;
    onCleanup(result.dispose);
  });
  return deferredSignal!;
}

export function useDeferredValue<T>(
  value: T | Signal<T>,
  timeoutMs = 0,
): Signal<T> {
  if (value instanceof Signal) {
    let deferredSignal: Signal<T>;
    effectSync(() => {
      const result = deferred(value, { timeoutMs });
      deferredSignal = result.signal;
      onCleanup(result.dispose);
    });
    return deferredSignal!;
  }
  const sig = signal(
    path("transition", "deferredValue", generateUniqueId()),
    value,
  );
  let deferredSignal: Signal<T>;
  effectSync(() => {
    const result = deferred(sig, { timeoutMs });
    deferredSignal = result.signal;
    onCleanup(result.dispose);
  });
  return deferredSignal!;
}
