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
    const config = getSairinConfig();
    const pathIsLocked = isLocked(this.path);
    
    if (pathIsLocked) {
      let canWrite = false;
      if (options?.owner) {
        canWrite = checkLock(this.path, options.owner);
      }
      
      if (!canWrite) {
        const logger = getSairinLogger();
        const message = `Lock violation: cannot write to "${this.path.raw}", path is locked${options?.owner ? ` (attempted by: ${options.owner})` : ""}`;
        
        if (logger) {
          if (config.lockViolation === "throw" || config.lockViolation === "warn") {
            logger.error(message, { tags: ["lock", "write"] });
          } else if (config.lockViolation === "silent") {
            logger.debug(message, { tags: ["lock", "write"] });
          }
        } else if (config.lockViolation === "throw") {
          console.error(message);
        } else if (config.lockViolation === "warn") {
          console.warn(message);
        }

        if (config.lockViolation === "throw") {
          throw new Error(message);
        }
        return;
      }
    }
    
    if (Object.is(this._node.value, next)) return;
    this._node.value = next;
    notifySubscribers(this._node);
  }

  update(fn: (value: T) => T): void {
    this.set(fn(this._node.value));
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
  if (
    typeof pathOrInitial === "object" &&
    pathOrInitial !== null &&
    "segments" in pathOrInitial
  ) {
    let path = pathOrInitial as PathKey;
    const resolved = resolveAlias(path);
    if (resolved) {
      path = resolved;
      const existingNode = getNode(path);
      if (existingNode && existingNode.kind === "signal") {
        return new Signal(path, undefined as unknown as T, false);
      }
    }
    return new Signal(path, initial as T, true);
  }
  throw new Error(
    "signal() requires a path as first argument in Sairin",
  );
}

export function isSignal<T>(value: unknown): value is Signal<T> {
  return value instanceof Signal;
}
