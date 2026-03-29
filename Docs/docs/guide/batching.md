---
title: "Batching"
description: "Grouping updates efficiently"
order: 5
---

Batch multiple signal updates into one effect flush.

## Without Batching

```typescript
import { signal, effect, path } from 'sairin';

const a = signal(path("a"), 1);
const b = signal(path("b"), 2);

effect(() => {
  console.log(a.get(), b.get());
});

a.set(10);  // Effect runs: "1 2"
b.set(20);  // Effect runs: "10 2"
```

## With Batching

```typescript
import { signal, effect, batch, path } from 'sairin';

const a = signal(path("a"), 1);
const b = signal(path("b"), 2);

effect(() => {
  console.log(a.get(), b.get());
});

batch(() => {
  a.set(10);
  b.set(20);
});

// Effect runs once: "10 20"
```

## Why Batch

- Performance - fewer effect runs
- Consistency - no intermediate states visible
- Backpressure - multiple rapid updates collapse into one

## Backpressure

When many signals update in the same tick, Sairin handles it:

```txt
tick:
  signal A .set()  -> dirty, enqueue flush
  signal B .set()  -> dirty, flush already queued -> drop
  signal C .set()  -> dirty, flush already queued -> drop
  
microtask:
  flush() -> runs all dirty effects once
```

## Checking Flush State

```typescript
import { isFlushing, hasPendingEffects } from 'sairin';

console.log(isFlushing());      // Currently running flush?
console.log(hasPendingEffects());  // Effects waiting to run?
```
