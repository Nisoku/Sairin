"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  Derived: () => Derived,
  ReactiveArray: () => ReactiveArray,
  ReactiveMap: () => ReactiveMap,
  Signal: () => Signal,
  SuspenseBoundary: () => SuspenseBoundary,
  __resetRegistryForTesting: () => __resetRegistryForTesting,
  alias: () => alias,
  assertLock: () => assertLock,
  batch: () => batch,
  batched: () => batched,
  bindAttribute: () => bindAttribute,
  bindClass: () => bindClass,
  bindDisabled: () => bindDisabled,
  bindElementSignal: () => bindElementSignal,
  bindEvent: () => bindEvent,
  bindHtml: () => bindHtml,
  bindInputChecked: () => bindInputChecked,
  bindInputValue: () => bindInputValue,
  bindProperty: () => bindProperty,
  bindSelectValue: () => bindSelectValue,
  bindStyle: () => bindStyle,
  bindText: () => bindText,
  bindVisibility: () => bindVisibility,
  capRetainedMemory: () => capRetainedMemory,
  captureGraph: () => captureGraph,
  checkLock: () => checkLock,
  clearGraph: () => clearGraph,
  configureSairin: () => configureSairin,
  createBinding: () => createBinding,
  createContext: () => createContext,
  createContextWithOptions: () => createContextWithOptions,
  createEffect: () => createEffect2,
  createEffectSync: () => createEffectSync,
  createList: () => createList,
  createMap: () => createMap,
  createMemo: () => createMemo,
  createPath: () => path,
  createResource: () => createResource,
  createResourceFromSignal: () => createResourceFromSignal,
  createSignal: () => createSignal,
  createStore: () => createStore,
  deferValue: () => deferValue,
  deferred: () => deferred,
  deleteNode: () => deleteNode,
  derived: () => derived,
  disableDebug: () => disableDebug,
  effect: () => effect,
  effectIdle: () => effectIdle,
  effectSync: () => effectSync,
  enableDebug: () => enableDebug,
  flow: () => flow,
  generateId: () => generateId,
  generateUniqueId: () => generateUniqueId,
  getAllNodes: () => getAllNodes,
  getDebugHooks: () => getDebugHooks,
  getGlobalActiveComputation: () => getGlobalActiveComputation,
  getIsTransition: () => getIsTransition,
  getNode: () => getNode,
  getNodesUnder: () => getNodesUnder,
  getOrCreateNode: () => getOrCreateNode,
  getParentPath: () => getParentPath,
  getSairinConfig: () => getSairinConfig,
  hasNode: () => hasNode,
  hasPendingEffects: () => hasPendingEffects,
  isAlias: () => isAlias,
  isFlushing: () => isFlushing,
  isLocked: () => isLocked,
  isPathKey: () => isPathKey,
  isReactive: () => isReactive,
  isSignal: () => isSignal,
  joinPath: () => joinPath,
  lock: () => lock,
  matchesPath: () => matchesPath,
  notifyDerivedInvalidated: () => notifyDerivedInvalidated,
  notifyEffectCreated: () => notifyEffectCreated,
  notifyEffectRun: () => notifyEffectRun,
  notifySignalCreated: () => notifySignalCreated,
  notifySignalRead: () => notifySignalRead,
  notifySignalWritten: () => notifySignalWritten,
  notifySubscribers: () => notifySubscribers,
  onCleanup: () => onCleanup,
  onDispose: () => onDispose,
  parallel: () => parallel,
  path: () => path,
  pipeline: () => pipeline,
  race: () => race,
  reactive: () => reactive,
  reactiveArray: () => reactiveArray,
  reactiveMap: () => reactiveMap,
  registerDerived: () => registerDerived,
  registerEffect: () => registerEffect,
  registerSignal: () => registerSignal,
  resolveAlias: () => resolveAlias,
  resource: () => resource,
  resourceWithSignal: () => resourceWithSignal,
  scheduleEffect: () => scheduleEffect,
  scheduleIncrementalCleanup: () => scheduleIncrementalCleanup,
  sequence: () => sequence,
  setGlobalActiveComputation: () => setGlobalActiveComputation,
  setReactive: () => setReactive,
  signal: () => signal,
  startTransition: () => startTransition,
  subscribe: () => subscribe,
  toRaw: () => toRaw,
  trackDependency: () => trackDependency,
  trackNode: () => trackNode,
  unalias: () => unalias,
  unlock: () => unlock,
  unsubscribe: () => unsubscribe,
  untrack: () => untrack,
  untracked: () => untracked,
  updateStore: () => updateStore,
  useContext: () => useContext,
  useContextProvider: () => useContextProvider,
  useDeferred: () => useDeferred,
  useDeferredValue: () => useDeferredValue,
  useTransition: () => useTransition,
  useTransitionResult: () => useTransitionResult,
  watch: () => watch
});
module.exports = __toCommonJS(index_exports);

// src/kernel/dependency.ts
var globalActiveComputation = null;
var globalIdCounter = 0;
function getGlobalActiveComputation() {
  return globalActiveComputation;
}
function setGlobalActiveComputation(computation) {
  globalActiveComputation = computation;
}
function generateId() {
  return ++globalIdCounter;
}
var uniqueIdCounter = 0;
var uniqueIdRandom = Math.random().toString(36).slice(2, 8);
function generateUniqueId() {
  uniqueIdCounter++;
  return `${uniqueIdRandom}${uniqueIdCounter.toString(36)}`;
}
function trackDependency(signal2) {
  if (globalActiveComputation) {
    signal2.subscribe(globalActiveComputation);
  }
}

// src/kernel/path.ts
function serializePath(segments) {
  return "/" + segments.join("/");
}
function path(...parts) {
  const segments = [];
  let globType = "none";
  for (const part of parts) {
    const str = String(part);
    if (str === "*") {
      if (globType === "deep") {
        throw new Error("Cannot use * after ** in path");
      }
      globType = "shallow";
      segments.push("*");
    } else if (str === "**") {
      if (globType === "shallow") {
        throw new Error("Cannot use ** after * in path");
      }
      globType = "deep";
      segments.push("**");
    } else if (str === "") {
      throw new Error("Path segment cannot be empty");
    } else {
      if (str.includes("/")) {
        throw new Error("Path segment cannot contain '/'");
      }
      segments.push(str);
    }
  }
  return {
    segments,
    raw: serializePath(segments),
    isGlob: globType !== "none",
    globType
  };
}
function isPathKey(value) {
  return typeof value === "object" && value !== null && "segments" in value && "raw" in value;
}
function matchesPath(pattern, target) {
  if (pattern.globType === "none") {
    return pattern.raw === target.raw;
  }
  if (pattern.globType === "deep") {
    let match2 = function(pi, ti) {
      if (pi >= p.length && ti >= t.length) return true;
      if (pi >= p.length) return false;
      if (ti >= t.length) {
        if (p[pi] === "**") return match2(pi + 1, ti);
        return false;
      }
      const pSeg = p[pi];
      if (pSeg === "*") {
        return match2(pi + 1, ti + 1);
      }
      if (pSeg === "**") {
        if (match2(pi + 1, ti)) return true;
        return match2(pi, ti + 1);
      }
      if (pSeg === t[ti]) {
        return match2(pi + 1, ti + 1);
      }
      return false;
    };
    var match = match2;
    const p = pattern.segments;
    const t = target.segments;
    return match2(0, 0);
  }
  if (pattern.globType === "shallow") {
    if (pattern.segments.length !== target.segments.length) {
      return false;
    }
    for (let i = 0; i < pattern.segments.length; i++) {
      const pSeg = pattern.segments[i];
      if (pSeg !== "*" && pSeg !== target.segments[i]) {
        return false;
      }
    }
    return true;
  }
  return false;
}
function getParentPath(p) {
  const nonGlobSegments = p.segments.filter((s) => s !== "*" && s !== "**");
  if (nonGlobSegments.length === 0) {
    return null;
  }
  if (nonGlobSegments.length === 1) {
    return path(...nonGlobSegments);
  }
  return path(...nonGlobSegments.slice(0, -1));
}
function joinPath(base, ...parts) {
  const nonGlobSegments = base.segments.filter((s) => s !== "*" && s !== "**");
  return path(...nonGlobSegments, ...parts);
}

// src/kernel/config.ts
var currentConfig = {
  lockViolation: "throw",
  satori: null
};
function configureSairin(config) {
  if (config.lockViolation !== void 0) {
    currentConfig.lockViolation = config.lockViolation;
  }
  if (config.satori !== void 0) {
    currentConfig.satori = config.satori;
  }
}
function getSairinConfig() {
  return currentConfig;
}
function getSairinLogger() {
  if (!currentConfig.satori) {
    return null;
  }
  return currentConfig.satori.createLogger("sairin");
}

// src/kernel/graph.ts
var nodeRegistry = /* @__PURE__ */ new Map();
function pathToString(p) {
  return p.raw;
}
function getOrCreateNode(p, kind) {
  const key = pathToString(p);
  let node = nodeRegistry.get(key);
  if (!node) {
    node = createNode(p, kind);
    nodeRegistry.set(key, node);
  }
  if (node.kind !== kind) {
    throw new TypeError(
      `Node kind mismatch for path "${key}": existing=${node.kind} requested=${kind}`
    );
  }
  return node;
}
function createNode(p, kind) {
  const node = {
    path: p,
    kind,
    version: 0,
    subscribers: /* @__PURE__ */ new Set()
  };
  if (kind === "signal") {
    return {
      ...node,
      kind: "signal",
      value: void 0
    };
  }
  if (kind === "derived") {
    return {
      ...node,
      kind: "derived",
      compute: void 0,
      cached: void 0,
      dirty: true
    };
  }
  return {
    ...node,
    kind: "effect",
    fn: void 0,
    cleanup: void 0,
    disposed: false
  };
}
function getNode(p) {
  return nodeRegistry.get(pathToString(p));
}
function hasNode(p) {
  return nodeRegistry.has(pathToString(p));
}
function deleteNode(p) {
  return nodeRegistry.delete(pathToString(p));
}
function getAllNodes() {
  return nodeRegistry.values();
}
function getNodesUnder(prefix) {
  const result = [];
  const prefixStr = prefix.raw;
  for (const node of nodeRegistry.values()) {
    const isExactMatch = node.path.raw === prefixStr;
    const hasProperPrefix = prefixStr === "/" ? node.path.raw.startsWith("/") : node.path.raw.startsWith(prefixStr + "/");
    if (isExactMatch || hasProperPrefix || matchesPath(prefix, node.path)) {
      result.push(node);
    }
  }
  return result;
}
function subscribe(node, fn) {
  node.subscribers.add(fn);
  return () => {
    node.subscribers.delete(fn);
  };
}
function unsubscribe(node, fn) {
  node.subscribers.delete(fn);
}
function notifySubscribers(node) {
  node.version++;
  for (const fn of node.subscribers) {
    fn();
  }
}
function watch(pattern, callback) {
  const nodeHandlers = /* @__PURE__ */ new Map();
  const checkAndSubscribe = (node) => {
    if (matchesPath(pattern, node.path)) {
      const handler = () => callback(node.path, node.kind);
      node.subscribers.add(handler);
      const handlers = nodeHandlers.get(node);
      if (handlers) {
        handlers.add(handler);
      } else {
        nodeHandlers.set(node, /* @__PURE__ */ new Set([handler]));
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
var aliases = /* @__PURE__ */ new Map();
function alias(aliasPath, targetPath) {
  aliases.set(aliasPath.raw, targetPath);
}
function resolveAlias(path3) {
  return aliases.get(path3.raw);
}
function unalias(aliasPath) {
  return aliases.delete(aliasPath.raw);
}
function isAlias(path3) {
  return aliases.has(path3.raw);
}
function trackNode(node) {
  const computation = getGlobalActiveComputation();
  if (computation) {
    const checked = computation.__circularCheck;
    if (!checked) {
      computation.__circularCheck = /* @__PURE__ */ new Set();
    }
    const nodes = computation.__circularCheck;
    if (nodes.has(node)) {
      const logger = getSairinLogger();
      if (logger) {
        logger.error(`Circular dependency detected: ${node.path.raw}`, {
          tags: ["graph", "cycle"]
        });
      }
      return;
    }
    nodes.add(node);
    subscribe(node, computation);
    nodes.delete(node);
  }
}
function __resetRegistryForTesting() {
  nodeRegistry.clear();
  lockedPaths.clear();
  aliases.clear();
  scheduledCleanupNodes.length = 0;
  cleanupScheduled = false;
  cleanupIndex = 0;
}
var lockedPaths = /* @__PURE__ */ new Map();
function lock(path3, options) {
  const key = path3.raw;
  lockedPaths.set(key, {
    owner: options.owner,
    shallow: options.shallow ?? false
  });
}
function unlock(path3) {
  lockedPaths.delete(path3.raw);
}
function isLocked(path3) {
  const key = path3.raw;
  for (const [lockedKey, lock2] of lockedPaths) {
    if (lock2.shallow) {
      if (key === lockedKey) return true;
    } else {
      if (key.startsWith(lockedKey + "/") || key === lockedKey) return true;
    }
  }
  return false;
}
function checkLock(path3, owner) {
  const key = path3.raw;
  for (const [lockedKey, lock2] of lockedPaths) {
    if (lock2.owner === owner) continue;
    if (lock2.shallow) {
      if (key === lockedKey) return false;
    } else {
      if (key.startsWith(lockedKey + "/") || key === lockedKey) return false;
    }
  }
  return true;
}
function handleLockViolation(path3, owner, attemptedOwner) {
  const config = getSairinConfig();
  const logger = getSairinLogger();
  const message = `Lock violation: cannot write to "${path3.raw}", owned by different scope${attemptedOwner ? ` (attempted by: ${attemptedOwner})` : ""}`;
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
function assertLock(path3, owner, attemptedOwner) {
  if (!checkLock(path3, owner)) {
    handleLockViolation(path3, owner, attemptedOwner);
    return false;
  }
  return true;
}
var cleanupScheduled = false;
var cleanupIndex = 0;
var scheduledCleanupNodes = [];
var CLEANUP_CHUNK_SIZE = 10;
var CLEANUP_WARN_THRESHOLD_MS = 100;
function scheduleIncrementalCleanup(nodes, options = {}) {
  const chunkSize = options.chunkSize ?? CLEANUP_CHUNK_SIZE;
  scheduledCleanupNodes.push(...nodes);
  const startTime = Date.now();
  const logger = getSairinLogger();
  const cleanupChunk = () => {
    const chunk = scheduledCleanupNodes.slice(
      cleanupIndex,
      cleanupIndex + chunkSize
    );
    for (const node of chunk) {
      node.subscribers.clear();
      if (node.kind === "derived") {
        node.dirty = true;
        node.cached = void 0;
      }
    }
    cleanupIndex += chunkSize;
    if (cleanupIndex < scheduledCleanupNodes.length) {
      const elapsed = Date.now() - startTime;
      if (elapsed > CLEANUP_WARN_THRESHOLD_MS && logger) {
        logger.warn(
          `Incremental cleanup falling behind: ${elapsed}ms elapsed`,
          { tags: ["memory", "gc"] }
        );
      }
      queueMicrotask(cleanupChunk);
    } else {
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
function capRetainedMemory(nodes) {
  for (const node of nodes) {
    node.subscribers.clear();
    if (node.kind === "derived") {
      node.cached = void 0;
      node.dirty = true;
    }
  }
}

// src/kernel/signal.ts
var Signal = class {
  id;
  path;
  _node;
  constructor(path3, initial, forceSet = false) {
    this.id = parseInt(generateUniqueId(), 36);
    this.path = path3;
    this._node = getOrCreateNode(path3, "signal");
    if (forceSet || initial !== void 0) {
      this._node.value = initial;
    }
  }
  get() {
    trackNode(this._node);
    return this._node.value;
  }
  set(next, options) {
    const pathIsLocked = isLocked(this.path);
    if (pathIsLocked) {
      const attempted = options?.owner ?? "";
      if (!assertLock(this.path, attempted, attempted)) return;
    }
    if (Object.is(this._node.value, next)) return;
    this._node.value = next;
    notifySubscribers(this._node);
  }
  update(fn, options) {
    this.set(fn(this._node.value), options);
  }
  subscribe(fn) {
    return subscribe(this._node, fn);
  }
  unsubscribe(fn) {
    unsubscribe(this._node, fn);
  }
  getSubscriberCount() {
    return this._node.subscribers.size;
  }
  peek() {
    return this._node.value;
  }
  get version() {
    return this._node.version;
  }
};
function signal(pathOrInitial, initial) {
  if (isPathKey(pathOrInitial)) {
    let path3 = pathOrInitial;
    const resolved = resolveAlias(path3);
    if (resolved) {
      path3 = resolved;
    }
    const existingNode = getNode(path3);
    if (existingNode && existingNode.kind === "signal") {
      return new Signal(path3, existingNode.value, false);
    }
    return new Signal(path3, initial, true);
  }
  throw new Error("signal() requires a path as first argument in Sairin");
}
function isSignal(value) {
  return value instanceof Signal;
}

// src/kernel/derived.ts
var Derived = class {
  id;
  path;
  _node;
  _tracker = null;
  _sources = /* @__PURE__ */ new Set();
  constructor(path3, fn, options = {}) {
    this.id = parseInt(generateUniqueId(), 36);
    this.path = path3;
    this._node = getOrCreateNode(path3, "derived");
    this._node.compute = fn;
    if (options.eager) {
      this.recompute();
    }
  }
  recompute() {
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
      const nodes = getAllNodes();
      for (const node of nodes) {
        if (node.subscribers.has(tracker)) {
          this._sources.add(node);
        }
      }
      setGlobalActiveComputation(prevComputation);
    }
  }
  get() {
    if (this._node.dirty) {
      this.recompute();
    }
    trackNode(this._node);
    return this._node.cached;
  }
  subscribe(fn) {
    return subscribe(this._node, fn);
  }
  unsubscribe(fn) {
    unsubscribe(this._node, fn);
  }
  getSubscriberCount() {
    return this._node.subscribers.size;
  }
  isDirty() {
    return this._node.dirty;
  }
  peek() {
    if (this._node.dirty) {
      this.recompute();
    }
    return this._node.cached;
  }
  get version() {
    return this._node.version;
  }
};
function derived(path3, fn, options) {
  return new Derived(path3, fn, options);
}

// src/kernel/batch.ts
var pendingEffects = /* @__PURE__ */ new Set();
var flushScheduled = false;
var flushGeneration = 0;
var batchDepth = 0;
function scheduleEffect(fn) {
  pendingEffects.add(fn);
  if (!flushScheduled) {
    flushScheduled = true;
    const capturedGen = flushGeneration;
    queueMicrotask(() => {
      if (capturedGen !== flushGeneration) return;
      flushScheduled = false;
      const effects = [...pendingEffects];
      pendingEffects.clear();
      effects.forEach((effect2) => effect2());
    });
  }
}
function batch(fn) {
  const previousDepth = batchDepth;
  batchDepth++;
  try {
    fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0 && pendingEffects.size > 0) {
      const effects = [...pendingEffects];
      pendingEffects.clear();
      effects.forEach((effect2) => effect2());
    }
  }
}
function isFlushing() {
  return flushScheduled;
}
function hasPendingEffects() {
  return pendingEffects.size > 0;
}

// src/kernel/effect.ts
var currentEffect = null;
function onCleanup(fn) {
  if (currentEffect) {
    currentEffect.cleanups.push(fn);
  }
}
function runCleanup(cleanups) {
  while (cleanups.length > 0) {
    const fn = cleanups.pop();
    if (fn) fn();
  }
}
function createEffect(fn, schedule) {
  let cleanupFn;
  let disposed = false;
  const logger = getSairinLogger();
  const effectContext = { cleanups: [] };
  const runner = () => {
    if (disposed) return;
    runCleanup(effectContext.cleanups);
    if (typeof cleanupFn === "function") {
      cleanupFn();
    }
    const prev = getGlobalActiveComputation();
    const prevEffect = currentEffect;
    currentEffect = effectContext;
    effectContext.cleanups = [];
    setGlobalActiveComputation(runner);
    try {
      cleanupFn = fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (logger) {
        logger.error(`Effect threw: ${message}`, {
          tags: ["effect", "runtime"]
        });
      }
    } finally {
      setGlobalActiveComputation(prev);
      currentEffect = prevEffect;
    }
  };
  schedule(runner);
  return () => {
    disposed = true;
    runCleanup(effectContext.cleanups);
    if (typeof cleanupFn === "function") {
      cleanupFn();
    }
  };
}
var effect = (fn) => createEffect(fn, scheduleEffect);
var effectSync = (fn) => createEffect(fn, (r) => r());
var effectIdle = (fn) => createEffect(fn, (runner) => {
  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(() => runner());
  } else {
    setTimeout(() => runner(), 0);
  }
});
function untracked(fn) {
  const previousComputation = getGlobalActiveComputation();
  setGlobalActiveComputation(null);
  try {
    return fn();
  } finally {
    setGlobalActiveComputation(previousComputation);
  }
}

// src/kernel/index.ts
function createSignal(path3, value) {
  return new Signal(path3, value);
}
function createMemo(path3, fn, options) {
  return new Derived(path3, fn, options);
}
function createEffect2(fn) {
  return effect(fn);
}
function createEffectSync(fn) {
  return effectSync(fn);
}
function onDispose(fn) {
  onCleanup(fn);
}
function untrack(fn) {
  return untracked(fn);
}
function batched(fn) {
  batch(fn);
}

// src/store/reactive.ts
var storeId = 0;
function nextStoreId() {
  return (++storeId).toString(36);
}
function isObject(value) {
  return value !== null && typeof value === "object";
}
function reactive(obj, basePath) {
  const id = nextStoreId();
  const storePath = isPathKey(basePath) ? basePath.raw : basePath || `store_${id}`;
  const result = {};
  const signal$ = signal(path(storePath, "$"), obj);
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (Array.isArray(value)) {
      const arrSignal = signal(path(storePath, String(key)), value);
      result[key] = new Proxy(arrSignal, {
        get(target, prop) {
          if (prop === "length") return target.get().length;
          if (typeof prop === "number") return target.get()[prop];
          if (prop === "get") return () => target.get();
          return target.get()[prop];
        },
        set(target, prop, newValue) {
          if (prop === "length") {
            const arr = [...target.get()];
            arr.length = newValue;
            target.set(arr);
            return true;
          }
          if (typeof prop === "number") {
            const arr = [...target.get()];
            arr[prop] = newValue;
            target.set(arr);
            return true;
          }
          return false;
        }
      });
    } else if (isObject(value)) {
      result[key] = reactive(value, path(storePath, String(key)));
    } else {
      result[key] = signal(path(storePath, String(key)), value);
    }
  }
  result.$ = signal$;
  result.$raw = obj;
  const proxy = new Proxy(result, {
    get(target, prop) {
      if (prop === "$") return target.$;
      if (prop === "$raw") return target.$raw;
      return target[prop];
    },
    set(target, prop, newValue) {
      if (prop === "$" || prop === "$raw") {
        throw new Error("Cannot set $ or $raw directly");
      }
      const existingProp = target[prop];
      if (existingProp && existingProp instanceof Signal) {
        existingProp.set(newValue);
      } else if (isObject(newValue) && newValue !== null) {
        const parentSegments = target.$.path.segments;
        const childPath = path(...parentSegments, String(prop));
        target[prop] = reactive(newValue, childPath);
      } else {
        const parentSegments = target.$.path.segments;
        target[prop] = signal(path(...parentSegments, String(prop)), newValue);
      }
      return true;
    }
  });
  return proxy;
}
function isReactive(value) {
  return isObject(value) && "$" in value && value.$ instanceof Signal;
}
function toRaw(reactiveObj) {
  return reactiveObj.$raw;
}
function setReactive(reactiveObj, value) {
  for (const key of Object.keys(value)) {
    const propSignal = reactiveObj[key];
    if (propSignal && propSignal instanceof Signal) {
      propSignal.set(value[key]);
    }
  }
  reactiveObj.$.set(value);
}

// src/store/array.ts
var arrayId = 0;
function nextArrayId() {
  return (++arrayId).toString(36);
}
var ReactiveArray = class {
  id;
  itemsSignal;
  lengthSignal;
  subscribers = /* @__PURE__ */ new Set();
  constructor(initial = []) {
    this.id = nextArrayId();
    this.itemsSignal = signal(path("array", this.id, "items"), initial);
    this.lengthSignal = signal(
      path("array", this.id, "length"),
      initial.length
    );
  }
  notify() {
    for (const fn of this.subscribers) {
      fn();
    }
  }
  update(fn) {
    const newItems = fn(this.itemsSignal.peek());
    this.itemsSignal.set(newItems);
    this.lengthSignal.set(newItems.length);
    this.notify();
  }
  get length() {
    return this.lengthSignal.get();
  }
  get(index) {
    const items = this.itemsSignal.get();
    return items[index];
  }
  set(index, value) {
    const items = [...this.itemsSignal.peek()];
    items[index] = value;
    this.itemsSignal.set(items);
    this.lengthSignal.set(items.length);
    this.notify();
  }
  push(...values) {
    this.update((arr) => [...arr, ...values]);
    return this.lengthSignal.get();
  }
  pop() {
    let result;
    this.update((arr) => {
      result = arr[arr.length - 1];
      return arr.slice(0, -1);
    });
    return result;
  }
  shift() {
    let result;
    this.update((arr) => {
      result = arr[0];
      return arr.slice(1);
    });
    return result;
  }
  unshift(...values) {
    this.update((arr) => [...values, ...arr]);
    return this.lengthSignal.get();
  }
  clear() {
    this.update(() => []);
  }
  splice(start, deleteCount, ...items) {
    const deleted = [];
    this.update((arr) => {
      const result = [...arr];
      const effectiveDelete = deleteCount === void 0 ? Math.max(0, result.length - start) : deleteCount;
      deleted.push(...result.splice(start, effectiveDelete, ...items));
      return result;
    });
    return deleted;
  }
  filter(predicate) {
    return this.itemsSignal.get().filter(predicate);
  }
  map(fn) {
    return this.itemsSignal.get().map(fn);
  }
  reduce(fn, initial) {
    return this.itemsSignal.get().reduce(fn, initial);
  }
  find(predicate) {
    return this.itemsSignal.get().find(predicate);
  }
  findIndex(predicate) {
    return this.itemsSignal.get().findIndex(predicate);
  }
  includes(searchElement) {
    return this.itemsSignal.get().includes(searchElement);
  }
  indexOf(searchElement) {
    return this.itemsSignal.get().indexOf(searchElement);
  }
  some(predicate) {
    return this.itemsSignal.get().some(predicate);
  }
  every(predicate) {
    return this.itemsSignal.get().every(predicate);
  }
  toArray() {
    return [...this.itemsSignal.get()];
  }
  subscribe(fn) {
    this.subscribers.add(fn);
    return () => {
      this.subscribers.delete(fn);
    };
  }
  unsubscribe(fn) {
    this.subscribers.delete(fn);
  }
  [Symbol.iterator]() {
    return this.itemsSignal.get()[Symbol.iterator]();
  }
};
function reactiveArray(items) {
  return new ReactiveArray(items);
}

// src/store/map.ts
var mapId = 0;
function nextMapId() {
  return (++mapId).toString(36);
}
var ReactiveMap = class {
  id;
  entries = /* @__PURE__ */ new Map();
  keyIds = /* @__PURE__ */ new WeakMap();
  primKeyIds = /* @__PURE__ */ new Map();
  nextKeyId = 0;
  sizeSignal;
  subscribers = /* @__PURE__ */ new Set();
  constructor(initial = []) {
    this.id = nextMapId();
    this.sizeSignal = signal(path("map", this.id, "size"), 0);
    for (const [key, value] of initial) {
      const kid = this.getKeyId(key);
      this.entries.set(key, signal(path("map", this.id, kid), value));
    }
    this.sizeSignal.set(this.entries.size);
  }
  getKeyId(key) {
    if ((typeof key === "object" || typeof key === "function") && key !== null) {
      let id2 = this.keyIds.get(key);
      if (!id2) {
        id2 = (this.nextKeyId++).toString(36);
        this.keyIds.set(key, id2);
      }
      return id2;
    }
    const prim = key;
    let id = this.primKeyIds.get(prim);
    if (!id) {
      id = (this.nextKeyId++).toString(36);
      this.primKeyIds.set(prim, id);
    }
    return id;
  }
  removeKeyId(key) {
    if ((typeof key === "object" || typeof key === "function") && key !== null) {
      this.keyIds.delete(key);
    } else {
      const prim = key;
      this.primKeyIds.delete(prim);
    }
  }
  notify() {
    for (const fn of this.subscribers) {
      fn();
    }
  }
  get(key) {
    this.sizeSignal.get();
    return this.entries.get(key)?.get();
  }
  set(key, value) {
    const existing = this.entries.get(key);
    if (existing) {
      existing.set(value);
    } else {
      const kid = this.getKeyId(key);
      this.entries.set(key, signal(path("map", this.id, kid), value));
      this.sizeSignal.set(this.entries.size);
    }
    this.notify();
  }
  has(key) {
    this.sizeSignal.get();
    return this.entries.has(key);
  }
  delete(key) {
    const result = this.entries.delete(key);
    if (result) {
      this.removeKeyId(key);
      this.sizeSignal.set(this.entries.size);
      this.notify();
    }
    return result;
  }
  clear() {
    for (const key of this.entries.keys()) {
      this.removeKeyId(key);
    }
    this.entries.clear();
    this.sizeSignal.set(0);
    this.notify();
  }
  get size() {
    return this.sizeSignal.get();
  }
  keys() {
    return this.entries.keys();
  }
  values() {
    this.sizeSignal.get();
    function* gen() {
      for (const sig of this.entries.values()) {
        yield sig.get();
      }
    }
    return gen.call(this);
  }
  entriesIterable() {
    this.sizeSignal.get();
    function* gen() {
      for (const [key, sig] of this.entries.entries()) {
        yield [key, sig.get()];
      }
    }
    return gen.call(this);
  }
  forEach(fn) {
    this.sizeSignal.get();
    for (const [key, sig] of this.entries.entries()) {
      fn(sig.get(), key, this);
    }
  }
  toArray() {
    this.sizeSignal.get();
    const result = [];
    for (const [key, sig] of this.entries.entries()) {
      result.push([key, sig.get()]);
    }
    return result;
  }
  subscribe(fn) {
    this.subscribers.add(fn);
    return () => {
      this.subscribers.delete(fn);
    };
  }
  unsubscribe(fn) {
    this.subscribers.delete(fn);
  }
  [Symbol.iterator]() {
    return this.entriesIterable();
  }
};
function reactiveMap(entries) {
  return new ReactiveMap(entries);
}

// src/store/index.ts
function createStore(initial) {
  return reactive(initial);
}
function updateStore(store, value) {
  const current = toRaw(store);
  setReactive(store, { ...current, ...value });
}
function createList(items) {
  return reactiveArray(items);
}
function createMap(entries) {
  return reactiveMap(entries);
}

// src/flow/index.ts
var flowId = 0;
function nextFlowId() {
  return (++flowId).toString(36);
}
function flow(fn) {
  const id = nextFlowId();
  const running = signal(path("flow", id, "running"), false);
  const result = signal(path("flow", id, "result"), null);
  const error = signal(path("flow", id, "error"), null);
  let abortController = null;
  let currentPromise = null;
  return {
    running,
    result,
    error,
    start: async () => {
      if (running.peek()) {
        if (currentPromise) {
          await currentPromise;
        }
        return;
      }
      const runController = new AbortController();
      abortController = runController;
      running.set(true);
      error.set(null);
      const perform = async () => {
        try {
          const data = await fn(runController.signal);
          if (!runController.signal.aborted && abortController === runController) {
            result.set(data);
          }
        } catch (e) {
          if (!runController.signal.aborted && abortController === runController) {
            error.set(e instanceof Error ? e : new Error(String(e)));
          }
        } finally {
          if (abortController === runController) {
            running.set(false);
          }
        }
      };
      currentPromise = perform();
      try {
        await currentPromise;
      } catch (e) {
      }
    },
    cancel: () => {
      abortController?.abort();
      running.set(false);
    }
  };
}
function pipeline(fn) {
  const id = nextFlowId();
  const running = signal(path("pipeline", id, "running"), false);
  const result = signal(path("pipeline", id, "result"), null);
  const error = signal(path("pipeline", id, "error"), null);
  let abortController = null;
  let currentPromise = null;
  return {
    running,
    result,
    error,
    start: async (input) => {
      if (running.peek()) {
        if (currentPromise) {
          await currentPromise;
        }
        return;
      }
      const runController = new AbortController();
      abortController = runController;
      running.set(true);
      error.set(null);
      const perform = async () => {
        try {
          const data = await fn(input, runController.signal);
          if (!runController.signal.aborted && abortController === runController) {
            result.set(data);
          }
        } catch (e) {
          if (!runController.signal.aborted && abortController === runController) {
            error.set(e instanceof Error ? e : new Error(String(e)));
          }
        } finally {
          if (abortController === runController) {
            running.set(false);
          }
        }
      };
      currentPromise = perform();
      try {
        await currentPromise;
      } catch (e) {
      }
    },
    cancel: () => {
      abortController?.abort();
      running.set(false);
    }
  };
}
function sequence(...fns) {
  const id = nextFlowId();
  const running = signal(path("sequence", id, "running"), false);
  const results = signal(path("sequence", id, "results"), []);
  const errors = signal(path("sequence", id, "errors"), []);
  let abortController = null;
  return {
    running,
    results,
    errors,
    start: async () => {
      const runController = new AbortController();
      abortController = runController;
      running.set(true);
      const allResults = [];
      const allErrors = [];
      for (const fn of fns) {
        if (runController.signal.aborted) break;
        try {
          const result = await fn(runController.signal);
          allResults.push(result);
        } catch (e) {
          allErrors.push(e instanceof Error ? e : new Error(String(e)));
        }
      }
      if (abortController === runController) {
        results.set(allResults);
        errors.set(allErrors);
        running.set(false);
      }
    },
    cancel: () => {
      abortController?.abort();
      running.set(false);
    }
  };
}
function parallel(...fns) {
  const id = nextFlowId();
  const running = signal(path("parallel", id, "running"), false);
  const results = signal(path("parallel", id, "results"), []);
  const errors = signal(path("parallel", id, "errors"), []);
  let abortController = null;
  return {
    running,
    results,
    errors,
    start: async () => {
      const runController = new AbortController();
      abortController = runController;
      running.set(true);
      const promises = fns.map((fn) => fn(runController.signal));
      const settled = await Promise.allSettled(promises);
      const allResults = [];
      const allErrors = [];
      for (const res of settled) {
        if (res.status === "fulfilled") {
          allResults.push(res.value);
        } else {
          const reason = res.reason;
          allErrors.push(
            reason instanceof Error ? reason : new Error(String(reason))
          );
        }
      }
      if (abortController === runController) {
        results.set(allResults);
        errors.set(allErrors);
        running.set(false);
      }
    },
    cancel: () => {
      abortController?.abort();
      running.set(false);
    }
  };
}
function race(...fns) {
  const id = nextFlowId();
  const running = signal(path("race", id, "running"), false);
  const result = signal(path("race", id, "result"), null);
  const error = signal(path("race", id, "error"), null);
  const winner = signal(path("race", id, "winner"), -1);
  let abortController = null;
  return {
    running,
    result,
    error,
    winner,
    start: async () => {
      const runController = new AbortController();
      abortController = runController;
      running.set(true);
      error.set(null);
      const promises = fns.map(
        (fn, index) => fn(runController.signal).then((value) => ({ index, value })).catch((e) => ({
          index,
          error: e instanceof Error ? e : new Error(String(e))
        }))
      );
      const outcome = await Promise.race(promises);
      if (abortController !== runController) return;
      if ("error" in outcome) {
        error.set(outcome.error);
      } else {
        result.set(outcome.value);
        winner.set(outcome.index);
      }
      abortController?.abort();
      running.set(false);
    },
    cancel: () => {
      abortController?.abort();
      running.set(false);
    }
  };
}

// src/async/resource.ts
var resourceId = 0;
function nextResourceId() {
  return (++resourceId).toString(36);
}
function resource(loader, initialValue = null) {
  const id = nextResourceId();
  const value = signal(path("resource", id, "value"), initialValue);
  const loading = signal(path("resource", id, "loading"), true);
  const error = signal(path("resource", id, "error"), null);
  let abortController = null;
  const load = () => {
    abortController?.abort();
    const currentController = new AbortController();
    abortController = currentController;
    loading.set(true);
    error.set(null);
    loader().then((data) => {
      if (!currentController.signal.aborted && abortController === currentController) {
        value.set(data);
      }
    }).catch((e) => {
      if (!currentController.signal.aborted && abortController === currentController) {
        error.set(e instanceof Error ? e : new Error(String(e)));
      }
    }).finally(() => {
      if (abortController === currentController) {
        loading.set(false);
      }
    });
  };
  load();
  return {
    value,
    loading,
    error,
    refetch: load,
    abort: () => {
      abortController?.abort();
      loading.set(false);
      error.set(null);
    }
  };
}
function resourceWithSignal(source, initialValue = null) {
  const id = nextResourceId();
  const value = signal(path("resource", id, "value"), initialValue);
  const loading = signal(path("resource", id, "loading"), false);
  const error = signal(path("resource", id, "error"), null);
  let abortController = null;
  let currentLoader = null;
  const load = (loader) => {
    abortController?.abort();
    const currentController = new AbortController();
    abortController = currentController;
    currentLoader = loader;
    loading.set(true);
    error.set(null);
    loader().then((data) => {
      if (!currentController.signal.aborted && abortController === currentController && currentLoader === loader) {
        value.set(data);
      }
    }).catch((e) => {
      if (!currentController.signal.aborted && abortController === currentController && currentLoader === loader) {
        error.set(e instanceof Error ? e : new Error(String(e)));
      }
    }).finally(() => {
      if (abortController === currentController && currentLoader === loader) {
        loading.set(false);
      }
    });
  };
  effect(() => {
    const loader = source.get();
    if (loader) {
      load(loader);
    }
  });
  onCleanup(() => {
    abortController?.abort();
  });
  return {
    value,
    loading,
    error,
    refetch: () => {
      const loader = source.get();
      if (loader) load(loader);
    },
    abort: () => {
      abortController?.abort();
      abortController = null;
      loading.set(false);
      error.set(null);
    }
  };
}
var SuspenseBoundary = class {
  id = nextResourceId();
  loading = signal(path("suspense", this.id, "loading"), false);
  error = signal(
    path("suspense", this.id, "error"),
    null
  );
  fallback;
  constructor(config) {
    this.fallback = config.fallback;
  }
  get loadingSignal() {
    return this.loading;
  }
  get errorSignal() {
    return this.error;
  }
  getFallback() {
    return this.fallback;
  }
  showFallback(show) {
    this.loading.set(show);
  }
  handleError(e) {
    this.error.set(e);
  }
};

// src/async/transition.ts
var isTransition = false;
var transitionStack = [];
function startTransition(fn) {
  transitionStack.push(isTransition);
  isTransition = true;
  try {
    fn();
  } finally {
    isTransition = transitionStack.pop() ?? false;
  }
}
function getIsTransition() {
  return isTransition;
}
function useTransition(timeout = 0) {
  const pending = signal(
    path("transition", "pending", generateUniqueId()),
    false
  );
  const start = (fn) => {
    pending.set(true);
    const performTransition = () => {
      try {
        startTransition(fn);
      } finally {
        pending.set(false);
      }
    };
    if (timeout > 0) {
      setTimeout(performTransition, timeout);
    } else {
      queueMicrotask(performTransition);
    }
  };
  return {
    pending,
    start
  };
}
function deferred(value, options = {}) {
  const { timeoutMs = 0, equals = Object.is } = options;
  const deferredValue = signal(
    path("transition", "deferred", generateUniqueId()),
    value.peek()
  );
  const dispose = effect(() => {
    const newValue = value.get();
    if (equals(deferredValue.peek(), newValue)) {
      return;
    }
    if (timeoutMs > 0) {
      setTimeout(() => {
        if (!equals(deferredValue.peek(), newValue)) {
          deferredValue.set(newValue);
        }
      }, timeoutMs);
    } else {
      queueMicrotask(() => {
        if (!equals(deferredValue.peek(), newValue)) {
          deferredValue.set(newValue);
        }
      });
    }
  });
  return { signal: deferredValue, dispose };
}
function useDeferred(value, timeoutMs = 0) {
  let deferredSignal;
  effectSync(() => {
    const result = deferred(value, { timeoutMs });
    deferredSignal = result.signal;
    onCleanup(result.dispose);
  });
  return deferredSignal;
}
function useDeferredValue(value, timeoutMs = 0) {
  if (value instanceof Signal) {
    let deferredSignal2;
    effectSync(() => {
      const result = deferred(value, { timeoutMs });
      deferredSignal2 = result.signal;
      onCleanup(result.dispose);
    });
    return deferredSignal2;
  }
  const sig = signal(
    path("transition", "deferredValue", generateUniqueId()),
    value
  );
  let deferredSignal;
  effectSync(() => {
    const result = deferred(sig, { timeoutMs });
    deferredSignal = result.signal;
    onCleanup(result.dispose);
  });
  return deferredSignal;
}

// src/async/index.ts
function createResource(loader, initialValue) {
  return resource(loader, initialValue ?? null);
}
function createResourceFromSignal(source, initialValue) {
  return resourceWithSignal(source, initialValue ?? null);
}
function useTransitionResult() {
  return useTransition();
}
function deferValue(value, timeoutMs) {
  const sig = new Signal(path("async", "deferred", generateUniqueId()), value);
  return useDeferredValue(sig, timeoutMs);
}

// src/context/index.ts
var contextStacks = /* @__PURE__ */ new Map();
function createContext(defaultValue, name) {
  const contextId = Symbol(name);
  contextStacks.set(contextId, [defaultValue]);
  return {
    defaultValue,
    Provider: ({ value }) => {
      const stack = contextStacks.get(contextId);
      stack.push(value);
      return () => {
        stack.pop();
      };
    },
    consume: () => {
      const stack = contextStacks.get(contextId);
      if (!stack || stack.length === 0) {
        return defaultValue;
      }
      return stack[stack.length - 1];
    }
  };
}
function useContext(context) {
  return context.consume();
}
function useContextProvider(context, value) {
  return context.Provider({ value });
}
function createContextWithOptions(defaultValue, options) {
  return createContext(defaultValue, options?.name);
}

// src/debug/index.ts
var defaultHooks = {
  onSignalCreated: () => {
  },
  onSignalRead: () => {
  },
  onSignalWritten: () => {
  },
  onEffectCreated: () => {
  },
  onEffectRun: () => {
  },
  onDerivedInvalidated: () => {
  }
};
var debugHooks = { ...defaultHooks };
function enableDebug(hooks) {
  debugHooks = { ...defaultHooks, ...hooks };
}
function disableDebug() {
  debugHooks = { ...defaultHooks };
}
function getDebugHooks() {
  return debugHooks;
}
function notifySignalCreated(signal2, name) {
  debugHooks.onSignalCreated?.(signal2, name);
}
function notifySignalRead(signal2) {
  debugHooks.onSignalRead?.(signal2);
}
function notifySignalWritten(signal2, oldValue, newValue) {
  debugHooks.onSignalWritten?.(signal2, oldValue, newValue);
}
function notifyEffectCreated(effect2) {
  debugHooks.onEffectCreated?.(effect2);
}
function notifyEffectRun(effect2) {
  debugHooks.onEffectRun?.(effect2);
}
function notifyDerivedInvalidated(derived2) {
  debugHooks.onDerivedInvalidated?.(derived2);
}
var registeredSignals = /* @__PURE__ */ new Map();
var registeredEffects = /* @__PURE__ */ new Map();
var registeredDerived = /* @__PURE__ */ new Map();
function registerSignal(signal2) {
  registeredSignals.set(signal2.id, signal2);
}
function registerEffect(effect2, id) {
  registeredEffects.set(id, effect2);
}
function registerDerived(derived2) {
  registeredDerived.set(derived2.id, derived2);
}
function captureGraph() {
  const signals = [];
  const effects = [];
  const derived2 = [];
  registeredSignals.forEach((signal2) => {
    signals.push({
      id: signal2.id,
      value: signal2.peek(),
      subscriberCount: signal2.getSubscriberCount()
    });
  });
  registeredEffects.forEach((effect2) => {
    effects.push({
      id: 0,
      dependencies: []
    });
  });
  registeredDerived.forEach((d) => {
    derived2.push({
      id: d.id,
      cached: d.peek(),
      dirty: d.isDirty(),
      dependencies: []
    });
  });
  return { signals, effects, derived: derived2 };
}
function clearGraph() {
  registeredSignals.clear();
  registeredEffects.clear();
  registeredDerived.clear();
}

// src/dom/bindings.ts
function bindText(el, sig) {
  const update = () => {
    const value = sig.get();
    if (el.textContent !== value) {
      el.textContent = value;
    }
  };
  return effect(() => {
    update();
  });
}
function bindHtml(el, sig) {
  return effect(() => {
    const value = sig.get();
    if (el.innerHTML !== value) {
      el.innerHTML = value;
    }
  });
}
function bindAttribute(el, attr, sig) {
  return effect(() => {
    const value = sig.get();
    if (value == null) {
      el.removeAttribute(attr);
    } else {
      el.setAttribute(attr, String(value));
    }
  });
}
function bindProperty(el, prop, sig) {
  return effect(() => {
    const value = sig.get();
    if (el[prop] !== value) {
      el[prop] = value;
    }
  });
}
function bindClass(el, sig) {
  return effect(() => {
    const value = sig.get();
    el.className = value;
  });
}
function bindStyle(el, styleProp, sig) {
  return effect(() => {
    const value = sig.get();
    el.style[styleProp] = value;
  });
}
function bindEvent(el, eventName, handler, options) {
  el.addEventListener(eventName, handler, options);
  return () => {
    el.removeEventListener(eventName, handler, options);
  };
}
function bindInputValue(input, sig) {
  const updateValue = () => {
    const value = sig.get();
    if (input.value !== value) {
      input.value = value;
    }
  };
  const handleInput = (e) => {
    const target = e.target;
    sig.set(target.value);
  };
  updateValue();
  input.addEventListener("input", handleInput);
  return () => {
    input.removeEventListener("input", handleInput);
  };
}
function bindInputChecked(input, sig) {
  const updateChecked = () => {
    input.checked = sig.get();
  };
  const handleChange = () => {
    sig.set(input.checked);
  };
  updateChecked();
  input.addEventListener("change", handleChange);
  return () => {
    input.removeEventListener("change", handleChange);
  };
}
function bindSelectValue(select, sig) {
  const updateValue = () => {
    const value = sig.get();
    if (select.value !== value) {
      select.value = value;
    }
  };
  const handleChange = () => {
    sig.set(select.value);
  };
  updateValue();
  select.addEventListener("change", handleChange);
  return () => {
    select.removeEventListener("change", handleChange);
  };
}
function bindVisibility(el, sig) {
  return effect(() => {
    const visible = sig.get();
    if (visible) {
      el.removeAttribute("hidden");
    } else {
      el.setAttribute("hidden", "");
    }
  });
}
function bindDisabled(el, sig) {
  return effect(() => {
    const disabled = sig.get();
    if (disabled) {
      el.setAttribute("disabled", "");
    } else {
      el.removeAttribute("disabled");
    }
  });
}
function bindElementSignal(el, sig, parent) {
  return effect(() => {
    const target = sig.get();
    if (target === el) {
      if (!parent.contains(el)) {
        parent.appendChild(el);
      }
    }
  });
}
function createBinding(destroyFn) {
  return { destroy: destroyFn };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Derived,
  ReactiveArray,
  ReactiveMap,
  Signal,
  SuspenseBoundary,
  __resetRegistryForTesting,
  alias,
  assertLock,
  batch,
  batched,
  bindAttribute,
  bindClass,
  bindDisabled,
  bindElementSignal,
  bindEvent,
  bindHtml,
  bindInputChecked,
  bindInputValue,
  bindProperty,
  bindSelectValue,
  bindStyle,
  bindText,
  bindVisibility,
  capRetainedMemory,
  captureGraph,
  checkLock,
  clearGraph,
  configureSairin,
  createBinding,
  createContext,
  createContextWithOptions,
  createEffect,
  createEffectSync,
  createList,
  createMap,
  createMemo,
  createPath,
  createResource,
  createResourceFromSignal,
  createSignal,
  createStore,
  deferValue,
  deferred,
  deleteNode,
  derived,
  disableDebug,
  effect,
  effectIdle,
  effectSync,
  enableDebug,
  flow,
  generateId,
  generateUniqueId,
  getAllNodes,
  getDebugHooks,
  getGlobalActiveComputation,
  getIsTransition,
  getNode,
  getNodesUnder,
  getOrCreateNode,
  getParentPath,
  getSairinConfig,
  hasNode,
  hasPendingEffects,
  isAlias,
  isFlushing,
  isLocked,
  isPathKey,
  isReactive,
  isSignal,
  joinPath,
  lock,
  matchesPath,
  notifyDerivedInvalidated,
  notifyEffectCreated,
  notifyEffectRun,
  notifySignalCreated,
  notifySignalRead,
  notifySignalWritten,
  notifySubscribers,
  onCleanup,
  onDispose,
  parallel,
  path,
  pipeline,
  race,
  reactive,
  reactiveArray,
  reactiveMap,
  registerDerived,
  registerEffect,
  registerSignal,
  resolveAlias,
  resource,
  resourceWithSignal,
  scheduleEffect,
  scheduleIncrementalCleanup,
  sequence,
  setGlobalActiveComputation,
  setReactive,
  signal,
  startTransition,
  subscribe,
  toRaw,
  trackDependency,
  trackNode,
  unalias,
  unlock,
  unsubscribe,
  untrack,
  untracked,
  updateStore,
  useContext,
  useContextProvider,
  useDeferred,
  useDeferredValue,
  useTransition,
  useTransitionResult,
  watch
});
//# sourceMappingURL=index.js.map