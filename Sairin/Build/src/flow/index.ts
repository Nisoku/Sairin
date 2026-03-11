import { Signal, signal } from '../kernel/signal';

export interface Flow<T> {
  running: Signal<boolean>;
  result: Signal<T | null>;
  error: Signal<Error | null>;
  start: () => Promise<void>;
  cancel: () => void;
}

export function flow<T>(fn: (signal: AbortSignal) => Promise<T>): Flow<T> {
  const running = signal(false);
  const result = signal<T | null>(null);
  const error = signal<Error | null>(null);
  let abortController: AbortController | null = null;
  let currentPromise: Promise<void> | null = null;

  return {
    running,
    result,
    error,
    start: async () => {
      if (running.peek()) {
        if (currentPromise) {
          await currentPromise;
        }
        return;
      }
      
      abortController = new AbortController();
      running.set(true);
      error.set(null);
      
      currentPromise = (async () => {
        try {
          const value = await fn(abortController!.signal);
          if (!abortController!.signal.aborted) {
            result.set(value);
          }
        } catch (e) {
          if (e instanceof Error && e.name !== 'AbortError') {
            error.set(e);
          } else if (!(e instanceof Error) && e !== 'AbortError') {
            error.set(new Error(String(e)));
          }
        } finally {
          running.set(false);
          currentPromise = null;
        }
      })();

      await currentPromise;
    },
    cancel: () => {
      abortController?.abort();
      running.set(false);
    },
  };
}

export interface Pipeline<T, R> {
  run: (input: T) => Promise<R>;
  cancel: () => void;
  paused: Signal<boolean>;
  progress: Signal<number>;
}

export function pipeline<T, R>(steps: ((input: any, signal: AbortSignal) => Promise<any>)[]): Pipeline<T, R> {
  let abortController: AbortController | null = null;
  const paused = signal(false);
  const progress = signal(0);

  return {
    paused,
    progress,
    run: async (input: T): Promise<R> => {
      abortController = new AbortController();
      let current: any = input;
      const total = steps.length;

      for (let i = 0; i < steps.length; i++) {
        if (abortController.signal.aborted) {
          throw new Error('Pipeline cancelled');
        }

        while (paused.peek()) {
          await new Promise(resolve => setTimeout(resolve, 50));
          if (abortController.signal.aborted) {
            throw new Error('Pipeline cancelled');
          }
        }

        current = await steps[i](current, abortController.signal);
        progress.set(((i + 1) / total) * 100);
      }

      return current;
    },
    cancel: () => {
      abortController?.abort();
    },
  };
}

export function sequence<T>(...fns: ((signal: AbortSignal) => Promise<T>)[]): Flow<T[]> {
  return flow(async (abortSignal) => {
    const results: T[] = [];
    for (const fn of fns) {
      if (abortSignal.aborted) {
        throw new Error('AbortError');
      }
      const result = await fn(abortSignal);
      results.push(result);
    }
    return results;
  });
}

export function parallel<T>(...fns: ((signal: AbortSignal) => Promise<T>)[]): Flow<T[]> {
  return flow(async (abortSignal) => {
    return Promise.all(fns.map(fn => fn(abortSignal)));
  });
}

export function race<T>(...fns: ((signal: AbortSignal) => Promise<T>)[]): Flow<T> {
  return flow(async (abortSignal) => {
    return Promise.race(fns.map(fn => fn(abortSignal)));
  });
}
