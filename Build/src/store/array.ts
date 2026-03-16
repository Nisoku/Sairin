import { Signal, signal, Subscriber } from "../kernel";
import { path } from "../kernel/path";

let arrayId = 0;

function nextArrayId(): string {
  return (++arrayId).toString(36);
}

export class ReactiveArray<T> {
  private id: string;
  private itemsSignal: Signal<T[]>;
  private lengthSignal: Signal<number>;
  private subscribers = new Set<Subscriber>();

  constructor(initial: T[] = []) {
    this.id = nextArrayId();
    this.itemsSignal = signal(path("array", this.id, "items"), initial);
    this.lengthSignal = signal(
      path("array", this.id, "length"),
      initial.length,
    );
  }

  private notify(): void {
    for (const fn of this.subscribers) {
      fn();
    }
  }

  private update(fn: (arr: T[]) => T[]): void {
    const newItems = fn(this.itemsSignal.peek());
    this.itemsSignal.set(newItems);
    this.lengthSignal.set(newItems.length);
    this.notify();
  }

  get length(): number {
    return this.lengthSignal.get();
  }

  get(index: number): T | undefined {
    const items = this.itemsSignal.get();
    return items[index];
  }

  set(index: number, value: T): void {
    const items = [...this.itemsSignal.peek()];
    items[index] = value;
    this.itemsSignal.set(items);
    // Ensure lengthSignal is updated when setting beyond current length
    this.lengthSignal.set(items.length);
    this.notify();
  }

  push(...values: T[]): number {
    this.update((arr) => [...arr, ...values]);
    return this.lengthSignal.get();
  }

  pop(): T | undefined {
    let result: T | undefined;
    this.update((arr) => {
      result = arr[arr.length - 1];
      return arr.slice(0, -1);
    });
    return result;
  }

  shift(): T | undefined {
    let result: T | undefined;
    this.update((arr) => {
      result = arr[0];
      return arr.slice(1);
    });
    return result;
  }

  unshift(...values: T[]): number {
    this.update((arr) => [...values, ...arr]);
    return this.lengthSignal.get();
  }

  clear(): void {
    this.update(() => []);
  }

  splice(start: number, deleteCount?: number, ...items: T[]): T[] {
    const deleted: T[] = [];
    this.update((arr) => {
      const result = [...arr];
      // When deleteCount is undefined, JS splice deletes through the end
      const effectiveDelete =
        deleteCount === undefined
          ? Math.max(0, result.length - start)
          : deleteCount;
      deleted.push(...result.splice(start, effectiveDelete, ...items));
      return result;
    });
    return deleted;
  }

  filter(predicate: (value: T, index: number) => boolean): T[] {
    return this.itemsSignal.get().filter(predicate);
  }

  map<U>(fn: (value: T, index: number) => U): U[] {
    return this.itemsSignal.get().map(fn);
  }

  reduce<U>(fn: (acc: U, value: T, index: number) => U, initial: U): U {
    return this.itemsSignal.get().reduce(fn, initial);
  }

  find(predicate: (value: T, index: number) => boolean): T | undefined {
    return this.itemsSignal.get().find(predicate);
  }

  findIndex(predicate: (value: T, index: number) => boolean): number {
    return this.itemsSignal.get().findIndex(predicate);
  }

  includes(searchElement: T): boolean {
    return this.itemsSignal.get().includes(searchElement);
  }

  indexOf(searchElement: T): number {
    return this.itemsSignal.get().indexOf(searchElement);
  }

  some(predicate: (value: T, index: number) => boolean): boolean {
    return this.itemsSignal.get().some(predicate);
  }

  every(predicate: (value: T, index: number) => boolean): boolean {
    return this.itemsSignal.get().every(predicate);
  }

  toArray(): T[] {
    return [...this.itemsSignal.get()];
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

  [Symbol.iterator](): Iterator<T> {
    return this.itemsSignal.get()[Symbol.iterator]();
  }
}

export function reactiveArray<T>(items?: T[]): ReactiveArray<T> {
  return new ReactiveArray(items);
}
