---
title: "Configuration"
description: "Configure Sairin behavior"
order: 2
---

Configure Sairin for your app.

## Basic Setup

```typescript
import { configureSairin } from 'sairin';

configureSairin({
  lockViolation: "warn",
});
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `lockViolation` | `"throw"` / `"warn"` / `"silent"` | `"throw"` | What to do when a lock is violated |
| `satori` | `SatoriInstance` | undefined | Satori instance for structured logging |

## Lock Violation Behavior

### `"throw"` (development)

Throws an error with full stack trace:

```typescript
configureSairin({ lockViolation: "throw" });

lock(path("app", "currentUser"), { owner: "auth" });
signal(path("app", "currentUser")).set("bob");  // Throws!
```

### `"warn"` (production)

Logs a warning via Satori and continues:

```typescript
configureSairin({ lockViolation: "warn" });
// Logs: "Lock violation: cannot write to /app/currentUser, owned by auth"
```

### `"silent"`

Silently drops the write:

```typescript
configureSairin({ lockViolation: "silent" });
// No output, write is ignored
```

## Satori Integration

Connect Satori for structured logging:

```typescript
import { createSatori } from '@nisoku/satori-log';
import { configureSairin } from 'sairin';

const satori = createSatori({
  logLevel: 'info',
});

configureSairin({
  satori,
});
```

All Sairin errors route through Satori with tags:

| Event | Level | Tags |
|-------|-------|------|
| Lock violation | error / warn | lock, write |
| Effect threw | error | effect, runtime |
| Circular dependency | error | graph, cycle |
| Cleanup falling behind | warn | memory, gc |
