import { Subscriber, trackDependency, generateId, getGlobalActiveComputation } from './dependency';

export class Signal<T> {
  readonly id: number;
  private value: T;
  private subscribers = new Set<Subscriber>();

  constructor(initial: T) {
    this.id = generateId();
    this.value = initial;
  }

  get(): T {
    trackDependency(this);
    return this.value;
  }

  set(next: T): void {
    if (Object.is(this.value, next)) return;
    const oldValue = this.value;
    this.value = next;
    this.notifySubscribers(oldValue, next);
  }

  update(fn: (value: T) => T): void {
    this.set(fn(this.value));
  }

  private notifySubscribers(oldValue: T, newValue: T): void {
    this.subscribers.forEach((fn) => fn());
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

  getSubscriberCount(): number {
    return this.subscribers.size;
  }

  peek(): T {
    return this.value;
  }
}

export function signal<T>(initial: T): Signal<T> {
  return new Signal(initial);
}
