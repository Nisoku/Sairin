---
title: "Derived"
description: "Computed values that auto-update"
order: 4
---

A derived value automatically updates when its dependencies change.

## Creating Derived

```typescript
import { signal, derived, path } from 'sairin';

const firstName = signal(path("user", "firstName"), "John");
const lastName = signal(path("user", "lastName"), "Doe");

const fullName = derived(path("user", "fullName"), () => {
  return `${firstName.get()} ${lastName.get()}`;
});

console.log(fullName.get());  // "John Doe"
```

## How It Works

1. On first `.get()`, the derived runs its function
2. It subscribes to any signals read during computation
3. When any dependency changes, it marks itself dirty
4. On next `.get()`, it recomputes if dirty

## Caching

Derived values cache their results:

```typescript
const a = signal(path("a"), 1);
const b = signal(path("b"), 2);

const sum = derived(path("sum"), () => {
  console.log("Computing...");
  return a.get() + b.get();
});

sum.get();  // Logs: "Computing..." -> 3
sum.get();  // Cached -> 3 (no recompute)

a.set(10);
sum.get();  // Logs: "Computing..." -> 12
```

## Eager Mode

Compute immediately instead of lazily:

```typescript
const count = signal(path("counter"), 0);

const doubled = derived(path("counter", "doubled"), () => {
  return count.get() * 2;
}, { eager: true });  // Computes immediately

console.log(doubled.peek());  // 0
```

## Derived API

| Method | Description |
|--------|-------------|
| `get()` | Get value (recomputes if dirty) |
| `subscribe(fn)` | Subscribe to changes |
| `isDirty()` | Check if needs recompute |
| `peek()` | Get cached value without subscribing |
| `version` | Get version number |

## Staleness Detection

Derived uses a version clock. Each signal has a monotonic version that increments on `.set()`. Derived caches each dependency's version and only recomputes when a version is higher.
