---
title: "Locks"
description: "Preventing unauthorized writes"
order: 6
---

Lock paths to prevent writes from outside a designated scope.

## Basic Locking

```typescript
import { lock, unlock, isLocked, path } from 'sairin';

lock(path("app", "currentUser"), { owner: "auth" });

isLocked(path("app", "currentUser"));  // true

unlock(path("app", "currentUser"));
```

## Violation Behavior

Configure what happens on violation:

```typescript
import { configureSairin } from 'sairin';

configureSairin({ lockViolation: "throw" });  // Throw (development)
configureSairin({ lockViolation: "warn" });   // Warn (production)
configureSairin({ lockViolation: "silent" });  // Silent
```

## Checking Ownership

```typescript
import { checkLock, path } from 'sairin';

lock(path("app", "theme"), { owner: "theme" });

checkLock(path("app", "theme"), "theme");     // true
checkLock(path("app", "theme"), "other");    // false
```

## Deep Locks

Lock entire subtrees:

```typescript
lock(path("app", "**"), { owner: "core" });

unlock(path("app", "theme"));  // Child wins
```

## Use Cases

- Auth state - only auth module can write user data
- Theme - only theme service can change colors
- Feature flags - only config service can modify

## Assert Lock

Throw if write would violate lock:

```typescript
import { assertLock, path } from 'sairin';

lock(path("app", "user"), { owner: "auth" });

// Throws if not owner
assertLock(path("app", "user"), "auth", "login");

// Returns boolean
const canWrite = assertLock(path("app", "user"), "guest");
```
