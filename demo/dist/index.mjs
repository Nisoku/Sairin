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
      if (pi >= p2.length && ti >= t.length) return true;
      if (pi >= p2.length) return false;
      if (ti >= t.length) {
        if (p2[pi] === "**") return match2(pi + 1, ti);
        return false;
      }
      const pSeg = p2[pi];
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
    const p2 = pattern.segments;
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
function getParentPath(p2) {
  const nonGlobSegments = p2.segments.filter((s) => s !== "*" && s !== "**");
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

// node_modules/@nisoku/satori/dist/satori.mjs
var M = class {
  constructor(e) {
    this.config = e;
  }
  eventTimestamps = [];
  buffer = [];
  droppedCount = 0;
  sampledCount = 0;
  /**
   * Check if an event should be allowed through
   * Returns: { allowed: boolean, sampled?: boolean }
   */
  shouldAllow(e) {
    if (!this.config.enabled)
      return { allowed: true, sampled: false };
    const t = Date.now();
    if (this.eventTimestamps = this.eventTimestamps.filter((r) => t - r < 1e3), this.eventTimestamps.length < this.config.maxEventsPerSecond)
      return this.eventTimestamps.push(t), { allowed: true, sampled: false };
    switch (this.config.strategy) {
      case "drop":
        return this.droppedCount++, { allowed: false, sampled: false };
      case "sample":
        return Math.random() < this.config.samplingRate ? (this.eventTimestamps.push(t), this.sampledCount++, { allowed: true, sampled: true }) : (this.droppedCount++, { allowed: false, sampled: false });
      case "buffer":
        return this.buffer.length < (this.config.bufferSize || 100) ? this.buffer.push(e) : this.droppedCount++, { allowed: false, sampled: false };
      default:
        return { allowed: true, sampled: false };
    }
  }
  /**
   * Get buffered events and clear the buffer
   */
  flushBuffer() {
    const e = [...this.buffer];
    return this.buffer = [], e;
  }
  /**
   * Get current rate (events per second)
   */
  getCurrentRate() {
    const e = Date.now();
    return this.eventTimestamps = this.eventTimestamps.filter((t) => e - t < 1e3), this.eventTimestamps.length;
  }
  /**
   * Get statistics
   */
  getStats() {
    return {
      dropped: this.droppedCount,
      sampled: this.sampledCount,
      buffered: this.buffer.length,
      currentRate: this.getCurrentRate()
    };
  }
  /**
   * Reset statistics
   */
  reset() {
    this.eventTimestamps = [], this.buffer = [], this.droppedCount = 0, this.sampledCount = 0;
  }
  /**
   * Update configuration
   */
  updateConfig(e) {
    this.config = { ...this.config, ...e };
  }
};
function g(s, e, t = /* @__PURE__ */ new WeakMap()) {
  if (s === e) return true;
  if (typeof s == "number" && typeof e == "number")
    return Number.isNaN(s) && Number.isNaN(e) ? true : s === e;
  if (s === null || e === null || s === void 0 || e === void 0) return s === e;
  if (typeof s != typeof e || typeof s != "object") return false;
  const i = s, r = e;
  if (t.has(i))
    return t.get(i) === r;
  if (t.set(i, r), s instanceof Date && e instanceof Date)
    return s.getTime() === e.getTime();
  if (s instanceof Date || e instanceof Date) return false;
  if (s instanceof RegExp && e instanceof RegExp)
    return s.source === e.source && s.flags === e.flags;
  if (s instanceof RegExp || e instanceof RegExp) return false;
  if (s instanceof Map && e instanceof Map) {
    if (s.size !== e.size) return false;
    for (const [c, l] of s)
      if (!e.has(c) || !g(l, e.get(c), t)) return false;
    return true;
  }
  if (s instanceof Map || e instanceof Map) return false;
  if (s instanceof Set && e instanceof Set) {
    if (s.size !== e.size) return false;
    const c = Array.from(s), l = Array.from(e);
    for (const u of c) {
      let d = false;
      for (const h of l)
        if (g(u, h, t)) {
          d = true;
          break;
        }
      if (!d) return false;
    }
    return true;
  }
  if (s instanceof Set || e instanceof Set) return false;
  if (Array.isArray(s) && Array.isArray(e)) {
    if (s.length !== e.length) return false;
    const c = Object.keys(s).filter((h) => /^\d+$/.test(h)).map(Number), l = Object.keys(e).filter((h) => /^\d+$/.test(h)).map(Number);
    if (c.length !== l.length) return false;
    for (const h of c)
      if (!l.includes(h)) return false;
    for (let h = 0; h < s.length; h++) {
      const T = Object.prototype.hasOwnProperty.call(s, h), $ = Object.prototype.hasOwnProperty.call(e, h);
      if (T !== $ || T && !g(s[h], e[h], t)) return false;
    }
    const u = Object.keys(s).filter((h) => !/^\d+$/.test(h)), d = Object.keys(e).filter((h) => !/^\d+$/.test(h));
    if (u.length !== d.length) return false;
    for (const h of u)
      if (!Object.prototype.hasOwnProperty.call(e, h) || !g(s[h], e[h], t)) return false;
    return true;
  }
  if (Array.isArray(s) !== Array.isArray(e)) return false;
  const n = s, o = e, a = Object.keys(n), f = Object.keys(o);
  if (a.length !== f.length) return false;
  for (const c of a)
    if (!Object.prototype.hasOwnProperty.call(o, c) || !g(n[c], o[c], t)) return false;
  return true;
}
function p(s, e = /* @__PURE__ */ new WeakMap()) {
  if (s == null || typeof s != "object") return s;
  const t = s;
  if (e.has(t))
    return e.get(t);
  if (s instanceof Date)
    return new Date(s.getTime());
  if (s instanceof RegExp)
    return new RegExp(s.source, s.flags);
  if (s instanceof Map) {
    const r = /* @__PURE__ */ new Map();
    e.set(t, r);
    for (const [n, o] of s)
      r.set(p(n, e), p(o, e));
    return r;
  }
  if (s instanceof Set) {
    const r = /* @__PURE__ */ new Set();
    e.set(t, r);
    for (const n of s)
      r.add(p(n, e));
    return r;
  }
  if (Array.isArray(s)) {
    const r = [];
    e.set(t, r);
    for (let n = 0; n < s.length; n++)
      Object.prototype.hasOwnProperty.call(s, n) && (r[n] = p(s[n], e));
    for (const n of Object.keys(s))
      /^\d+$/.test(n) || (r[n] = p(s[n], e));
    return r;
  }
  const i = {};
  e.set(t, i);
  for (const r of Object.keys(s))
    i[r] = p(s[r], e);
  return i;
}
function b(s, e = /* @__PURE__ */ new WeakSet()) {
  return s === null ? "null" : s === void 0 ? "undefined" : typeof s == "string" ? `s:${s}` : typeof s == "number" ? Number.isNaN(s) ? "n:NaN" : `n:${s}` : typeof s == "boolean" ? `b:${s}` : typeof s != "object" ? String(s) : e.has(s) ? "[Circular]" : (e.add(s), s instanceof Date ? `d:${s.getTime()}` : s instanceof RegExp ? `r:${s.source}:${s.flags}` : s instanceof Map ? `m:{${Array.from(s.entries()).map(([r, n]) => `${b(r, e)}=>${b(n, e)}`).sort().join(",")}}` : s instanceof Set ? `set:{${Array.from(s).map((r) => b(r, e)).sort().join(",")}}` : Array.isArray(s) ? `a:[${s.map((r, n) => Object.prototype.hasOwnProperty.call(s, n) ? b(r, e) : "<empty>").join(",")}]` : `o:{${Object.entries(s).sort(([i], [r]) => i.localeCompare(r)).map(([i, r]) => `${i}:${b(r, e)}`).join(",")}}`);
}
var F = class {
  constructor(e) {
    this.config = e;
  }
  cache = /* @__PURE__ */ new Map();
  deduplicatedCount = 0;
  /**
   * Compute a deduplication key for an entry based on configured fields
   */
  computeDedupKey(e) {
    const t = [];
    for (const i of this.config.fields)
      switch (i) {
        case "message":
          t.push(`m:${e.message}`);
          break;
        case "scope":
          t.push(`s:${e.scope}`);
          break;
        case "level":
          t.push(`l:${e.level}`);
          break;
        case "tags":
          t.push(`t:${e.tags.sort().join(",")}`);
          break;
        case "state":
          e.state && t.push(`st:${b(e.state)}`);
          break;
      }
    return t.join("|");
  }
  /**
   * Check if an event is a duplicate
   * Returns: { isDuplicate: boolean, originalId?: string, duplicateCount: number }
   */
  isDuplicate(e) {
    if (!this.config.enabled)
      return { isDuplicate: false, duplicateCount: 0 };
    const t = Date.now(), i = this.computeDedupKey(e);
    this.cleanExpired(t);
    const r = this.cache.get(i);
    return r && t - r.timestamp < this.config.windowMs ? (r.count++, this.deduplicatedCount++, { isDuplicate: true, duplicateCount: r.count }) : (this.cache.set(i, {
      hash: i,
      timestamp: t,
      count: 1
    }), this.cache.size > this.config.maxCacheSize && this.evictOldest(), { isDuplicate: false, duplicateCount: 1 });
  }
  /**
   * Clean expired entries from cache
   */
  cleanExpired(e) {
    for (const [t, i] of this.cache.entries())
      e - i.timestamp >= this.config.windowMs && this.cache.delete(t);
  }
  /**
   * Evict oldest entries when cache is full
   */
  evictOldest() {
    let e = null, t = 1 / 0;
    for (const [i, r] of this.cache.entries())
      r.timestamp < t && (t = r.timestamp, e = i);
    e && this.cache.delete(e);
  }
  /**
   * Get statistics
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      deduplicatedCount: this.deduplicatedCount
    };
  }
  /**
   * Reset the deduplicator
   */
  reset() {
    this.cache.clear(), this.deduplicatedCount = 0;
  }
  /**
   * Update configuration
   */
  updateConfig(e) {
    this.config = { ...this.config, ...e };
  }
};
var I = class {
  constructor(e, t = {}) {
    this.config = e, this.events = t;
  }
  state = "closed";
  failureCount = 0;
  successCount = 0;
  lastFailureTime = 0;
  totalFailures = 0;
  totalSuccesses = 0;
  /**
   * Execute a function with circuit breaker protection
   */
  async execute(e) {
    if (!this.config.enabled)
      return e();
    if (!this.canExecute())
      throw new L("Circuit breaker is open");
    try {
      const t = await e();
      return this.recordSuccess(), t;
    } catch (t) {
      throw this.recordFailure(
        t instanceof Error ? t : new Error(String(t))
      ), t;
    }
  }
  /**
   * Execute synchronously with circuit breaker protection
   */
  executeSync(e) {
    if (!this.config.enabled)
      return e();
    if (!this.canExecute())
      throw new L("Circuit breaker is open");
    try {
      const t = e();
      return this.recordSuccess(), t;
    } catch (t) {
      throw this.recordFailure(
        t instanceof Error ? t : new Error(String(t))
      ), t;
    }
  }
  /**
   * Check if execution is allowed
   */
  canExecute() {
    return this.state === "closed" ? true : this.state === "open" ? Date.now() - this.lastFailureTime >= this.config.resetTimeout ? (this.transitionTo("half-open"), true) : false : true;
  }
  /**
   * Record a successful execution
   */
  recordSuccess() {
    this.totalSuccesses++, this.events.onSuccess?.(this.successCount + 1), this.state === "half-open" ? (this.successCount++, this.successCount >= this.config.successThreshold && this.transitionTo("closed")) : this.state === "closed" && (this.failureCount = 0);
  }
  /**
   * Record a failed execution
   */
  recordFailure(e) {
    this.totalFailures++, this.failureCount++, this.lastFailureTime = Date.now(), this.events.onFailure?.(e, this.failureCount), this.state === "half-open" ? this.transitionTo("open") : this.state === "closed" && this.failureCount >= this.config.failureThreshold && this.transitionTo("open");
  }
  /**
   * Transition to a new state
   */
  transitionTo(e) {
    const t = this.state;
    this.state = e, e === "closed" ? (this.failureCount = 0, this.successCount = 0, this.events.onClose?.()) : e === "open" ? (this.successCount = 0, this.events.onOpen?.()) : e === "half-open" && (this.successCount = 0, this.events.onHalfOpen?.()), this.events.onStateChange?.(e, t);
  }
  /**
   * Get current state
   */
  getState() {
    return this.state;
  }
  /**
   * Get statistics
   */
  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
      lastFailureTime: this.lastFailureTime
    };
  }
  /**
   * Manually reset the circuit breaker
   */
  reset() {
    this.transitionTo("closed"), this.failureCount = 0, this.successCount = 0, this.totalFailures = 0, this.totalSuccesses = 0, this.lastFailureTime = 0;
  }
  /**
   * Force the circuit open (for testing/manual intervention)
   */
  forceOpen() {
    this.transitionTo("open"), this.lastFailureTime = Date.now();
  }
  /**
   * Force the circuit closed (for testing/manual intervention)
   */
  forceClose() {
    this.transitionTo("closed");
  }
};
var L = class extends Error {
  constructor(e) {
    super(e), this.name = "CircuitOpenError";
  }
};
var C = class {
  startTime;
  totalPublished = 0;
  totalDropped = 0;
  totalSampled = 0;
  totalDeduplicated = 0;
  recentEvents = [];
  loggerCount = 0;
  watcherCount = 0;
  subscriberCount = 0;
  bufferSize = 0;
  circuitState = "closed";
  // For tracking events per second
  eventTimestamps = [];
  // Historical snapshots for trending
  snapshots = [];
  maxSnapshots = 60;
  // Keep last 60 snapshots (e.g., 1 per second = 1 minute)
  constructor() {
    this.startTime = Date.now();
  }
  /**
   * Record a published event
   */
  recordPublished() {
    this.totalPublished++;
    const e = Date.now();
    this.eventTimestamps.push(e), this.eventTimestamps = this.eventTimestamps.filter((t) => e - t < 1e3);
  }
  /**
   * Record a dropped event
   */
  recordDropped() {
    this.totalDropped++;
  }
  /**
   * Record a sampled event
   */
  recordSampled() {
    this.totalSampled++;
  }
  /**
   * Record a deduplicated event
   */
  recordDeduplicated() {
    this.totalDeduplicated++;
  }
  /**
   * Update logger count
   */
  setLoggerCount(e) {
    this.loggerCount = e;
  }
  /**
   * Update watcher count
   */
  setWatcherCount(e) {
    this.watcherCount = e;
  }
  /**
   * Update subscriber count
   */
  setSubscriberCount(e) {
    this.subscriberCount = e;
  }
  /**
   * Update buffer size
   */
  setBufferSize(e) {
    this.bufferSize = e;
  }
  /**
   * Update circuit state
   */
  setCircuitState(e) {
    this.circuitState = e;
  }
  /**
   * Get current events per second
   */
  getEventsPerSecond() {
    const e = Date.now();
    return this.eventTimestamps = this.eventTimestamps.filter((t) => e - t < 1e3), this.eventTimestamps.length;
  }
  /**
   * Get current bus metrics
   */
  getBusMetrics() {
    return {
      totalPublished: this.totalPublished,
      totalDropped: this.totalDropped,
      totalSampled: this.totalSampled,
      totalDeduplicated: this.totalDeduplicated,
      eventsPerSecond: this.getEventsPerSecond(),
      bufferSize: this.bufferSize,
      subscriberCount: this.subscriberCount
    };
  }
  /**
   * Get full Satori metrics
   */
  getMetrics() {
    return {
      bus: this.getBusMetrics(),
      loggerCount: this.loggerCount,
      watcherCount: this.watcherCount,
      circuitState: this.circuitState,
      uptime: Date.now() - this.startTime
    };
  }
  /**
   * Take a snapshot for historical tracking
   */
  takeSnapshot() {
    const e = {
      timestamp: Date.now(),
      bus: this.getBusMetrics(),
      loggerCount: this.loggerCount,
      watcherCount: this.watcherCount,
      circuitState: this.circuitState,
      uptime: Date.now() - this.startTime
    };
    return this.snapshots.push(e), this.snapshots.length > this.maxSnapshots && (this.snapshots = this.snapshots.slice(-this.maxSnapshots)), e;
  }
  /**
   * Get historical snapshots
   */
  getSnapshots() {
    return [...this.snapshots];
  }
  /**
   * Get average events per second over time
   */
  getAverageEventsPerSecond() {
    return this.snapshots.length === 0 ? 0 : this.snapshots.reduce(
      (t, i) => t + i.bus.eventsPerSecond,
      0
    ) / this.snapshots.length;
  }
  /**
   * Reset all metrics
   */
  reset() {
    this.startTime = Date.now(), this.totalPublished = 0, this.totalDropped = 0, this.totalSampled = 0, this.totalDeduplicated = 0, this.eventTimestamps = [], this.snapshots = [];
  }
};
var k = {
  enabled: false,
  maxEventsPerSecond: 1e3,
  samplingRate: 0.1,
  strategy: "sample",
  bufferSize: 100
};
var B = {
  enabled: false,
  windowMs: 5e3,
  fields: ["message", "scope", "level"],
  maxCacheSize: 1e3
};
var E = {
  enabled: false,
  failureThreshold: 5,
  resetTimeout: 3e4,
  successThreshold: 3
};
var y = {
  enableCallsite: true,
  enableEnvInfo: true,
  enableStateSnapshot: false,
  enableCausalLinks: true,
  enableMetrics: true,
  enableConsole: true,
  stateSelectors: [],
  maxBufferSize: 1e3,
  logLevel: "info",
  appVersion: "1.0.0",
  pollingInterval: 250,
  // More reasonable default
  customLevels: [],
  rateLimiting: k,
  deduplication: B,
  circuitBreaker: E
};
var R = class {
  subscribers = [];
  middleware = [];
  buffer = [];
  maxBufferSize;
  rateLimiter;
  deduplicator;
  circuitBreaker;
  metrics;
  enableMetrics;
  constructor(e = {}) {
    typeof e == "number" && (e = { maxBufferSize: e }), this.maxBufferSize = e.maxBufferSize || 1e3, this.enableMetrics = e.enableMetrics ?? true, this.rateLimiter = new M({
      ...k,
      ...e.rateLimiting
    }), this.deduplicator = new F({
      ...B,
      ...e.deduplication
    }), this.circuitBreaker = new I(
      {
        ...E,
        ...e.circuitBreaker
      },
      {
        onStateChange: (t) => {
          this.enableMetrics && this.metrics.setCircuitState(t);
        }
      }
    ), this.metrics = new C();
  }
  publish(e) {
    if (!e.__internal?.isReplay && !e.skipDedup && this.deduplicator.isDuplicate(e).isDuplicate) {
      this.enableMetrics && this.metrics.recordDeduplicated();
      return;
    }
    if (!e.__internal?.isReplay && !e.skipRateLimit) {
      const t = this.rateLimiter.shouldAllow(e);
      if (!t.allowed) {
        this.enableMetrics && this.metrics.recordDropped();
        return;
      }
      t.sampled && (e.__internal = e.__internal || {}, e.__internal.sampled = true, this.enableMetrics && this.metrics.recordSampled());
    }
    try {
      this.circuitBreaker.executeSync(() => {
        this.doPublish(e);
      }), this.enableMetrics && (this.metrics.recordPublished(), this.metrics.setBufferSize(this.buffer.length), this.metrics.setSubscriberCount(this.subscribers.length));
    } catch {
      this.enableMetrics && this.metrics.recordDropped();
    }
  }
  doPublish(e) {
    let t = 0;
    const i = () => {
      if (t >= this.middleware.length) {
        this.subscribers.forEach((n) => n(e)), this.addToBuffer(e);
        return;
      }
      const r = this.middleware[t];
      t++, r(e, i);
    };
    i();
  }
  subscribe(e) {
    return this.subscribers.push(e), this.enableMetrics && this.metrics.setSubscriberCount(this.subscribers.length), () => {
      const t = this.subscribers.indexOf(e);
      t >= 0 && (this.subscribers.splice(t, 1), this.enableMetrics && this.metrics.setSubscriberCount(this.subscribers.length));
    };
  }
  use(e) {
    this.middleware.push(e);
  }
  getReplayBuffer() {
    return [...this.buffer];
  }
  getMetrics() {
    return this.metrics.getBusMetrics();
  }
  /**
   * Get the rate limiter instance for advanced configuration
   */
  getRateLimiter() {
    return this.rateLimiter;
  }
  /**
   * Get the deduplicator instance for advanced configuration
   */
  getDeduplicator() {
    return this.deduplicator;
  }
  /**
   * Get the circuit breaker instance for advanced configuration
   */
  getCircuitBreaker() {
    return this.circuitBreaker;
  }
  /**
   * Clear the event buffer
   */
  clearBuffer() {
    this.buffer.length = 0, this.enableMetrics && this.metrics.setBufferSize(0);
  }
  /**
   * Reset all state
   */
  reset() {
    this.buffer.length = 0, this.middleware.length = 0, this.rateLimiter.reset(), this.deduplicator.reset(), this.circuitBreaker.reset(), this.metrics.reset();
  }
  addToBuffer(e) {
    this.buffer.push(e), this.buffer.length > this.maxBufferSize && this.buffer.shift();
  }
};
var A = 0;
var N = Date.now().toString(36);
function O() {
  return `${N}-${++A}`;
}
function z() {
  return Date.now();
}
function j(s = 2) {
  try {
    const e = new Error().stack;
    if (!e) return;
    const i = e.split(`
`)[s];
    if (!i) return;
    const r = i.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/) || i.match(/at\s+(.+?):(\d+):(\d+)/);
    if (r) {
      const [, n, o, a, f] = r;
      return `${o}:${a}:${f}${n ? ` (${n})` : ""}`;
    }
    return i.trim();
  } catch {
    return;
  }
}
function P() {
  return typeof globalThis < "u" && "Deno" in globalThis ? "deno" : typeof globalThis < "u" && "Bun" in globalThis ? "bun" : typeof globalThis < "u" && "caches" in globalThis && typeof globalThis.caches == "object" && !("window" in globalThis) ? "cloudflare-workers" : typeof globalThis < "u" && "EdgeRuntime" in globalThis ? "edge" : typeof window < "u" && typeof document < "u" ? "browser" : typeof process < "u" && process.versions && process.versions.node ? "node" : "unknown";
}
function V(s) {
  const e = P(), t = {
    platform: e,
    appVersion: s.appVersion
  };
  switch (e) {
    case "browser":
      typeof navigator < "u" && (t.userAgent = navigator.userAgent), typeof window < "u" && (t.url = window.location?.href, typeof document < "u" && (t.referrer = document.referrer));
      break;
    case "node":
      typeof process < "u" && (t.nodeVersion = process.version, t.arch = process.arch, process.env.NODE_ENV && (t.nodeEnv = process.env.NODE_ENV));
      break;
    case "deno":
      try {
        const i = globalThis.Deno;
        i?.version && (t.denoVersion = i.version.deno, t.v8Version = i.version.v8, t.typescriptVersion = i.version.typescript), i?.build && (t.os = i.build.os, t.arch = i.build.arch);
      } catch {
      }
      break;
    case "bun":
      try {
        const i = globalThis.Bun;
        i?.version && (t.bunVersion = i.version), i?.revision && (t.bunRevision = i.revision);
      } catch {
      }
      break;
    case "cloudflare-workers":
      t.runtime = "cloudflare-workers";
      break;
    case "edge":
      try {
        const i = globalThis.EdgeRuntime;
        t.edgeRuntime = i;
      } catch {
      }
      break;
  }
  return t;
}
function _(s) {
  if (!s.stateSelectors || s.stateSelectors.length === 0)
    return;
  const e = {};
  for (let t = 0; t < s.stateSelectors.length; t++) {
    const i = s.stateSelectors[t], r = typeof i == "function" ? i : i.selector, n = typeof i == "function" ? `selector_${t}` : i.name || `selector_${t}`;
    try {
      const o = r();
      o != null && (e[n] = p(o));
    } catch (o) {
      e[`${n}_error`] = o instanceof Error ? o.message : String(o);
    }
  }
  return Object.keys(e).length > 0 ? e : void 0;
}
var W = class {
  nodes = /* @__PURE__ */ new Map();
  scopeLastEvent = /* @__PURE__ */ new Map();
  globalLastEvent;
  maxNodes = 1e4;
  /**
   * Add a new event to the causal graph
   */
  addEvent(e, t, i) {
    const r = {
      eventId: e,
      scope: t,
      timestamp: Date.now(),
      causes: i || [],
      effects: []
    };
    if (i)
      for (const n of i) {
        const o = this.nodes.get(n);
        o && o.effects.push(e);
      }
    this.nodes.set(e, r), this.scopeLastEvent.set(t, e), this.globalLastEvent = e, this.nodes.size > this.maxNodes && this.pruneOldest(Math.floor(this.maxNodes * 0.1));
  }
  /**
   * Get the causal link for a new event
   */
  getCausalLink(e, t) {
    return t || this.scopeLastEvent.get(e) || this.globalLastEvent;
  }
  /**
   * Get all causes (direct and transitive) for an event
   */
  getCauses(e, t = 1 / 0) {
    const i = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ new Set(), n = (o, a) => {
      if (r.has(o) || a > t) return;
      r.add(o);
      const f = this.nodes.get(o);
      if (f)
        for (const c of f.causes)
          i.add(c), n(c, a + 1);
    };
    return n(e, 0), Array.from(i);
  }
  /**
   * Get all effects (direct and transitive) for an event
   */
  getEffects(e, t = 1 / 0) {
    const i = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ new Set(), n = (o, a) => {
      if (r.has(o) || a > t) return;
      r.add(o);
      const f = this.nodes.get(o);
      if (f)
        for (const c of f.effects)
          i.add(c), n(c, a + 1);
    };
    return n(e, 0), Array.from(i);
  }
  /**
   * Get the causal chain from root to an event
   */
  getCausalChain(e) {
    const t = [];
    let i = e;
    const r = /* @__PURE__ */ new Set();
    for (; i && !r.has(i); ) {
      r.add(i), t.unshift(i);
      const n = this.nodes.get(i);
      if (!n || n.causes.length === 0) break;
      i = n.causes[0];
    }
    return t;
  }
  /**
   * Get node information
   */
  getNode(e) {
    return this.nodes.get(e);
  }
  /**
   * Check if two events are causally related
   */
  areCausallyRelated(e, t) {
    const i = this.getCauses(e), r = this.getEffects(e);
    return i.includes(t) || r.includes(t);
  }
  /**
   * Get events in the same scope
   */
  getEventsByScope(e) {
    const t = [];
    for (const [i, r] of this.nodes)
      r.scope === e && t.push(i);
    return t;
  }
  /**
   * Prune oldest nodes to stay within memory limits
   */
  pruneOldest(e) {
    const t = Array.from(this.nodes.entries()).sort(([, i], [, r]) => i.timestamp - r.timestamp).slice(0, e);
    for (const [i] of t) {
      const r = this.nodes.get(i);
      if (r) {
        for (const n of r.causes) {
          const o = this.nodes.get(n);
          o && (o.effects = o.effects.filter((a) => a !== i));
        }
        for (const n of r.effects) {
          const o = this.nodes.get(n);
          o && (o.causes = o.causes.filter((a) => a !== i));
        }
      }
      this.nodes.delete(i);
    }
  }
  /**
   * Clear all causal links
   */
  clear() {
    this.nodes.clear(), this.scopeLastEvent.clear(), this.globalLastEvent = void 0;
  }
  /**
   * Get statistics about the causal graph
   */
  getStats() {
    let e = 0, t = 0;
    for (const r of this.nodes.values())
      e += r.causes.length, t += r.effects.length;
    const i = this.nodes.size || 1;
    return {
      nodeCount: this.nodes.size,
      avgCauses: e / i,
      avgEffects: t / i
    };
  }
};
var m = new W();
var x = /* @__PURE__ */ new Map();
function K(s, e) {
  return m.getCausalLink(s, e);
}
function H(s, e, t) {
  m.addEvent(e, s, t), x.set(s, e);
}
function G(s, e, t) {
  const i = O(), r = z(), n = [...s.inheritedTags || [], ...s.options?.tags || []], o = {
    id: i,
    timestamp: r,
    level: s.level,
    scope: s.scope,
    message: s.message,
    tags: n,
    cause: s.inheritedCause || s.options?.cause,
    causeEventId: s.inheritedCauseEventId || s.options?.causeEventId,
    suggest: s.options?.suggest
  };
  if (s.options?.state && (o.state = { ...s.options.state }), e.enableCallsite && !o.__internal?.isReplay && (o.callsite = j(4)), e.enableEnvInfo && !o.__internal?.isReplay && (o.env = V(e)), e.enableStateSnapshot && !o.__internal?.isReplay) {
    const a = _(e);
    a && (o.state = { ...o.state, ...a });
  }
  if (e.enableCausalLinks && !o.__internal?.isReplay) {
    const a = K(s.scope, t);
    a && (o.previousEventId = a);
  }
  return o;
}
var U = class {
  constructor(e, t) {
    this.logger = e, this.config = t, this.circuitBreaker = new I(
      {
        ...E,
        enabled: t.circuitBreaker?.enabled ?? false,
        ...t.circuitBreaker
      },
      {
        onOpen: () => {
          this.logger.warn(
            "WatcherEngine circuit breaker opened: too many errors",
            {
              tags: ["watcher", "circuit-breaker"]
            }
          );
        },
        onClose: () => {
          this.logger.info("WatcherEngine circuit breaker closed: recovered", {
            tags: ["watcher", "circuit-breaker"]
          });
        }
      }
    );
  }
  watchers = /* @__PURE__ */ new Map();
  whenHandlers = /* @__PURE__ */ new Map();
  circuitBreaker;
  disposed = false;
  watch(e, t) {
    if (this.disposed)
      throw new Error("WatcherEngine has been disposed");
    const i = this.generateId(), r = typeof e == "function" ? e : () => e, n = {
      id: i,
      getValue: r,
      label: t,
      lastValue: void 0,
      errorCount: 0,
      disposed: false
    }, o = () => {
      if (!(n.disposed || this.disposed))
        try {
          this.circuitBreaker.executeSync(() => {
            const f = r();
            if (!g(f, n.lastValue)) {
              const c = t || `watch_${i}`;
              let l;
              if (typeof f == "object" && f !== null)
                l = `${c}: state changed`;
              else {
                const u = this.formatValue(n.lastValue), d = this.formatValue(f);
                l = `${c}: ${u} -> ${d}`;
              }
              this.logger.info(l, {
                tags: ["watch"],
                state: {
                  [`${c}_prev`]: p(n.lastValue),
                  [`${c}_current`]: p(f)
                }
              }), n.lastValue = p(f);
            }
            n.errorCount = 0;
          });
        } catch (f) {
          n.errorCount++, (n.errorCount <= 3 || n.errorCount % 10 === 0) && this.logger.error(
            `Watch error for ${t || i} (count: ${n.errorCount})`,
            {
              tags: ["watch", "error"],
              state: {
                error: f instanceof Error ? f.message : String(f)
              }
            }
          ), n.errorCount >= 50 && (this.logger.error(
            `Watch ${t || i} disposed due to repeated errors`,
            {
              tags: ["watch", "error", "auto-disposed"]
            }
          ), this.disposeWatcher(i));
        }
    };
    o();
    const a = setInterval(o, this.config.pollingInterval || 250);
    return n.intervalId = a, this.watchers.set(i, n), {
      dispose: () => this.disposeWatcher(i)
    };
  }
  when(e, t, i) {
    if (this.disposed)
      throw new Error("WatcherEngine has been disposed");
    const r = this.generateId(), n = typeof e == "function" ? e : () => e, o = {
      id: r,
      getValue: n,
      predicate: t,
      onTrigger: i,
      lastValue: void 0,
      intervalId: null,
      errorCount: 0,
      disposed: false
    }, f = setInterval(() => {
      if (!(o.disposed || this.disposed))
        try {
          this.circuitBreaker.executeSync(() => {
            const c = n(), l = o.lastValue !== void 0 ? p(o.lastValue) : void 0, u = p(c);
            t(l, u) && i(u, l), o.lastValue = u, o.errorCount = 0;
          });
        } catch (c) {
          o.errorCount++, (o.errorCount <= 3 || o.errorCount % 10 === 0) && this.logger.error(
            `When condition error for ${r} (count: ${o.errorCount})`,
            {
              tags: ["when", "error"],
              state: {
                error: c instanceof Error ? c.message : String(c)
              }
            }
          ), o.errorCount >= 50 && (this.logger.error(
            `When handler ${r} disposed due to repeated errors`,
            {
              tags: ["when", "error", "auto-disposed"]
            }
          ), this.disposeWhenHandler(r));
        }
    }, this.config.pollingInterval || 250);
    return o.intervalId = f, this.whenHandlers.set(r, o), {
      dispose: () => this.disposeWhenHandler(r)
    };
  }
  disposeWatcher(e) {
    const t = this.watchers.get(e);
    t && (t.disposed = true, t.intervalId && clearInterval(t.intervalId), this.watchers.delete(e));
  }
  disposeWhenHandler(e) {
    const t = this.whenHandlers.get(e);
    t && (t.disposed = true, t.intervalId && clearInterval(t.intervalId), this.whenHandlers.delete(e));
  }
  generateId() {
    return Math.random().toString(36).substring(2, 11);
  }
  formatValue(e) {
    return e === void 0 ? "undefined" : e === null ? "null" : typeof e == "string" ? `"${e}"` : typeof e == "number" || typeof e == "boolean" ? String(e) : Array.isArray(e) ? `Array(${e.length})` : typeof e == "object" ? `Object(${Object.keys(e).length} keys)` : String(e);
  }
  /**
   * Get the number of active watchers
   */
  getWatcherCount() {
    return this.watchers.size + this.whenHandlers.size;
  }
  /**
   * Get circuit breaker state
   */
  getCircuitState() {
    return this.circuitBreaker.getState();
  }
  /**
   * Dispose all watchers and clean up
   */
  dispose() {
    this.disposed || (this.disposed = true, this.watchers.forEach((e) => {
      e.disposed = true, e.intervalId && clearInterval(e.intervalId);
    }), this.whenHandlers.forEach((e) => {
      e.disposed = true, e.intervalId && clearInterval(e.intervalId);
    }), this.watchers.clear(), this.whenHandlers.clear());
  }
  /**
   * Check if the engine has been disposed
   */
  isDisposed() {
    return this.disposed;
  }
};
var q = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};
var v = class _v {
  constructor(e, t, i, r) {
    if (this.scope = e, this.config = t, this.bus = i, this.lastEventId = r, this.watcherEngine = new U(this, t), this.levelSeverities = { ...q }, t.customLevels)
      for (const n of t.customLevels)
        this.levelSeverities[n.name] = n.severity;
  }
  inheritedTags = [];
  inheritedCause;
  inheritedCauseEventId;
  watcherEngine;
  disposed = false;
  levelSeverities;
  event(e, t) {
    this.log("info", e, t);
  }
  info(e, t) {
    this.log("info", e, t);
  }
  warn(e, t) {
    this.log("warn", e, t);
  }
  error(e, t) {
    this.log("error", e, t);
  }
  debug(e, t) {
    this.log("debug", e, t);
  }
  /**
   * Log with any level (built-in or custom)
   */
  log(e, t, i) {
    if (this.disposed) {
      console.warn(
        `Attempted to log on disposed logger (scope: ${this.scope})`
      );
      return;
    }
    e in this.levelSeverities || (console.warn(`Unknown log level: ${e}, defaulting to info`), e = "info");
    const r = this.config.logLevel || "info", n = this.levelSeverities[r] ?? 1;
    if ((this.levelSeverities[e] ?? 1) < n)
      return;
    const a = G(
      {
        level: e,
        scope: this.scope,
        message: t,
        options: i,
        inheritedTags: this.inheritedTags,
        inheritedCause: this.inheritedCause,
        inheritedCauseEventId: this.inheritedCauseEventId
      },
      this.config,
      this.lastEventId
    ), f = this.inheritedCauseEventId ? [this.inheritedCauseEventId] : void 0;
    H(this.scope, a.id, f), this.lastEventId = a.id, this.bus.publish(a);
  }
  tag(...e) {
    const t = new _v(
      this.scope,
      this.config,
      this.bus,
      this.lastEventId
    );
    return t.inheritedTags = [...this.inheritedTags, ...e], t.inheritedCause = this.inheritedCause, t.inheritedCauseEventId = this.inheritedCauseEventId, t;
  }
  causedBy(e) {
    const t = new _v(
      this.scope,
      this.config,
      this.bus,
      this.lastEventId
    );
    return t.inheritedTags = [...this.inheritedTags], typeof e == "string" ? t.inheritedCause = e : (t.inheritedCause = e.message, t.inheritedCauseEventId = e.id), t;
  }
  watch(e, t) {
    if (this.disposed)
      throw new Error(
        `Cannot create watch on disposed logger (scope: ${this.scope})`
      );
    return this.watcherEngine.watch(e, t);
  }
  when(e, t, i) {
    if (this.disposed)
      throw new Error(
        `Cannot create when handler on disposed logger (scope: ${this.scope})`
      );
    return this.watcherEngine.when(e, t, i);
  }
  /**
   * Get the number of active watchers on this logger
   */
  getWatcherCount() {
    return this.watcherEngine.getWatcherCount();
  }
  /**
   * Dispose this logger and all its watchers
   */
  dispose() {
    this.disposed || (this.disposed = true, this.watcherEngine.dispose());
  }
  /**
   * Check if this logger has been disposed
   */
  isDisposed() {
    return this.disposed;
  }
};
var S = ["debug", "info", "warn", "error"];
function D(s) {
  const e = [], t = [];
  if (s.enableCallsite !== void 0 && typeof s.enableCallsite != "boolean" && e.push("enableCallsite must be a boolean"), s.enableEnvInfo !== void 0 && typeof s.enableEnvInfo != "boolean" && e.push("enableEnvInfo must be a boolean"), s.enableStateSnapshot !== void 0 && typeof s.enableStateSnapshot != "boolean" && e.push("enableStateSnapshot must be a boolean"), s.enableCausalLinks !== void 0 && typeof s.enableCausalLinks != "boolean" && e.push("enableCausalLinks must be a boolean"), s.stateSelectors !== void 0 && (Array.isArray(s.stateSelectors) ? s.stateSelectors.forEach((i, r) => {
    typeof i != "function" && e.push(`stateSelectors[${r}] must be a function`);
  }) : e.push("stateSelectors must be an array")), s.maxBufferSize !== void 0 && (typeof s.maxBufferSize != "number" ? e.push("maxBufferSize must be a number") : s.maxBufferSize < 1 ? e.push("maxBufferSize must be at least 1") : s.maxBufferSize > 1e5 && t.push(
    "maxBufferSize is very large (>100000), this may cause memory issues"
  )), s.logLevel !== void 0 && (S.includes(s.logLevel) || e.push(`logLevel must be one of: ${S.join(", ")}`)), s.appVersion !== void 0 && typeof s.appVersion != "string" && e.push("appVersion must be a string"), s.pollingInterval !== void 0 && (typeof s.pollingInterval != "number" ? e.push("pollingInterval must be a number") : s.pollingInterval < 10 ? e.push("pollingInterval must be at least 10ms") : s.pollingInterval < 50 && t.push(
    "pollingInterval is very low (<50ms), this may impact performance"
  )), s.rateLimiting !== void 0)
    if (typeof s.rateLimiting != "object" || s.rateLimiting === null)
      e.push("rateLimiting must be an object");
    else {
      const i = s.rateLimiting;
      i.enabled !== void 0 && typeof i.enabled != "boolean" && e.push("rateLimiting.enabled must be a boolean"), i.maxEventsPerSecond !== void 0 && (typeof i.maxEventsPerSecond != "number" ? e.push("rateLimiting.maxEventsPerSecond must be a number") : i.maxEventsPerSecond < 1 && e.push("rateLimiting.maxEventsPerSecond must be at least 1")), i.samplingRate !== void 0 && (typeof i.samplingRate != "number" ? e.push("rateLimiting.samplingRate must be a number") : (i.samplingRate < 0 || i.samplingRate > 1) && e.push("rateLimiting.samplingRate must be between 0 and 1"));
    }
  if (s.deduplication !== void 0)
    if (typeof s.deduplication != "object" || s.deduplication === null)
      e.push("deduplication must be an object");
    else {
      const i = s.deduplication;
      if (i.enabled !== void 0 && typeof i.enabled != "boolean" && e.push("deduplication.enabled must be a boolean"), i.windowMs !== void 0 && (typeof i.windowMs != "number" ? e.push("deduplication.windowMs must be a number") : i.windowMs < 100 && e.push("deduplication.windowMs must be at least 100ms")), i.fields !== void 0)
        if (!Array.isArray(i.fields))
          e.push("deduplication.fields must be an array");
        else {
          const r = ["message", "scope", "level", "tags", "state"];
          i.fields.forEach((n, o) => {
            typeof n != "string" ? e.push(`deduplication.fields[${o}] must be a string`) : r.includes(n) || e.push(
              `deduplication.fields[${o}] "${n}" is not a valid field. Valid fields: ${r.join(", ")}`
            );
          });
        }
    }
  if (s.customLevels !== void 0)
    if (!Array.isArray(s.customLevels))
      e.push("customLevels must be an array");
    else {
      const i = /* @__PURE__ */ new Set(), r = ["log", "event"];
      s.customLevels.forEach((n, o) => {
        typeof n.name != "string" || n.name.trim() === "" ? e.push(`customLevels[${o}].name must be a non-empty string`) : (i.has(n.name) && e.push(
          `customLevels[${o}].name "${n.name}" is a duplicate`
        ), i.add(n.name), r.includes(n.name.toLowerCase()) && e.push(
          `customLevels[${o}].name "${n.name}" is a reserved method name`
        ), S.includes(n.name) && t.push(
          `customLevels[${o}].name "${n.name}" shadows a built-in level`
        )), typeof n.severity != "number" && e.push(`customLevels[${o}].severity must be a number`);
      });
    }
  return {
    valid: e.length === 0,
    errors: e,
    warnings: t
  };
}
var J = class {
  buffer = [];
  flushTimer = null;
  config;
  constructor(e) {
    this.config = e, e.enabled && e.flushInterval && this.startAutoFlush();
  }
  /**
   * Add an entry to the persistence buffer
   */
  add(e) {
    this.config.enabled && (this.buffer.push(e), this.config.batchSize && this.buffer.length >= this.config.batchSize && this.flush());
  }
  /**
   * Flush the buffer to the adapter
   */
  async flush() {
    if (this.buffer.length === 0) return;
    const e = [...this.buffer];
    this.buffer = [];
    try {
      await this.config.adapter.write(e);
    } catch (t) {
      throw this.buffer.length < 1e4 && (this.buffer = [...e, ...this.buffer]), t;
    }
  }
  /**
   * Start auto-flush timer
   */
  startAutoFlush() {
    this.flushTimer || (this.flushTimer = setInterval(() => {
      this.flush().catch(console.error);
    }, this.config.flushInterval));
  }
  /**
   * Stop auto-flush and close adapter
   */
  async close() {
    this.flushTimer && (clearInterval(this.flushTimer), this.flushTimer = null), await this.flush(), await this.config.adapter.close?.();
  }
  /**
   * Get buffer size
   */
  getBufferSize() {
    return this.buffer.length;
  }
};
function Ie(s = {}) {
  const e = D(s);
  if (!e.valid)
    throw new Error(
      `Invalid Satori configuration:
${e.errors.join(`
`)}`
    );
  e.warnings.length > 0 && console.warn("Satori configuration warnings:", e.warnings);
  const t = {
    ...y,
    ...s,
    // Merge nested configs properly
    rateLimiting: { ...y.rateLimiting, ...s.rateLimiting },
    deduplication: { ...y.deduplication, ...s.deduplication },
    circuitBreaker: {
      ...y.circuitBreaker,
      ...s.circuitBreaker
    }
  }, i = new R({
    maxBufferSize: t.maxBufferSize,
    rateLimiting: t.rateLimiting,
    deduplication: t.deduplication,
    circuitBreaker: t.circuitBreaker,
    enableMetrics: t.enableMetrics
  });
  !(typeof process < "u" && process.env?.NODE_ENV === "test") && t.enableConsole !== false && typeof console < "u" && i.subscribe((l) => {
    const u = l.level;
    (console[u === "debug" ? "log" : u] ?? console.log)(`[${l.scope}] ${l.message}`, l);
  });
  const n = new v("root", t, i), o = /* @__PURE__ */ new Map();
  o.set("root", n);
  let a = null;
  t.persistence?.enabled && (a = new J(t.persistence), i.subscribe((l) => {
    a?.add(l);
  }));
  const f = new C(), c = Date.now();
  return {
    config: t,
    bus: i,
    rootLogger: n,
    createLogger(l) {
      const u = new v(l, t, i);
      return o.set(l, u), f.setLoggerCount(o.size), u;
    },
    getMetrics() {
      let l = 0;
      for (const u of o.values())
        u.isDisposed() || (l += u.getWatcherCount());
      return f.setWatcherCount(l), {
        bus: i.getMetrics(),
        loggerCount: o.size,
        watcherCount: l,
        circuitState: i.getCircuitBreaker().getState(),
        uptime: Date.now() - c
      };
    },
    async flush() {
      a && await a.flush();
    },
    dispose() {
      for (const u of o.values())
        u.dispose();
      o.clear();
      const l = i.getReplayBuffer?.();
      l && (l.length = 0), i.reset(), a && a.close().catch(console.error);
    }
  };
}

// src/kernel/config.ts
var currentConfig = {
  lockViolation: "throw",
  satori: Ie({ logLevel: "debug" })
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
  return currentConfig.satori.createLogger("sairin");
}

// src/kernel/graph.ts
var nodeRegistry = /* @__PURE__ */ new Map();
function pathToString(p2) {
  return p2.raw;
}
function getOrCreateNode(p2, kind) {
  const key = pathToString(p2);
  let node = nodeRegistry.get(key);
  if (!node) {
    node = createNode(p2, kind);
    nodeRegistry.set(key, node);
  }
  if (node.kind !== kind) {
    throw new TypeError(
      `Node kind mismatch for path "${key}": existing=${node.kind} requested=${kind}`
    );
  }
  return node;
}
function createNode(p2, kind) {
  const node = {
    path: p2,
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
function getNode(p2) {
  return nodeRegistry.get(pathToString(p2));
}
function hasNode(p2) {
  return nodeRegistry.has(pathToString(p2));
}
function deleteNode(p2) {
  return nodeRegistry.delete(pathToString(p2));
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
  const called = /* @__PURE__ */ new Set();
  for (const fn of node.subscribers) {
    if (called.has(fn)) continue;
    called.add(fn);
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
      logger.error(`Circular dependency detected: ${node.path.raw}`, {
        tags: ["graph", "cycle"]
      });
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
  if (config.lockViolation === "throw" || config.lockViolation === "warn") {
    logger.error(message, { tags: ["lock", "write"] });
  } else if (config.lockViolation === "silent") {
    logger.debug(message, { tags: ["lock", "write"] });
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
      if (elapsed > CLEANUP_WARN_THRESHOLD_MS) {
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
  _isComputing = false;
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
    this._isComputing = true;
    let trackerInitialized = false;
    const trackedVersions = /* @__PURE__ */ new Map();
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
      const nodes = getAllNodes();
      const newSources = [];
      for (const node of nodes) {
        if (node.subscribers.has(tracker)) {
          newSources.push(node);
          trackedVersions.set(node, node.version);
        }
      }
      trackerInitialized = true;
      this._isComputing = false;
      for (const node of newSources) {
        this._sources.add(node);
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
function __resetBatchForTesting() {
  pendingEffects.clear();
  flushScheduled = false;
  batchDepth = 0;
  flushGeneration++;
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
      logger.error(`Effect threw: ${message}`, {
        tags: ["effect", "runtime"]
      });
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
function bindText(el, readable) {
  const update = () => {
    const value = readable.get();
    if (el.textContent !== value) {
      el.textContent = value;
    }
  };
  return effect(() => {
    update();
  });
}
function bindHtml(el, readable) {
  return effect(() => {
    const value = readable.get();
    if (el.innerHTML !== value) {
      el.innerHTML = value;
    }
  });
}
function bindAttribute(el, attr, readable) {
  return effect(() => {
    const value = readable.get();
    if (value == null) {
      el.removeAttribute(attr);
    } else {
      el.setAttribute(attr, String(value));
    }
  });
}
function bindProperty(el, prop, readable) {
  return effect(() => {
    const value = readable.get();
    if (el[prop] !== value) {
      el[prop] = value;
    }
  });
}
function bindClass(el, readable) {
  return effect(() => {
    const value = readable.get();
    el.className = value;
  });
}
function bindStyle(el, styleProp, readable) {
  return effect(() => {
    const value = readable.get();
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
function bindVisibility(el, readable) {
  return effect(() => {
    const visible = readable.get();
    if (visible) {
      el.removeAttribute("hidden");
    } else {
      el.setAttribute("hidden", "");
    }
  });
}
function bindDisabled(el, readable) {
  return effect(() => {
    const disabled = readable.get();
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
export {
  Derived,
  ReactiveArray,
  ReactiveMap,
  Signal,
  SuspenseBoundary,
  __resetBatchForTesting,
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
  createEffect2 as createEffect,
  createEffectSync,
  createList,
  createMap,
  createMemo,
  path as createPath,
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
};
//# sourceMappingURL=index.mjs.map