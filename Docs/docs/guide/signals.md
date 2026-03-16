---
title: "Signals"
description: "Creating and using signals"
order: 2
---

A signal is a container for a value. When the value changes, it notifies everything that depends on it.

## Creating Signals

```typescript
import { signal, path } from 'sairin';

const count = signal(path("counter", "value"), 0);
```

## Reading and Writing

```typescript
count.get();    // Read
count.set(5);   // Write
count.set(5);   // No-op - same value
count.update(c => c + 1);  // Update from current
```

## What Happens on .get()

1. Sairin records which effect is currently running
2. The signal adds that effect to its subscriber list
3. The value is returned

## What Happens on .set()

1. If new value equals old value, do nothing
2. Check for lock violations
3. Notify all subscribers
4. Each subscriber re-runs

## Signal API

| Method | Description |
|--------|-------------|
| `get()` | Read the current value |
| `set(value)` | Set a new value |
| `update(fn)` | Update using current value |
| `subscribe(fn)` | Subscribe to changes |
| `unsubscribe(fn)` | Unsubscribe |
| `peek()` | Read without subscribing |
| `version` | Get the version number |

## Subscriptions

```typescript
const count = signal(path("counter"), 0);

const unsubscribe = count.subscribe((value) => {
  console.log("Count changed to:", value);
});

count.set(1);  // Logs: "Count changed to: 1"
count.set(2);  // Logs: "Count changed to: 2"

unsubscribe();
count.set(3);  // Nothing logged
```

## Equality

Sairin uses `Object.is()` for equality checks:

```typescript
const obj = signal(path("data", "obj"), { a: 1 });

obj.set({ a: 1 });     // Different reference - triggers
obj.update(d => d);    // Same object - no trigger
```

## Check If Signal

```typescript
import { isSignal, signal, path } from 'sairin';

const s = signal(path("test"), 42);
const notSignal = "hello";

isSignal(s);        // true
isSignal(notSignal);  // false
```
