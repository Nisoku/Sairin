import { Signal, signal, Subscriber, trackDependency } from "../kernel";
import { path } from "../kernel/path";

let mapId = 0;

function nextMapId(): string {
  return (++mapId).toString(36);
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
      this.entries.set(key, signal(path("map", this.id, String(key)), value));
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
      this.entries.set(key, signal(path("map", this.id, String(key)), value));
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
      this.sizeSignal.set(this.entries.size);
      this.notify();
    }
    return result;
  }

  clear(): void {
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
    const values: V[] = [];
    for (const sig of this.entries.values()) {
      values.push(sig.get());
    }
    return values[Symbol.iterator]();
  }

  entriesIterable(): IterableIterator<[K, V]> {
    const result: [K, V][] = [];
    for (const [key, sig] of this.entries.entries()) {
      result.push([key, sig.get()]);
    }
    return result[Symbol.iterator]();
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
