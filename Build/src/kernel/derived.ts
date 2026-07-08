import {
  Subscriber,
  getGlobalActiveComputation,
  setGlobalActiveComputation,
  trackNode,
  subscribe,
  unsubscribe,
  notifySubscribers,
  getOrCreateNode,
  getAllNodes,
  isPathKey,
  type PathKey,
  type DerivedNode,
  type ReactiveNode,
} from "./graph";
import { generateUniqueId } from "./dependency";
import { path } from "./path";

export interface DerivedOptions {
  eager?: boolean;
}

export class Derived<T> {
  readonly id: number;
  readonly path: PathKey;
  private _node: DerivedNode<T>;
  private _tracker: (() => void) | null = null;
  private _sources: Set<ReactiveNode> = new Set();
  private _isComputing = false;

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

    this._isComputing = true;
    let trackerInitialized = false;
    const trackedVersions = new Map<ReactiveNode, number>();
    const tracker = () => {
      if (this._isComputing || !trackerInitialized) return;
      for (const [source, prevVersion] of trackedVersions) {
        if (source.version !== prevVersion) {
          if (!this._node.dirty) {
            this._node.dirty = true;
            notifySubscribers(this._node);
          }
          return;
        }
      }
    };

    this._tracker = tracker;

    const prevComputation = getGlobalActiveComputation();

    setGlobalActiveComputation(tracker);

    try {
      this._node.cached = this._node.compute();
      this._node.dirty = false;
    } finally {
      // Collect the sources that were tracked and capture their versions
      const nodes = getAllNodes();
      const newSources: ReactiveNode[] = [];
      for (const node of nodes) {
        if (node.subscribers.has(tracker)) {
          newSources.push(node);
          trackedVersions.set(node, node.version);
        }
      }
      trackerInitialized = true;
      this._isComputing = false;
      // Now add to _sources
      for (const node of newSources) {
        this._sources.add(node);
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

  map<U>(fn: (value: T) => U): Derived<U> {
    return derived(path(...this.path.segments, `$map${++mapSeq}`), () =>
      fn(this.get()),
    );
  }

  pipe(...fns: Array<(v: unknown) => unknown>): Derived<unknown> {
    return this.map((v) => fns.reduce((acc, fn) => fn(acc), v as unknown));
  }
}

let mapSeq = 0;

export function derived<T>(
  path: PathKey,
  fn: () => T,
  options?: DerivedOptions,
): Derived<T> {
  if (!isPathKey(path)) {
    throw new Error(
      `derived() requires a valid PathKey as first argument. Got ${typeof path}. Use path(...) to create a path.`,
    );
  }
  return new Derived(path, fn, options);
}
