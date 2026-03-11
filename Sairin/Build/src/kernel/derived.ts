import { Subscriber, trackDependency, generateId, getGlobalActiveComputation, setGlobalActiveComputation } from './dependency';
import { Signal } from './signal';

export class Derived<T> {
  readonly id: number;
  private compute: () => T;
  private cached: T | undefined;
  private dirty = true;
  private subscribers = new Set<Subscriber>();
  private dependencies = new Set<Signal<any>>();

  constructor(fn: () => T) {
    this.id = generateId();
    this.compute = fn;
    this.recompute();
  }

  private recompute(): void {
    const previousComputation = getGlobalActiveComputation();
    
    const tracker = () => {
      this.dirty = true;
      this.notifySubscribers();
    };

    setGlobalActiveComputation(tracker);
    
    this.dependencies.forEach((dep) => {
      dep.unsubscribe(tracker);
    });
    this.dependencies.clear();

    const activeComp = () => {
      const result = this.compute();
      this.cached = result;
    };
    
    setGlobalActiveComputation(activeComp);
    try {
      this.cached = this.compute();
    } finally {
      setGlobalActiveComputation(previousComputation);
    }

    this.dirty = false;
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((fn) => fn());
  }

  get(): T {
    if (this.dirty) {
      this.recompute();
    }
    trackDependency(this as any);
    return this.cached!;
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

  isDirty(): boolean {
    return this.dirty;
  }

  peek(): T {
    if (this.dirty) {
      this.recompute();
    }
    return this.cached!;
  }
}

export function derived<T>(fn: () => T): Derived<T> {
  return new Derived(fn);
}
