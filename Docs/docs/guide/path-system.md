---
title: "Path System"
description: "Understanding paths, globs, and aliases"
order: 1
---

Sairin models reactivity as a virtual filesystem. Every signal lives at a path.

## Creating Paths

```typescript
import { path } from 'sairin';

const userPath = path("user", "name");     // -> "/user/name"
const itemsPath = path("items", "0");      // -> "/items/0"
const allUsers = path("users", "**");     // -> "/users/**"
```

## Path Segments

Paths are arrays under the hood:

```typescript
const p = path("user", "profile", "name");
console.log(p.segments);  // ["user", "profile", "name"]
console.log(p.raw);       // "/user/profile/name"
```

## Glob Patterns

| Pattern | Matches               | Example                                                        |
|---------|-----------------------|----------------------------------------------------------------|
| `*`     | Single segment        | `/user/*` matches `/user/name` but not `/user/profile/name`    |
| `**`    | Zero or more segments | `/user/**` matches `/user`, `/user/name`, `/user/profile/name` |

## Watching Paths

Subscribe to changes under a path:

```typescript
import { watch, path } from 'sairin';

watch(path("user", "**"), (changedPath, kind) => {
  console.log(`${changedPath.raw} changed (${kind})`);
});

watch(path("user", "*"), (changedPath) => {
  console.log(`Child changed: ${changedPath.raw}`);
});
```

## Aliases

Aliases redirect one path to another:

```typescript
import { alias, resolveAlias, unalias, isAlias, path, signal } from 'sairin';

alias(path("ui", "name"), path("user", "name"));

isAlias(path("ui", "name"));  // true

resolveAlias(path("ui", "name"));  // PathKey("/user/name")

const uiName = signal(path("ui", "name"), "Initial");
console.log(uiName.get());  // Returns value from /user/name

unalias(path("ui", "name"));
```

## Parent Paths

Get the parent of a path:

```typescript
import { getParentPath, path } from 'sairin';

const parent = getParentPath(path("user", "profile", "name"));
console.log(parent.raw);  // "/user/profile"
```
