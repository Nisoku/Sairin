---
title: "Sairin"
description: "Fine-grained reactive UI framework with a virtual filesystem model"
---

Sairin is a fine‑grained reactive UI framework built around a virtual filesystem model. Every piece of state lives at a path, and reactivity flows through those paths like a living directory tree.

::: callout tip
Sairin means “reappearance” or “return” in Japanese: a familiar cycle coming back in a clearer form. The engine mirrors that idea, renewing your application's reactive flow with clarity and precision.
:::

## Features

::: card Path-Based Graph
Every signal lives at a path like /user/name. Subscribe to namespaces and get notified on any child change.
:::

::: card Fine-Grained Updates
Only exactly what changes gets updated. No Virtual DOM, no re-renders, no diffing.
:::

::: card Three Scheduling Tiers
Sync, microtask, and idle effects. Pick the right tier for the job.
:::

::: card Memory Efficient
Incremental cleanup, effect pooling, and retained memory caps. Built for long-running apps.
:::

::: card Virtual Filesystem Model
Signals, effects, and stores live at paths. Structure your app like a directory tree and let reactivity flow through it.
:::

## Quick Example

```typescript
import { signal, effect, path } from 'sairin';

const count = signal(path("counter", "value"), 0);

effect(() => {
  console.log("Count is now:", count.get());
});

count.set(1);  // Logs: "Count is now: 1"
```

## Installation

```bash
npm install @nisoku/sairin
```

## Next Steps

- [Quick Start](./getting-started/quickstart): Get up and running in minutes
- [Configuration](./getting-started/configuration): Lock behavior and logging
- [Path System](./guide/path-system): Paths, globs, and aliases
- [Signals](./guide/signals): Creating and using signals
- [Effects](./guide/effects): Running code when signals change
- [API Reference](./api/): Complete API documentation
