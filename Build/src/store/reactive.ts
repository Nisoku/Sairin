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

    if (isObject(value) && !Array.isArray(value)) {
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
        target[prop] = newValue as any;
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
