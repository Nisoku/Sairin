---
title: "Async API"
description: "Async patterns for Sairin"
order: 4
---

Async patterns for Sairin.

## useDeferred

Defer signal updates to the next tick.

```typescript
import { signal, useDeferred, path } from 'sairin';

const count = signal(path("counter"), 0);
const deferred = useDeferred(count);

count.set(1);  // deferred still 0
count.set(2);  // deferred still 0

// After microtask:
console.log(deferred.get());  // 2
```

### Options

```typescript
useDeferred(signal, { timeoutMs: 1000 });
// Forces update after timeout if no changes
```

## useDeferredValue

Defer a value, creating a signal.

```typescript
import { useDeferredValue, signal } from 'sairin';

const deferred = useDeferredValue(42);
console.log(deferred.get());  // 42
```

With signal:

```typescript
const source = signal(path("source"), "hello");
const deferred = useDeferredValue(source);
```

## resource

Async data fetching with loading/error states.

```typescript
import { resource } from 'sairin';

const userResource = resource(async (signal) => {
  const res = await fetch("/api/user", { signal });
  return res.json();
});
```

### Returns

```typescript
interface Resource<T> {
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  data: Signal<T | null>;
  read: () => T | null;
  reload: () => void;
  abort: () => void;
}
```

### Usage

```typescript
const user = userResource.read();

userResource.loading.get();  // true/false
userResource.error.get();    // Error or null
userResource.data.get();     // T or null

userResource.reload();

userResource.abort();
```
