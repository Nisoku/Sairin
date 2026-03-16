import { Signal, signal, Subscriber, trackDependency } from "../kernel";
import { path } from "../kernel/path";

let mapId = 0;

function nextMapId(): string {
  return (++mapId).toString(36);
}

// Stable per-key id assignment to avoid collisions when using String(key)
const keyIdMap = new WeakMap<object, string>();
const primitiveKeyIdMap = new Map<string | number | symbol, string>();
let nextKeyId = 0;

function keyToId<K>(key: K): string {
  if ((typeof key === "object" || typeof key === "function") && key !== null) {
    const obj = key as unknown as object;
    let id = keyIdMap.get(obj);
    if (!id) {
      id = (++nextKeyId).toString(36);
      keyIdMap.set(obj, id);
    }
    return id;
  }
  // primitives
  const prim = String(key) as string | number | symbol;
  let id = primitiveKeyIdMap.get(prim);
  if (!id) {
    id = (++nextKeyId).toString(36);
    primitiveKeyIdMap.set(prim, id);
  }
  return id;
}

function removeKeyId<K>(key: K): void {
  if ((typeof key === "object" || typeof key === "function") && key !== null) {
    const obj = key as unknown as object;
    keyIdMap.delete(obj);
  } else {
    const prim = String(key) as string | number | symbol;
    primitiveKeyIdMap.delete(prim);
  }
}

export class ReactiveMap<K, V> {
  private id: string;
  private entries = new Map<K, Signal<V>>();
  private sizeSignal: Signal<number>;
  private subscribers = new Set<Subscriber>();

  constructor(initial: [K, V][] = []) {
    this.id = nextMapId();
    this.sizeSignal = signal(path("map", this.id, "size"), 0);
    for (const [key, value] of initial) {
      const kid = keyToId(key as any);
      this.entries.set(key, signal(path("map", this.id, kid), value));
    }
    this.sizeSignal.set(this.entries.size);
  }

  private notify(): void {
    this.subscribers.forEach((fn) => fn());
  }

  get(key: K): V | undefined {
    return this.entries.get(key)?.get();
  }

  set(key: K, value: V): void {
    const existing = this.entries.get(key);
    if (existing) {
      existing.set(value);
    } else {
      const kid = keyToId(key as any);
      this.entries.set(key, signal(path("map", this.id, kid), value));
      this.sizeSignal.set(this.entries.size);
    }
    this.notify();
  }

  has(key: K): boolean {
    return this.entries.has(key);
  }

  delete(key: K): boolean {
    const result = this.entries.delete(key);
    if (result) {
      removeKeyId(key);
      this.sizeSignal.set(this.entries.size);
      this.notify();
    }
    return result;
  }

  clear(): void {
    for (const key of this.entries.keys()) {
      removeKeyId(key);
    }
    this.entries.clear();
    this.sizeSignal.set(0);
    this.notify();
  }

  get size(): number {
    return this.sizeSignal.get();
  }

  keys(): IterableIterator<K> {
    return this.entries.keys();
  }

  values(): IterableIterator<V> {
    function* gen(this: ReactiveMap<K, V>) {
      for (const sig of this.entries.values()) {
        yield sig.get();
      }
    }
    return gen.call(this);
  }

  entriesIterable(): IterableIterator<[K, V]> {
    function* gen(this: ReactiveMap<K, V>) {
      for (const [key, sig] of this.entries.entries()) {
        yield [key, sig.get()] as [K, V];
      }
    }
    return gen.call(this);
  }

  forEach(fn: (value: V, key: K, map: ReactiveMap<K, V>) => void): void {
    for (const [key, sig] of this.entries.entries()) {
      fn(sig.get(), key, this);
    }
  }

  toArray(): [K, V][] {
    const result: [K, V][] = [];
    for (const [key, sig] of this.entries.entries()) {
      result.push([key, sig.get()]);
    }
    return result;
  }

  subscribe(fn: Subscriber): () => void {
    this.subscribers.add(fn);
    return () => {
      this.subscribers.delete(fn);
    };
  }

  unsubscribe(fn: Subscriber): void {
    this.subscribers.delete(fn);
  }

  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this.entriesIterable();
  }
}

export function reactiveMap<K, V>(entries?: [K, V][]): ReactiveMap<K, V> {
  return new ReactiveMap(entries);
}
