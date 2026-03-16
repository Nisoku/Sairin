---
title: "Quick Start"
description: "Get started with Sairin in minutes"
order: 1
---

This guide will get you up and running with Sairin in a few minutes.

## Installation

```bash
npm install @nisoku/sairin
```

## Your First Signal

A signal holds a value. When the value changes, everything that depends on it updates.

```typescript
import { signal, path } from 'sairin';

const name = signal(path("user", "name"), "Alice");
console.log(name.get());  // "Alice"

name.set("Bob");
console.log(name.get());  // "Bob"
```

## Paths

Every signal lives at a path. Paths are structured like a filesystem:

```typescript
const userPath = path("user", "name");      // -> "/user/name"
const itemsPath = path("items", "*");        // -> "/items/*"
const allUsers = path("users", "**");       // -> "/users/**"
```

## Effects

An effect runs code whenever the signals it reads change:

```typescript
import { signal, effect, path } from 'sairin';

const count = signal(path("counter", "value"), 0);

effect(() => {
  console.log("Count is now:", count.get());
});

count.set(1);  // Logs: "Count is now: 1"
```

## Derived Values

A derived value automatically updates when its dependencies change:

```typescript
import { signal, derived, path } from 'sairin';

const firstName = signal(path("user", "firstName"), "John");
const lastName = signal(path("user", "lastName"), "Doe");

const fullName = derived(path("user", "fullName"), () => {
  return `${firstName.get()} ${lastName.get()}`;
});

console.log(fullName.get());  // "John Doe"
```

## Batching

Batch multiple updates into one effect flush:

```typescript
import { signal, effect, batch, path } from 'sairin';

const a = signal(path("data", "a"), 1);
const b = signal(path("data", "b"), 2);

effect(() => {
  console.log(a.get(), b.get());
});

batch(() => {
  a.set(10);
  b.set(20);
});

// Effect only runs once, logs: "10 20"
```

## What's Next

- [Path System](../guide/path-system) - understand paths, globs, and aliases
- [Signals](../guide/signals) - deep dive into signals
- [Effects](../guide/effects) - scheduling tiers and cleanup
- [Configuration](../getting-started/configuration) - lock behavior and logging
