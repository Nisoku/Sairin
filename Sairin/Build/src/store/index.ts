import { reactive, isReactive, toRaw, setReactive, type ReactiveObject } from './reactive';
import { ReactiveArray, reactiveArray } from './array';
import { ReactiveMap, reactiveMap } from './map';

export function createStore<T extends object>(initial: T): ReactiveObject<T> {
  return reactive(initial);
}

export function updateStore<T extends object>(store: ReactiveObject<T>, value: Partial<T>): void {
  const current = toRaw(store);
  setReactive(store, { ...current, ...value } as T);
}

export function createList<T>(items?: T[]): ReactiveArray<T> {
  return reactiveArray(items);
}

export function createMap<K, V>(entries?: [K, V][]): ReactiveMap<K, V> {
  return reactiveMap(entries);
}

export {
  reactive,
  isReactive,
  toRaw,
  setReactive,
  type ReactiveObject,
  ReactiveArray,
  reactiveArray,
  ReactiveMap,
  reactiveMap
};
