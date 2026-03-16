import { Signal, signal, Subscriber, trackDependency } from "../kernel";
import { path } from "../kernel/path";

let mapId = 0;

function nextMapId(): string {
  return (++mapId).toString(36);
}

export class ReactiveMap<K, V> {
  private id: string;
  private entries = new Map<K, Signal<V>>();
  private keyIds = new WeakMap<object, string>();
  private primKeyIds = new Map<string | number | symbol, string>();
  private nextKeyId = 0;
  private sizeSignal: Signal<number>;
  private subscribers = new Set<Subscriber>();

  constructor(initial: [K, V][] = []) {
    this.id = nextMapId();
    this.sizeSignal = signal(path("map", this.id, "size"), 0);
    for (const [key, value] of initial) {
      const kid = this.getKeyId(key);
      this.entries.set(key, signal(path("map", this.id, kid), value));
    }
    this.sizeSignal.set(this.entries.size);
  }

  private getKeyId(key: K): string {
    if (
      (typeof key === "object" || typeof key === "function") &&
      key !== null
    ) {
      let id = this.keyIds.get(key as object);
      if (!id) {
        id = (this.nextKeyId++).toString(36);
        this.keyIds.set(key as object, id);
      }
      return id;
    }
    const prim = key as string | number | symbol;
    let id = this.primKeyIds.get(prim);
    if (!id) {
      id = (this.nextKeyId++).toString(36);
      this.primKeyIds.set(prim, id);
    }
    return id;
  }

  private removeKeyId(key: K): void {
    if (
      (typeof key === "object" || typeof key === "function") &&
      key !== null
    ) {
      this.keyIds.delete(key as object);
    } else {
      const prim = key as string | number | symbol;
      this.primKeyIds.delete(prim);
    }
  }

  private notify(): void {
    for (const fn of this.subscribers) {
      fn();
    }
  }

  get(key: K): V | undefined {
    this.sizeSignal.get();
    return this.entries.get(key)?.get();
  }

  set(key: K, value: V): void {
    const existing = this.entries.get(key);
    if (existing) {
      existing.set(value);
    } else {
      const kid = this.getKeyId(key);
      this.entries.set(key, signal(path("map", this.id, kid), value));
      this.sizeSignal.set(this.entries.size);
    }
    this.notify();
  }

  has(key: K): boolean {
    this.sizeSignal.get();
    return this.entries.has(key);
  }

  delete(key: K): boolean {
    const result = this.entries.delete(key);
    if (result) {
      this.removeKeyId(key);
      this.sizeSignal.set(this.entries.size);
      this.notify();
    }
    return result;
  }

  clear(): void {
    for (const key of this.entries.keys()) {
      this.removeKeyId(key);
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
    this.sizeSignal.get();
    function* gen(this: ReactiveMap<K, V>) {
      for (const sig of this.entries.values()) {
        yield sig.get();
      }
    }
    return gen.call(this);
  }

  entriesIterable(): IterableIterator<[K, V]> {
    this.sizeSignal.get();
    function* gen(this: ReactiveMap<K, V>) {
      for (const [key, sig] of this.entries.entries()) {
        yield [key, sig.get()] as [K, V];
      }
    }
    return gen.call(this);
  }

  forEach(fn: (value: V, key: K, map: ReactiveMap<K, V>) => void): void {
    this.sizeSignal.get();
    for (const [key, sig] of this.entries.entries()) {
      fn(sig.get(), key, this);
    }
  }

  toArray(): [K, V][] {
    this.sizeSignal.get();
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
