import { Signal, signal } from '../kernel/signal';
import { effect } from '../kernel/effect';

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
  const pending = signal(false);

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

export function deferred<T>(value: Signal<T>, options: DeferredValueOptions<T> = {}): Signal<T> {
  const { timeoutMs = 0, equals = Object.is } = options;
  const deferredValue = signal(value.peek());

  effect(() => {
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

  return deferredValue;
}

export function useDeferred<T>(value: Signal<T>, timeoutMs = 0): Signal<T> {
  return deferred(value, { timeoutMs });
}

export function useDeferredValue<T>(value: T, timeoutMs = 0): Signal<T> {
  const sig = signal(value);
  return deferred(sig, { timeoutMs });
}
