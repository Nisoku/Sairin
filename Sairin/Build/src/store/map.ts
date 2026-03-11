import { Signal, signal, Subscriber, trackDependency } from '../kernel';

export class ReactiveMap<K, V> {
  private entries = new Map<K, Signal<V>>();
  private sizeSignal: Signal<number>;
  private subscribers = new Set<Subscriber>();

  constructor(initial: [K, V][] = []) {
    this.sizeSignal = signal(0);
    for (const [key, value] of initial) {
      this.entries.set(key, signal(value));
    }
    this.sizeSignal.set(this.entries.size);
  }

  private notify(): void {
    this.subscribers.forEach(fn => fn());
  }

  get(key: K): V | undefined {
    const sig = this.entries.get(key);
    if (sig) {
      trackDependency(sig);
      return sig.peek();
    }
    return undefined;
  }

  set(key: K, value: V): void {
    if (this.entries.has(key)) {
      this.entries.get(key)!.set(value);
    } else {
      this.entries.set(key, signal(value));
      this.sizeSignal.set(this.entries.size);
    }
    this.notify();
  }

  delete(key: K): boolean {
    const result = this.entries.delete(key);
    if (result) {
      this.sizeSignal.set(this.entries.size);
      this.notify();
    }
    return result;
  }

  has(key: K): boolean {
    return this.entries.has(key);
  }

  get size(): number {
    trackDependency(this.sizeSignal);
    return this.sizeSignal.peek();
  }

  clear(): void {
    this.entries.clear();
    this.sizeSignal.set(0);
    this.notify();
  }

  keys(): IterableIterator<K> {
    return this.entries.keys();
  }

  values(): IterableIterator<V> {
    const self = this;
    return {
      [Symbol.iterator]() {
        return this;
      },
      next(): IteratorResult<V> {
        const result = self.entries.values().next();
        if (result.done) {
          return { done: true, value: undefined };
        }
        trackDependency(result.value);
        return { done: false, value: result.value.peek() };
      },
    };
  }

  entries_(): IterableIterator<[K, V]> {
    const self = this;
    return {
      [Symbol.iterator]() {
        return this;
      },
      next(): IteratorResult<[K, V]> {
        const result = self.entries.entries().next();
        if (result.done) {
          return { done: true, value: undefined };
        }
        const [key, valueSig] = result.value;
        trackDependency(valueSig);
        return { done: false, value: [key, valueSig.peek()] };
      },
    };
  }

  forEach(fn: (value: V, key: K, map: ReactiveMap<K, V>) => void): void {
    this.entries.forEach((valueSig, key) => {
      trackDependency(valueSig);
      fn(valueSig.peek(), key, this);
    });
  }

  subscribe(fn: Subscriber): () => void {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  toArray(): [K, V][] {
    const result: [K, V][] = [];
    this.entries.forEach((valueSig, key) => {
      trackDependency(valueSig);
      result.push([key, valueSig.peek()]);
    });
    return result;
  }
}

export function reactiveMap<K, V>(initial: [K, V][] = []): ReactiveMap<K, V> {
  return new ReactiveMap(initial);
}
