---
title: "Store API"
description: "Reactive data structures"
order: 2
---

Reactive data structures.

## ReactiveMap

```typescript
import { ReactiveMap, reactiveMap } from 'sairin';

const map = reactiveMap<string, number>();
// or with initial data
const map = new ReactiveMap([["a", 1], ["b", 2]]);
```

### Methods

| Method | Description |
|--------|-------------|
| `get(key)` | Get value |
| `set(key, value)` | Set value |
| `has(key)` | Check if key exists |
| `delete(key)` | Delete key |
| `clear()` | Clear all |
| `size` | Get count |

### Iteration

```typescript
for (const [key, value] of map) { }
for (const value of map.values()) { }
for (const key of map.keys()) { }

map.forEach((value, key) => { });
map.toArray();
```

## ReactiveArray

```typescript
import { reactiveArray } from 'sairin';

const arr = reactiveArray([1, 2, 3]);
```

### Methods

| Method | Description |
|--------|-------------|
| `get(index)` | Get value at index |
| `set(index, value)` | Set value |
| `push(...values)` | Add to end |
| `pop()` | Remove from end |
| `shift()` | Remove from start |
| `unshift(...values)` | Add to start |
| `splice(start, deleteCount, ...items)` | Insert/delete |
| `length` | Get count |

## ReactiveObject

```typescript
import { reactive, isReactive, toRaw } from 'sairin';

const state = reactive({
  user: { name: "Alice" },
  count: 0
});

// Read
state.count;        // -> signal
state.user.name;    // -> signal

// Write
state.count.set(5);
state.user.name.set("Bob");

// Check
isReactive(state);  // true

// Get raw
toRaw(state);       // { user: { name: "Bob" }, count: 5 }
```

### Methods

| Method | Description |
|--------|-------------|
| `isReactive(value)` | Check if reactive |
| `toRaw(obj)` | Get underlying object |
