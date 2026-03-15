import { Signal, signal } from "../kernel/signal";
import { effect, onCleanup } from "../kernel/effect";
import { path } from "../kernel/path";

let resourceId = 0;

function nextResourceId(): string {
  return (++resourceId).toString(36);
}

export interface Resource<T> {
  value: Signal<T | null>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  refetch: () => void;
  abort: () => void;
}

export function resource<T>(
  loader: () => Promise<T>,
  initialValue: T | null = null,
): Resource<T> {
  const id = nextResourceId();
  const value = signal<T | null>(path("resource", id, "value"), initialValue);
  const loading = signal(path("resource", id, "loading"), true);
  const error = signal<Error | null>(path("resource", id, "error"), null);
  let abortController: AbortController | null = null;

  const load = () => {
    abortController?.abort();
    abortController = new AbortController();

    loading.set(true);
    error.set(null);

    loader()
      .then((data) => {
        if (!abortController!.signal.aborted) {
          value.set(data);
        }
      })
      .catch((e) => {
        if (!abortController!.signal.aborted) {
          error.set(e instanceof Error ? e : new Error(String(e)));
        }
      })
      .finally(() => {
        if (!abortController!.signal.aborted) {
          loading.set(false);
        }
      });
  };

  load();

  return {
    value,
    loading,
    error,
    refetch: load,
    abort: () => {
      abortController?.abort();
    },
  };
}

export function resourceWithSignal<T>(
  source: Signal<(() => Promise<T>) | null>,
  initialValue: T | null = null,
): Resource<T> {
  const id = nextResourceId();
  const value = signal<T | null>(path("resource", id, "value"), initialValue);
  const loading = signal(path("resource", id, "loading"), false);
  const error = signal<Error | null>(path("resource", id, "error"), null);
  let abortController: AbortController | null = null;
  let currentLoader: (() => Promise<T>) | null = null;

  const load = (loader: () => Promise<T>) => {
    abortController?.abort();
    abortController = new AbortController();
    currentLoader = loader;

    loading.set(true);
    error.set(null);

    loader()
      .then((data) => {
        if (!abortController!.signal.aborted && currentLoader === loader) {
          value.set(data);
        }
      })
      .catch((e) => {
        if (!abortController!.signal.aborted && currentLoader === loader) {
          error.set(e instanceof Error ? e : new Error(String(e)));
        }
      })
      .finally(() => {
        if (!abortController!.signal.aborted && currentLoader === loader) {
          loading.set(false);
        }
      });
  };

  effect(() => {
    const loader = source.get();
    if (loader) {
      load(loader);
    }
  });

  onCleanup(() => {
    abortController?.abort();
  });

  return {
    value,
    loading,
    error,
    refetch: () => {
      const loader = source.get();
      if (loader) load(loader);
    },
    abort: () => {
      abortController?.abort();
    },
  };
}

export interface SuspenseConfig {
  fallback: any;
  timeout?: number;
}

export class SuspenseBoundary {
  private loading = signal(path("suspense", "loading"), false);
  private error: Signal<Error | null> = signal(path("suspense", "error"), null);
  private fallback: any;

  constructor(config: SuspenseConfig) {
    this.fallback = config.fallback;
  }

  get loadingSignal(): Signal<boolean> {
    return this.loading;
  }

  get errorSignal(): Signal<Error | null> {
    return this.error;
  }

  getFallback(): any {
    return this.fallback;
  }

  showFallback(show: boolean): void {
    this.loading.set(show);
  }

  handleError(e: Error): void {
    this.error.set(e);
  }
}
