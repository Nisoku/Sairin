import { Signal, signal } from "../kernel/signal";
import { path } from "../kernel/path";

let flowId = 0;

function nextFlowId(): string {
  return (++flowId).toString(36);
}

export interface Flow<T> {
  running: Signal<boolean>;
  result: Signal<T | null>;
  error: Signal<Error | null>;
  start: () => Promise<void>;
  cancel: () => void;
}

export function flow<T>(fn: (signal: AbortSignal) => Promise<T>): Flow<T> {
  const id = nextFlowId();
  const running = signal(path("flow", id, "running"), false);
  const result = signal<T | null>(path("flow", id, "result"), null);
  const error = signal<Error | null>(path("flow", id, "error"), null);
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

      const perform = async () => {
        try {
          const data = await fn(abortController!.signal);
          if (!abortController!.signal.aborted) {
            result.set(data);
          }
        } catch (e) {
          if (!abortController!.signal.aborted) {
            error.set(e instanceof Error ? e : new Error(String(e)));
          }
        } finally {
          running.set(false);
        }
      };

      currentPromise = perform();

      try {
        await currentPromise;
      } catch (e) {
        // Ignore abort errors
      }
    },
    cancel: () => {
      abortController?.abort();
      running.set(false);
    },
  };
}

export interface Pipeline<T, R> {
  running: Signal<boolean>;
  result: Signal<R | null>;
  error: Signal<Error | null>;
  start: (input: T) => Promise<void>;
  cancel: () => void;
}

export function pipeline<T, R>(
  fn: (input: T, signal: AbortSignal) => Promise<R>,
): Pipeline<T, R> {
  const id = nextFlowId();
  const running = signal(path("pipeline", id, "running"), false);
  const result = signal<R | null>(path("pipeline", id, "result"), null);
  const error = signal<Error | null>(path("pipeline", id, "error"), null);
  let abortController: AbortController | null = null;

  return {
    running,
    result,
    error,
    start: async (input: T) => {
      abortController = new AbortController();
      running.set(true);
      error.set(null);

      try {
        const data = await fn(input, abortController.signal);
        if (!abortController.signal.aborted) {
          result.set(data);
        }
      } catch (e) {
        if (!abortController.signal.aborted) {
          error.set(e instanceof Error ? e : new Error(String(e)));
        }
      } finally {
        if (!abortController.signal.aborted) {
          running.set(false);
        }
      }
    },
    cancel: () => {
      abortController?.abort();
      running.set(false);
    },
  };
}

export interface Sequence<T> {
  running: Signal<boolean>;
  results: Signal<T[]>;
  errors: Signal<Error[]>;
  start: () => Promise<void>;
  cancel: () => void;
}

export function sequence<T>(
  ...fns: ((signal: AbortSignal) => Promise<T>)[]
): Sequence<T> {
  const id = nextFlowId();
  const running = signal(path("sequence", id, "running"), false);
  const results = signal(path("sequence", id, "results"), [] as T[]);
  const errors = signal(path("sequence", id, "errors"), [] as Error[]);
  let abortController: AbortController | null = null;

  return {
    running,
    results,
    errors,
    start: async () => {
      abortController = new AbortController();
      running.set(true);

      const allResults: T[] = [];
      const allErrors: Error[] = [];

      for (const fn of fns) {
        if (abortController!.signal.aborted) break;

        try {
          const result = await fn(abortController!.signal);
          allResults.push(result);
        } catch (e) {
          allErrors.push(e instanceof Error ? e : new Error(String(e)));
        }
      }

      results.set(allResults);
      errors.set(allErrors);
      running.set(false);
    },
    cancel: () => {
      abortController?.abort();
      running.set(false);
    },
  };
}

export interface Parallel<T> {
  running: Signal<boolean>;
  results: Signal<T[]>;
  errors: Signal<Error[]>;
  start: () => Promise<void>;
  cancel: () => void;
}

export function parallel<T>(
  ...fns: ((signal: AbortSignal) => Promise<T>)[]
): Parallel<T> {
  const id = nextFlowId();
  const running = signal(path("parallel", id, "running"), false);
  const results = signal(path("parallel", id, "results"), [] as T[]);
  const errors = signal(path("parallel", id, "errors"), [] as Error[]);
  let abortController: AbortController | null = null;

  return {
    running,
    results,
    errors,
    start: async () => {
      abortController = new AbortController();
      running.set(true);

      const promises = fns.map((fn) => fn(abortController!.signal));

      const settled = await Promise.allSettled(promises);

      const allResults: T[] = [];
      const allErrors: Error[] = [];

      for (const res of settled) {
        if (res.status === "fulfilled") {
          allResults.push(res.value as T);
        } else {
          const reason = res.reason;
          allErrors.push(reason instanceof Error ? reason : new Error(String(reason)));
        }
      }

      results.set(allResults);
      errors.set(allErrors);
      running.set(false);
    },
    cancel: () => {
      abortController?.abort();
      running.set(false);
    },
  };
}

export interface Race<T> {
  running: Signal<boolean>;
  result: Signal<T | null>;
  error: Signal<Error | null>;
  winner: Signal<number>;
  start: () => Promise<void>;
  cancel: () => void;
}

export function race<T>(
  ...fns: ((signal: AbortSignal) => Promise<T>)[]
): Race<T> {
  const id = nextFlowId();
  const running = signal(path("race", id, "running"), false);
  const result = signal<T | null>(path("race", id, "result"), null);
  const error = signal<Error | null>(path("race", id, "error"), null);
  const winner = signal(path("race", id, "winner"), -1);
  let abortController: AbortController | null = null;

  return {
    running,
    result,
    error,
    winner,
    start: async () => {
      abortController = new AbortController();
      running.set(true);
      error.set(null);

      const promises = fns.map((fn, index) =>
        fn(abortController!.signal)
          .then((value) => ({ index, value }))
          .catch((e) => ({
            index,
            error: e instanceof Error ? e : new Error(String(e)),
          })),
      );

      const outcome = await Promise.race(promises);

      if ("error" in outcome) {
        error.set(outcome.error);
      } else {
        result.set(outcome.value);
        winner.set(outcome.index);
      }

      running.set(false);
    },
    cancel: () => {
      abortController?.abort();
      running.set(false);
    },
  };
}
