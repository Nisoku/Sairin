import { Signal, signal } from "../kernel/signal";
import { path } from "../kernel/path";

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
  basePath?: string,
): ReactiveObject<T> {
  const id = nextStoreId();
  const storePath = basePath || `store_${id}`;
  const result: any = {};
  const signal$ = signal(path(storePath, "$"), obj);

  for (const key of Object.keys(obj) as (keyof T)[]) {
    const value = obj[key];

    if (Array.isArray(value)) {
      // Handle arrays by wrapping elements with signals
      const arrSignal = signal(path(storePath, String(key)), value);
      result[key] = new Proxy(arrSignal, {
        get(target, prop) {
          if (prop === "length") return target.get().length;
          if (typeof prop === "number") return target.get()[prop];
          if (prop === "get") return () => target.get();
          return (target.get() as any)[prop];
        },
        set(target, prop, newValue) {
          if (prop === "length") {
            const arr = [...target.get()];
            arr.length = newValue;
            target.set(arr as any);
            return true;
          }
          if (typeof prop === "number") {
            const arr = [...target.get()];
            arr[prop] = newValue;
            target.set(arr as any);
            return true;
          }
          return false;
        },
      });
    } else if (isObject(value)) {
      result[key] = reactive(value, `${storePath}/${String(key)}`);
    } else {
      result[key] = signal(path(storePath, String(key)), value);
    }
  }

  result.$ = signal$;
  result.$raw = obj;

  const proxy = new Proxy(result, {
    get(target, prop) {
      if (prop === "$") return target.$;
      if (prop === "$raw") return target.$raw;
      return target[prop];
    },
    set(target, prop, newValue) {
      if (prop === "$" || prop === "$raw") {
        throw new Error("Cannot set $ or $raw directly");
      }
      if (target[prop] && target[prop] instanceof Signal) {
        target[prop].set(newValue);
      } else {
        // Convert to Signal to maintain reactive invariant
        const storePath = target.$.path.raw;
        target[prop] = signal(path(storePath, String(prop)), newValue);
      }
      return true;
    },
  });

  return proxy;
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
  for (const key of Object.keys(value) as (keyof T)[]) {
    const propSignal = reactiveObj[key];
    if (propSignal && propSignal instanceof Signal) {
      (propSignal as Signal<any>).set(value[key]);
    }
  }
  reactiveObj.$.set(value);
}
