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
      /**
       * Concurrent behavior: when running.peek() is true, start will await
       * currentPromise (if set) and return without re-executing the operation.
       * Callers should not expect re-triggering and can treat it as an
       * idempotent no-op during active runs.
       */
      if (running.peek()) {
        if (currentPromise) {
          await currentPromise;
        }
        return;
      }

      const runController = new AbortController();
      abortController = runController;
      running.set(true);
      error.set(null);

      const perform = async () => {
        try {
          const data = await fn(runController.signal);
          if (
            !runController.signal.aborted &&
            abortController === runController
          ) {
            result.set(data);
          }
        } catch (e) {
          if (
            !runController.signal.aborted &&
            abortController === runController
          ) {
            error.set(e instanceof Error ? e : new Error(String(e)));
          }
        } finally {
          if (abortController === runController) {
            running.set(false);
          }
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
  /**
   * Pipeline function, last-write-wins behavior.
   * Concurrent calls to start() will not be queued or merged.
   * Earlier runs may be orphaned (their results/errors discarded).
   * Callers must manage concurrency.
   */
  const id = nextFlowId();
  const running = signal(path("pipeline", id, "running"), false);
  const result = signal<R | null>(path("pipeline", id, "result"), null);
  const error = signal<Error | null>(path("pipeline", id, "error"), null);
  let abortController: AbortController | null = null;
  let currentPromise: Promise<void> | null = null;

  return {
    running,
    result,
    error,
    start: async (input: T) => {
      if (running.peek()) {
        if (currentPromise) {
          await currentPromise;
        }
        return;
      }

      const runController = new AbortController();
      abortController = runController;
      running.set(true);
      error.set(null);

      const perform = async () => {
        try {
          const data = await fn(input, runController.signal);
          if (
            !runController.signal.aborted &&
            abortController === runController
          ) {
            result.set(data);
          }
        } catch (e) {
          if (
            !runController.signal.aborted &&
            abortController === runController
          ) {
            error.set(e instanceof Error ? e : new Error(String(e)));
          }
        } finally {
          if (abortController === runController) {
            running.set(false);
          }
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
  /**
   * Executes functions in sequence, collecting all results and errors.
   * Does NOT fail fast, continues executing all functions even if some fail.
   * Uses abortController.signal to allow cancellation.
   */
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
      const runController = new AbortController();
      abortController = runController;
      running.set(true);

      const allResults: T[] = [];
      const allErrors: Error[] = [];

      for (const fn of fns) {
        if (runController.signal.aborted) break;

        try {
          const result = await fn(runController.signal);
          allResults.push(result);
        } catch (e) {
          allErrors.push(e instanceof Error ? e : new Error(String(e)));
        }
      }

      if (abortController === runController) {
        results.set(allResults);
        errors.set(allErrors);
        running.set(false);
      }
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
      const runController = new AbortController();
      abortController = runController;
      running.set(true);

      const promises = fns.map((fn) => fn(runController.signal));

      const settled = await Promise.allSettled(promises);

      const allResults: T[] = [];
      const allErrors: Error[] = [];

      for (const res of settled) {
        if (res.status === "fulfilled") {
          allResults.push(res.value as T);
        } else {
          const reason = res.reason;
          allErrors.push(
            reason instanceof Error ? reason : new Error(String(reason)),
          );
        }
      }

      if (abortController === runController) {
        results.set(allResults);
        errors.set(allErrors);
        running.set(false);
      }
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
  /**
   * Executes functions in parallel and returns the first to settle.
   * If the first to settle is a rejection, winner remains at -1.
   * Once a winner resolves, other pending promises are aborted.
   */
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
      const runController = new AbortController();
      abortController = runController;
      running.set(true);
      error.set(null);

      const promises = fns.map((fn, index) =>
        fn(runController.signal)
          .then((value) => ({ index, value }))
          .catch((e) => ({
            index,
            error: e instanceof Error ? e : new Error(String(e)),
          })),
      );

      const outcome = await Promise.race(promises);

      if (abortController !== runController) return;

      if ("error" in outcome) {
        error.set(outcome.error);
      } else {
        result.set(outcome.value);
        winner.set(outcome.index);
      }

      // Abort remaining competitors after race resolves
      abortController?.abort();
      running.set(false);
    },
    cancel: () => {
      abortController?.abort();
      running.set(false);
    },
  };
}
