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
    const currentController = new AbortController();
    abortController = currentController;

    loading.set(true);
    error.set(null);

    loader()
      .then((data) => {
        if (
          !currentController.signal.aborted &&
          abortController === currentController
        ) {
          value.set(data);
        }
      })
      .catch((e) => {
        if (
          !currentController.signal.aborted &&
          abortController === currentController
        ) {
          error.set(e instanceof Error ? e : new Error(String(e)));
        }
      })
      .finally(() => {
        if (abortController === currentController) {
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
      loading.set(false);
      error.set(null);
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
    const currentController = new AbortController();
    abortController = currentController;
    currentLoader = loader;

    loading.set(true);
    error.set(null);

    loader()
      .then((data) => {
        if (
          !currentController.signal.aborted &&
          abortController === currentController &&
          currentLoader === loader
        ) {
          value.set(data);
        }
      })
      .catch((e) => {
        if (
          !currentController.signal.aborted &&
          abortController === currentController &&
          currentLoader === loader
        ) {
          error.set(e instanceof Error ? e : new Error(String(e)));
        }
      })
      .finally(() => {
        if (abortController === currentController && currentLoader === loader) {
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
      // Abort the active controller and ensure state is reset like finally
      abortController?.abort();
      abortController = null;
      loading.set(false);
      error.set(null);
    },
  };
}

export interface SuspenseConfig {
  fallback: any;
  timeout?: number;
}

export class SuspenseBoundary {
  private id = nextResourceId();
  private loading = signal(path("suspense", this.id, "loading"), false);
  private error: Signal<Error | null> = signal(
    path("suspense", this.id, "error"),
    null,
  );
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
