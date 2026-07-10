import { Signal, signal } from "../kernel/signal";
import { path, isPathKey, type PathKey } from "../kernel/path";

let storeId = 0;

function nextStoreId(): string {
  return (++storeId).toString(36);
}

// Test helper to reset id counter
export function __resetStoreIdForTesting(): void {
  storeId = 0;
}

export type ReactiveObject<T> = {
  [K in keyof T]: T[K] extends object ? ReactiveObject<T[K]> : Signal<T[K]>;
} & {
  $: Signal<T>;
  $raw: T;
};

function isObject(value: unknown): value is object {
  return value !== null && typeof value === "object";
}

export function reactive<T extends object>(
  obj: T,
  basePath?: string | PathKey,
): ReactiveObject<T> {
  const id = nextStoreId();
  const storePath = isPathKey(basePath)
    ? basePath.raw
    : basePath || `store_${id}`;
  const result = {} as Record<string | symbol, unknown>;
  const signal$ = signal(path(storePath, "$"), obj);

  for (const key of Object.keys(obj)) {
    const value = obj[key as keyof T];

    if (Array.isArray(value)) {
      const arrSignal = signal(path(storePath, String(key)), value);
      result[key] = new Proxy(arrSignal, {
        get(target, prop) {
          if (prop === "length") return target.get().length;
          if (typeof prop === "number") return target.get()[prop];
          if (prop === "get") return () => target.get();
          return (target.get() as Record<string, unknown>)[prop as string];
        },
        set(target, prop, newValue) {
          if (prop === "length") {
            const arr = [...target.get()] as unknown as T[keyof T] & unknown[];
            arr.length = newValue as number;
            target.set(arr as T[keyof T] & unknown[]);
            return true;
          }
          if (typeof prop === "number") {
            const arr = [...target.get()] as unknown as T[keyof T] & unknown[];
            (arr as unknown[])[prop] = newValue;
            target.set(arr as T[keyof T] & unknown[]);
            return true;
          }
          return false;
        },
      });
    } else if (isObject(value)) {
      result[key] = reactive(value, path(storePath, String(key)));
    } else {
      result[key] = signal(path(storePath, String(key)), value);
    }
  }

  result.$ = signal$;
  result.$raw = obj;

  const proxy = new Proxy(result as Record<string | symbol, unknown>, {
    get(target, prop) {
      if (prop === "$") return target.$;
      if (prop === "$raw") return target.$raw;
      return target[prop as string];
    },
    set(target, prop, newValue) {
      if (prop === "$" || prop === "$raw") {
        throw new Error("Cannot set $ or $raw directly");
      }
      const existingProp = target[prop as string];
      if (existingProp && existingProp instanceof Signal) {
        existingProp.set(newValue);
      } else if (isObject(newValue) && newValue !== null) {
        const parentSegments = (target.$ as Signal<T>).path.segments;
        const childPath = path(...parentSegments, String(prop));
        target[prop as string] = reactive(newValue, childPath);
      } else {
        const parentSegments = (target.$ as Signal<T>).path.segments;
        target[prop as string] = signal(
          path(...parentSegments, String(prop)),
          newValue,
        );
      }
      return true;
    },
  });

  return proxy as unknown as ReactiveObject<T>;
}

export function isReactive<T>(value: unknown): value is ReactiveObject<T> {
  return isObject(value) && "$" in value && value.$ instanceof Signal;
}

export function toRaw<T>(reactiveObj: ReactiveObject<T>): T {
  return reactiveObj.$raw;
}

export function setReactive<T extends object>(
  reactiveObj: ReactiveObject<T>,
  value: T,
): void {
  for (const key of Object.keys(value)) {
    const propSignal = reactiveObj[key as keyof T];
    if (propSignal && propSignal instanceof Signal) {
      (propSignal as Signal<unknown>).set(value[key as keyof T]);
    }
  }
  reactiveObj.$.set(value);
}
