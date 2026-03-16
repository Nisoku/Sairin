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
  getAllNodes,
  type PathKey,
  type DerivedNode,
  type ReactiveNode,
} from "./graph";
import { generateUniqueId } from "./dependency";

export interface DerivedOptions {
  eager?: boolean;
}

export class Derived<T> {
  readonly id: number;
  readonly path: PathKey;
  private _node: DerivedNode<T>;
  private _tracker: (() => void) | null = null;
  private _sources: Set<ReactiveNode> = new Set();

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
    // Unsubscribe from previous sources using the old tracker
    if (this._tracker) {
      for (const source of this._sources) {
        source.subscribers.delete(this._tracker);
      }
    }
    this._sources.clear();

    const tracker = () => {
      if (!this._node.dirty) {
        this._node.dirty = true;
        notifySubscribers(this._node);
      }
    };

    this._tracker = tracker;

    const prevComputation = getGlobalActiveComputation();

    setGlobalActiveComputation(tracker);

    try {
      this._node.cached = this._node.compute();
      this._node.dirty = false;
    } finally {
      // Collect the sources that were tracked
      const nodes = getAllNodes();
      for (const node of nodes) {
        if (node.subscribers.has(tracker)) {
          this._sources.add(node);
        }
      }
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
