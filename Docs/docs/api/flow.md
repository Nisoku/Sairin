---
title: "Flow API"
description: "Async flow control utilities"
order: 3
---

Async flow control utilities.

## flow

Execute an async operation with state signals.

```typescript
import { flow } from 'sairin';

const fetchUser = flow(async (signal) => {
  const response = await fetch("/api/user", { signal });
  return response.json();
});
```

### Returns

```typescript
interface Flow<T> {
  running: Signal<boolean>;
  result: Signal<T | null>;
  error: Signal<Error | null>;
  start: () => Promise<void>;
  cancel: () => void;
}
```

### Usage

```typescript
await fetchUser.start();

console.log(fetchUser.running.get());  // false
console.log(fetchUser.result.get());    // { ... }
console.log(fetchUser.error.get());     // null or Error

fetchUser.cancel();
```

## pipeline

Async operation with input.

```typescript
import { pipeline } from 'sairin';

const processData = pipeline(async (input, signal) => {
  const result = await fetch(`/api/process/${input}`, { signal });
  return result.json();
});
```

### Returns

```typescript
interface Pipeline<T, R> {
  running: Signal<boolean>;
  result: Signal<R | null>;
  error: Signal<Error | null>;
  start: (input: T) => Promise<void>;
  cancel: () => void;
}
```

## sequence

Run functions in sequence, collect all results.

```typescript
import { sequence } from 'sairin';

const seq = sequence(
  async () => "a",
  async () => "b",
  async () => "c"
);

await seq.start();

console.log(seq.results.get());  // ["a", "b", "c"]
console.log(seq.errors.get());    // []
```

## parallel

Run functions in parallel.

```typescript
import { parallel } from 'sairin';

const par = parallel(
  () => fetch("/api/1"),
  () => fetch("/api/2"),
  () => fetch("/api/3")
);

await par.start();
```

## race

First to settle wins.

```typescript
import { race } from 'sairin';

const winner = race(
  () => fetch("/api/fast"),
  () => fetch("/api/slow")
);

await winner.start();

console.log(winner.winner.get());  // 0 or 1
```
