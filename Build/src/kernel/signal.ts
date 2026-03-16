import {
  Subscriber,
  trackNode,
  subscribe,
  unsubscribe,
  notifySubscribers,
  getOrCreateNode,
  getNode,
  isLocked,
  checkLock,
  resolveAlias,
  hasNode,
  assertLock,
  isPathKey,
  type PathKey,
  type SignalNode,
} from "./graph";
import { generateUniqueId } from "./dependency";
import { getSairinConfig, getSairinLogger } from "./config";

export class Signal<T> {
  readonly id: number;
  readonly path: PathKey;
  private _node: SignalNode<T>;

  constructor(path: PathKey, initial: T, forceSet = false) {
    this.id = parseInt(generateUniqueId(), 36);
    this.path = path;
    this._node = getOrCreateNode(path, "signal") as SignalNode<T>;
    if (forceSet || initial !== undefined) {
      this._node.value = initial;
    }
  }

  get(): T {
    trackNode(this._node);
    return this._node.value;
  }

  set(next: T, options?: { owner?: string }): void {
    const pathIsLocked = isLocked(this.path);
    if (pathIsLocked) {
      // Use centralized assertLock which will log/throw according to config
      const attempted = options?.owner ?? "";
      if (!assertLock(this.path, attempted, attempted)) return;
    }

    if (Object.is(this._node.value, next)) return;
    this._node.value = next;
    notifySubscribers(this._node);
  }

  update(fn: (value: T) => T, options?: { owner?: string }): void {
    this.set(fn(this._node.value), options);
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

  peek(): T {
    return this._node.value;
  }

  get version(): number {
    return this._node.version;
  }
}

export function signal<T>(pathOrInitial: PathKey | T, initial?: T): Signal<T> {
  if (isPathKey(pathOrInitial)) {
    let path = pathOrInitial as PathKey;
    const resolved = resolveAlias(path);
    if (resolved) {
      path = resolved;
    }
    // Check for existing signal node and return it if found
    const existingNode = getNode(path);
    if (existingNode && existingNode.kind === "signal") {
      return new Signal(path, (existingNode as any).value, false);
    }
    return new Signal(path, initial as T, true);
  }
  throw new Error("signal() requires a path as first argument in Sairin");
}

export function isSignal<T>(value: unknown): value is Signal<T> {
  return value instanceof Signal;
}
