---
title: "Debug API"
description: "Debugging and introspection for Sairin"
order: 7
---

Debug utilities for monitoring and inspecting Sairin's reactive graph.

```typescript
import { enableDebug, captureGraph } from 'sairin';
```

---

## Debug Hooks

Enable debug hooks to receive notifications about reactive operations.

### DebugHooks Interface

```typescript
interface DebugHooks {
  onSignalCreated?: (signal: Signal<any>, name?: string) => void;
  onSignalRead?: (signal: Signal<any>) => void;
  onSignalWritten?: (signal: Signal<any>, oldValue: any, newValue: any) => void;
  onEffectCreated?: (effect: () => void) => void;
  onEffectRun?: (effect: () => void) => void;
  onDerivedInvalidated?: (derived: Derived<any>) => void;
}
```

### enableDebug

Enable debug hooks.

```typescript
function enableDebug(hooks: Partial<DebugHooks>): void
```

```typescript
enableDebug({
  onSignalCreated: (signal, name) => {
    console.log('Signal created:', name, signal.path);
  },
  onSignalWritten: (signal, oldVal, newVal) => {
    console.log('Signal updated:', signal.path, oldVal, '->', newVal);
  },
});
```

### disableDebug

Reset all debug hooks to no-ops.

```typescript
function disableDebug(): void
```

### getDebugHooks

Get the current debug hooks configuration.

```typescript
function getDebugHooks(): DebugHooks
```

---

## Manual Notifications

### notifySignalCreated

Manually notify that a signal was created.

```typescript
function notifySignalCreated(signal: Signal<any>, name?: string): void
```

### notifySignalRead

Manually notify that a signal was read.

```typescript
function notifySignalWritten(
  signal: Signal<any>,
  oldValue: any,
  newValue: any,
): void
```

### notifyEffectCreated

Manually notify that an effect was created.

```typescript
function notifyEffectCreated(effect: () => void): void
```

### notifyEffectRun

Manually notify that an effect ran.

```typescript
function notifyEffectRun(effect: () => void): void
```

---

## Graph Inspection

### registerSignal

Register a signal for graph inspection.

```typescript
function registerSignal(signal: Signal<any>): void
```

### registerEffect

Register an effect for graph inspection.

```typescript
function registerEffect(effect: () => void, id: number): void
```

### registerDerived

Register a derived value for graph inspection.

```typescript
function registerDerived(derived: Derived<any>): void
```

### captureGraph

Capture a snapshot of the current reactive graph.

```typescript
function captureGraph(): GraphSnapshot
```

```typescript
interface GraphSnapshot {
  signals: GraphSnapshotSignal[];
  effects: GraphSnapshotEffect[];
  derived: GraphSnapshotDerived[];
}
```

### clearGraph

Clear all registered signals, effects, and derived values.

```typescript
function clearGraph(): void
```

---

## Example

```typescript
import { 
  enableDebug, 
  disableDebug,
  registerSignal, 
  captureGraph,
  clearGraph 
} from 'sairin';

// Enable debugging
enableDebug({
  onSignalCreated: (sig) => {
    console.log('Created:', sig.path.raw);
  },
});

// Register signals for inspection
const count = new Signal(path("counter", "value"), 0);
registerSignal(count);

const name = new Signal(path("user", "name"), "Alice");
registerSignal(name);

// Capture current state
const snapshot = captureGraph();
console.log('Signals:', snapshot.signals.map(s => ({
  path: s.id,
  value: s.value,
  subscribers: s.subscriberCount,
})));

// Clean up when done
clearGraph();
disableDebug();
```
