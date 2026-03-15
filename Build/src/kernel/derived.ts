import {
  Subscriber,
  getGlobalActiveComputation,
  setGlobalActiveComputation,
  trackNode,
  subscribe,
  unsubscribe,
  notifySubscribers,
  getOrCreateNode,
  getNode,
  type PathKey,
  type DerivedNode,
} from "./graph";
import { generateUniqueId } from "./dependency";

export interface DerivedOptions {
  eager?: boolean;
}

export class Derived<T> {
  readonly id: number;
  readonly path: PathKey;
  private _node: DerivedNode<T>;

  constructor(path: PathKey, fn: () => T, options: DerivedOptions = {}) {
    this.id = parseInt(generateUniqueId(), 36);
    this.path = path;
    this._node = getOrCreateNode(path, "derived") as DerivedNode<T>;
    this._node.compute = fn;

    if (options.eager) {
      this.recompute();
    }
  }

  private recompute(): void {
    const oldSubscribers = new Set(this._node.subscribers);
    this._node.subscribers.clear();

    const prevComputation = getGlobalActiveComputation();

    const tracker = () => {
      this._node.dirty = true;
      notifySubscribers(this._node);
    };

    setGlobalActiveComputation(tracker);

    try {
      this._node.cached = this._node.compute();
      this._node.dirty = false;
    } finally {
      setGlobalActiveComputation(prevComputation);
    }
  }

  get(): T {
    if (this._node.dirty) {
      this.recompute();
    }
    trackNode(this._node);
    return this._node.cached;
  }

  subscribe(fn: Subscriber): () => void {
    return subscribe(this._node, fn);
  }

  unsubscribe(fn: Subscriber): void {
    unsubscribe(this._node, fn);
  }

  getSubscriberCount(): number {
    return this._node.subscribers.size;
  }

  isDirty(): boolean {
    return this._node.dirty;
  }

  peek(): T {
    if (this._node.dirty) {
      this.recompute();
    }
    return this._node.cached;
  }

  get version(): number {
    return this._node.version;
  }
}

export function derived<T>(
  path: PathKey,
  fn: () => T,
  options?: DerivedOptions,
): Derived<T> {
  return new Derived(path, fn, options);
}
