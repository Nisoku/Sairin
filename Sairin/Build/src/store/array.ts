import { Signal, signal, Subscriber, trackDependency } from '../kernel';

export class ReactiveArray<T> {
  private itemsSignal: Signal<T[]>;
  private lengthSignal: Signal<number>;
  private subscribers = new Set<Subscriber>();

  constructor(initial: T[] = []) {
    this.itemsSignal = signal(initial);
    this.lengthSignal = signal(initial.length);
  }

  private notify(): void {
    this.subscribers.forEach(fn => fn());
  }

  private update(fn: (arr: T[]) => T[]): void {
    const newItems = fn(this.itemsSignal.peek());
    this.itemsSignal.set(newItems);
    this.lengthSignal.set(newItems.length);
    this.notify();
  }

  get(index: number): T | undefined {
    trackDependency(this.itemsSignal);
    const items = this.itemsSignal.peek();
    return items[index];
  }

  set(index: number, value: T): void {
    this.update((arr) => {
      const newArr = [...arr];
      newArr[index] = value;
      return newArr;
    });
  }

  push(...items: T[]): number {
    this.update((arr) => [...arr, ...items]);
    return this.lengthSignal.peek();
  }

  pop(): T | undefined {
    let popped: T | undefined;
    this.update((arr) => {
      const newArr = [...arr];
      popped = newArr.pop();
      return newArr;
    });
    return popped;
  }

  shift(): T | undefined {
    let shifted: T | undefined;
    this.update((arr) => {
      const newArr = [...arr];
      shifted = newArr.shift();
      return newArr;
    });
    return shifted;
  }

  unshift(...items: T[]): number {
    this.update((arr) => [...items, ...arr]);
    return this.lengthSignal.peek();
  }

  splice(start: number, deleteCount?: number, ...items: T[]): T[] {
    let deleted: T[] = [];
    this.update((arr) => {
      const newArr = [...arr];
      deleted = newArr.splice(start, deleteCount, ...items);
      return newArr;
    });
    return deleted;
  }

  map<R>(fn: (item: T, index: number) => R): R[] {
    return this.itemsSignal.peek().map(fn);
  }

  filter(fn: (item: T, index: number) => boolean): T[] {
    return this.itemsSignal.peek().filter(fn);
  }

  reduce<R>(fn: (acc: R, item: T, index: number) => R, initial: R): R {
    return this.itemsSignal.peek().reduce(fn, initial);
  }

  find(fn: (item: T, index: number) => boolean): T | undefined {
    return this.itemsSignal.peek().find(fn);
  }

  findIndex(fn: (item: T, index: number) => boolean): number {
    return this.itemsSignal.peek().findIndex(fn);
  }

  includes(searchElement: T, fromIndex?: number): boolean {
    return this.itemsSignal.peek().includes(searchElement, fromIndex);
  }

  indexOf(searchElement: T, fromIndex?: number): number {
    return this.itemsSignal.peek().indexOf(searchElement, fromIndex);
  }

  every(fn: (item: T, index: number) => boolean): boolean {
    return this.itemsSignal.peek().every(fn);
  }

  some(fn: (item: T, index: number) => boolean): boolean {
    return this.itemsSignal.peek().some(fn);
  }

  get length(): number {
    trackDependency(this.lengthSignal);
    return this.lengthSignal.peek();
  }

  toArray(): T[] {
    trackDependency(this.itemsSignal);
    return [...this.itemsSignal.peek()];
  }

  subscribe(fn: Subscriber): () => void {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  clear(): void {
    this.update(() => []);
  }

  reverse(): void {
    this.update((arr) => [...arr].reverse());
  }

  sort(compareFn?: (a: T, b: T) => number): void {
    this.update((arr) => [...arr].sort(compareFn));
  }

  [Symbol.iterator](): Iterator<T> {
    return this.itemsSignal.peek()[Symbol.iterator]();
  }
}

export function reactiveArray<T>(initial: T[] = []): ReactiveArray<T> {
  return new ReactiveArray(initial);
}
