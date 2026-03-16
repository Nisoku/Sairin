---
title: "Effects"
description: "Running code when signals change"
order: 3
---

An effect runs code whenever the signals it reads change.

## Basic Usage

```typescript
import { signal, effect, path } from 'sairin';

const count = signal(path("counter"), 0);

effect(() => {
  console.log("Count is:", count.get());
});

count.set(1);  // Logs: "Count is: 1"
count.set(2);  // Logs: "Count is: 2"
```

## Scheduling Tiers

Sairin has three scheduling tiers:

| Tier | API | When it Runs | Use Case |
|------|-----|-------------|----------|
| Sync | `effectSync()` | Immediately | Critical path |
| Micro | `effect()` | Next microtask | Default - DOM updates |
| Idle | `effectIdle()` | `requestIdleCallback` | Analytics, logging |

```typescript
import { effect, effectSync, effectIdle } from 'sairin';

effectSync(() => {
  console.log("Sync!");
});

effect(() => {
  console.log("Microtask");
});

effectIdle(() => {
  console.log("Idle time");
});
```

## Cleanup Functions

Effects can return a cleanup function:

```typescript
const count = signal(path("counter"), 0);

effect(() => {
  const current = count.get();
  console.log("Count:", current);

  return () => {
    console.log("Cleaning up!");
  };
});

count.set(1);  // Logs: "Count: 1", then registers cleanup
count.set(2);  // Runs cleanup, then logs: "Count: 2"
```

## onCleanup

Register cleanup without returning from the effect:

```typescript
import { effect, onCleanup } from 'sairin';

effect(() => {
  const timer = setTimeout(() => console.log("Done!"), 1000);
  
  onCleanup(() => clearTimeout(timer));
});
```

## Disposing Effects

```typescript
const count = signal(path("counter"), 0);

const dispose = effect(() => {
  console.log("Count:", count.get());
});

count.set(1);  // Logs: "Count: 1"
count.set(2);  // Logs: "Count: 2"

dispose();  // Effect is removed

count.set(3);  // Nothing - effect is gone
```

## Untracked Reads

Read without subscribing:

```typescript
import { signal, effect, untracked, path } from 'sairin';

const a = signal(path("a"), 1);
const b = signal(path("b"), 2);

effect(() => {
  console.log(a.get(), untracked(() => b.get()));
});

a.set(10);  // Effect runs
b.set(20);  // Effect does NOT run (untracked)
```
