import {
  Subscriber,
  getGlobalActiveComputation,
  setGlobalActiveComputation,
  generateId,
} from "./dependency";
import { PathKey, path, matchesPath, isPathKey } from "./path";
import { getSairinConfig, getSairinLogger } from "./config";

export {
  getGlobalActiveComputation,
  setGlobalActiveComputation,
} from "./dependency";
export type { Subscriber } from "./dependency";
export type ReactiveKind = "signal" | "derived" | "effect";

export interface ReactiveNode {
  readonly path: PathKey;
  readonly kind: ReactiveKind;
  version: number;
  subscribers: Set<Subscriber>;
}

export interface SignalNode<T> extends ReactiveNode {
  kind: "signal";
  value: T;
}

export interface DerivedNode<T> extends ReactiveNode {
  kind: "derived";
  compute: () => T;
  cached: T;
  dirty: boolean;
}

export interface EffectNode extends ReactiveNode {
  kind: "effect";
  fn: () => void | (() => void);
  cleanup: (() => void) | void;
  disposed: boolean;
}

const nodeRegistry = new Map<string, ReactiveNode>();

function pathToString(p: PathKey): string {
  return p.raw;
}

export function getOrCreateNode<T>(
  p: PathKey,
  kind: ReactiveKind,
): ReactiveNode {
  const key = pathToString(p);
  let node = nodeRegistry.get(key);

  if (!node) {
    node = createNode(p, kind) as ReactiveNode;
    nodeRegistry.set(key, node);
  }

  // If an existing node is found, ensure its kind matches the requested kind.
  if (node.kind !== kind) {
    throw new TypeError(
      `Node kind mismatch for path "${key}": existing=${node.kind} requested=${kind}`,
    );
  }

  return node;
}

function createNode<T>(
  p: PathKey,
  kind: ReactiveKind,
): SignalNode<T> | DerivedNode<T> | EffectNode {
  const node: ReactiveNode = {
    path: p,
    kind,
    version: 0,
    subscribers: new Set(),
  };

  if (kind === "signal") {
    return {
      ...node,
      kind: "signal",
      value: undefined as unknown as T,
    };
  }

  if (kind === "derived") {
    return {
      ...node,
      kind: "derived",
      compute: undefined as unknown as () => T,
      cached: undefined as unknown as T,
      dirty: true,
    };
  }

  return {
    ...node,
    kind: "effect",
    fn: undefined as unknown as () => void | (() => void),
    cleanup: undefined,
    disposed: false,
  };
}

export function getNode(p: PathKey): ReactiveNode | undefined {
  return nodeRegistry.get(pathToString(p));
}

export function hasNode(p: PathKey): boolean {
  return nodeRegistry.has(pathToString(p));
}

export function deleteNode(p: PathKey): boolean {
  return nodeRegistry.delete(pathToString(p));
}

export function getAllNodes(): Iterable<ReactiveNode> {
  return nodeRegistry.values();
}

export function getNodesUnder(prefix: PathKey): ReactiveNode[] {
  const result: ReactiveNode[] = [];
  const prefixStr = prefix.raw;

  for (const node of nodeRegistry.values()) {
    // Handle root "/" specially: all paths start with "/"
    const isExactMatch = node.path.raw === prefixStr;
    const hasProperPrefix =
      prefixStr === "/"
        ? node.path.raw.startsWith("/")
        : node.path.raw.startsWith(prefixStr + "/");
    if (isExactMatch || hasProperPrefix || matchesPath(prefix, node.path)) {
      result.push(node);
    }
  }

  return result;
}

export function subscribe(node: ReactiveNode, fn: Subscriber): () => void {
  node.subscribers.add(fn);
  return () => {
    node.subscribers.delete(fn);
  };
}

export function unsubscribe(node: ReactiveNode, fn: Subscriber): void {
  node.subscribers.delete(fn);
}

export function notifySubscribers(node: ReactiveNode): void {
  node.version++;
  for (const fn of node.subscribers) {
    fn();
  }
}

export function watch(
  pattern: PathKey,
  callback: (path: PathKey, kind: ReactiveKind) => void,
): () => void {
  const nodeHandlers: Map<ReactiveNode, Set<() => void>> = new Map();

  const checkAndSubscribe = (node: ReactiveNode) => {
    if (matchesPath(pattern, node.path)) {
      const handler = () => callback(node.path, node.kind);
      node.subscribers.add(handler);
      const handlers = nodeHandlers.get(node);
      if (handlers) {
        handlers.add(handler);
      } else {
        nodeHandlers.set(node, new Set([handler]));
      }
    }
  };

  for (const node of nodeRegistry.values()) {
    checkAndSubscribe(node);
  }

  return () => {
    for (const [node, handlers] of nodeHandlers) {
      for (const handler of handlers) {
        node.subscribers.delete(handler);
      }
    }
    nodeHandlers.clear();
  };
}

const aliases = new Map<string, PathKey>();

export function alias(aliasPath: PathKey, targetPath: PathKey): void {
  aliases.set(aliasPath.raw, targetPath);
}

export function resolveAlias(path: PathKey): PathKey | undefined {
  return aliases.get(path.raw);
}

export function unalias(aliasPath: PathKey): boolean {
  return aliases.delete(aliasPath.raw);
}

export function isAlias(path: PathKey): boolean {
  return aliases.has(path.raw);
}

export function trackNode(node: ReactiveNode): void {
  const computation = getGlobalActiveComputation();
  if (computation) {
    // Check for circular dependencies
    const checked = (computation as any).__circularCheck as
      | Set<ReactiveNode>
      | undefined;
    if (!checked) {
      (computation as any).__circularCheck = new Set<ReactiveNode>();
    }
    const nodes = (computation as any).__circularCheck as Set<ReactiveNode>;

    if (nodes.has(node)) {
      const logger = getSairinLogger();
      if (logger) {
        logger.error(`Circular dependency detected: ${node.path.raw}`, {
          tags: ["graph", "cycle"],
        });
      }
      return;
    }

    nodes.add(node);
    subscribe(node, computation);
    // Remove immediately after subscription to allow re-reading the same node
    nodes.delete(node);
  }
}

export function __resetRegistryForTesting(): void {
  nodeRegistry.clear();
  lockedPaths.clear();
  aliases.clear();
  scheduledCleanupNodes.length = 0;
  cleanupScheduled = false;
  cleanupIndex = 0;
}

const lockedPaths = new Map<string, { owner: string; shallow: boolean }>();

export function lock(
  path: PathKey,
  options: { owner: string; shallow?: boolean },
): void {
  const key = path.raw;
  lockedPaths.set(key, {
    owner: options.owner,
    shallow: options.shallow ?? false,
  });
}

export function unlock(path: PathKey): void {
  lockedPaths.delete(path.raw);
}

export function isLocked(path: PathKey): boolean {
  const key = path.raw;

  for (const [lockedKey, lock] of lockedPaths) {
    if (lock.shallow) {
      if (key === lockedKey) return true;
    } else {
      if (key.startsWith(lockedKey + "/") || key === lockedKey) return true;
    }
  }
  return false;
}

export function checkLock(path: PathKey, owner: string): boolean {
  const key = path.raw;

  for (const [lockedKey, lock] of lockedPaths) {
    if (lock.owner === owner) continue;

    if (lock.shallow) {
      if (key === lockedKey) return false;
    } else {
      if (key.startsWith(lockedKey + "/") || key === lockedKey) return false;
    }
  }
  return true;
}

function handleLockViolation(
  path: PathKey,
  owner: string,
  attemptedOwner?: string,
): void {
  const config = getSairinConfig();
  const logger = getSairinLogger();
  const message = `Lock violation: cannot write to "${path.raw}", owned by different scope${attemptedOwner ? ` (attempted by: ${attemptedOwner})` : ""}`;

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
}

export function assertLock(
  path: PathKey,
  owner: string,
  attemptedOwner?: string,
): boolean {
  if (!checkLock(path, owner)) {
    handleLockViolation(path, owner, attemptedOwner);
    return false;
  }
  return true;
}

let cleanupScheduled = false;
let cleanupIndex = 0;
const scheduledCleanupNodes: ReactiveNode[] = [];
const CLEANUP_CHUNK_SIZE = 10;
const CLEANUP_WARN_THRESHOLD_MS = 100;

export function scheduleIncrementalCleanup(
  nodes: ReactiveNode[],
  options: { chunkSize?: number } = {},
): void {
  const chunkSize = options.chunkSize ?? CLEANUP_CHUNK_SIZE;
  // Accumulate into the shared scheduled buffer so multiple calls
  // before the microtask runs are coalesced.
  scheduledCleanupNodes.push(...nodes);
  const startTime = Date.now();
  const logger = getSairinLogger();

  const cleanupChunk = () => {
    const chunk = scheduledCleanupNodes.slice(
      cleanupIndex,
      cleanupIndex + chunkSize,
    );
    for (const node of chunk) {
      node.subscribers.clear();
      if (node.kind === "derived") {
        (node as any).dirty = true;
        (node as any).cached = undefined;
      }
    }
    cleanupIndex += chunkSize;

    if (cleanupIndex < scheduledCleanupNodes.length) {
      const elapsed = Date.now() - startTime;
      if (elapsed > CLEANUP_WARN_THRESHOLD_MS && logger) {
        logger.warn(
          `Incremental cleanup falling behind: ${elapsed}ms elapsed`,
          { tags: ["memory", "gc"] },
        );
      }
      queueMicrotask(cleanupChunk);
    } else {
      // Finished, reset for next batch
      scheduledCleanupNodes.length = 0;
      cleanupIndex = 0;
      cleanupScheduled = false;
    }
  };

  if (!cleanupScheduled) {
    cleanupScheduled = true;
    queueMicrotask(cleanupChunk);
  }
}

export function capRetainedMemory(nodes: ReactiveNode[]): void {
  for (const node of nodes) {
    node.subscribers.clear();
    if (node.kind === "derived") {
      (node as any).cached = undefined;
      (node as any).dirty = true;
    }
  }
}

export { path, matchesPath, isPathKey, type PathKey } from "./path";
