<!-- markdownlint-disable MD033 MD036 MD041 -->

<div align="left">

<img src="Build/assets/images/sairin-logo-light.svg" alt="Sairin" width="200">

**Fine-grained reactive UI framework with a virtual filesystem model**

[![CI](https://github.com/Nisoku/Sairin/actions/workflows/ci.yml/badge.svg)](https://github.com/Nisoku/Sairin/actions/workflows/ci.yml)
[![Deploy](https://github.com/Nisoku/Sairin/actions/workflows/pages.yml/badge.svg)](https://github.com/Nisoku/Sairin/actions/workflows/pages.yml)
[![npm version](https://img.shields.io/npm/v/@nisoku/sairin.svg)](https://www.npmjs.com/package/@nisoku/sairin)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)

[Documentation](https://nisoku.github.io/Sairin/) | [API Reference](https://nisoku.github.io/Sairin/api/)

</div>

---

Sairin is a fine-grained reactive UI framework built around a virtual filesystem model. Every piece of state lives at a path, and reactivity flows through those paths like a living directory tree.

## Features

| Feature | Description |
| --------- | ------------- |
| **Path-Based Graph** | Signals at paths like /user/name, subscribe to namespaces |
| **Fine-Grained Updates** | Only exactly what changes gets updated |
| **Three Scheduling Tiers** | Sync, microtask, and idle effects |
| **Locks and Ownership** | Prevent writes from outside designated scopes |
| **Memory Efficient** | Incremental cleanup, effect pooling, retained memory caps |
| **Satori Integration** | Structured logging with full context |

## Quick Start

```typescript
import { signal, effect, path } from 'sairin';

const count = signal(path("counter", "value"), 0);

effect(() => {
  console.log("Count is now:", count.get());
});

count.set(1);  // Logs: "Count is now: 1"
```

## Why Path-Based

Most reactive systems use a flat model:

```txt
signal -> Set<subscriber>
```

Sairin uses a filesystem model:

```txt
/user/name     <- signal
/user/age      <- signal
/user          <- namespace
/ui/header     <- derived, depends on /user/name
```

This gives you namespace subscriptions, natural scoping, and path-based debugging.

## Installation

```bash
npm install @nisoku/sairin
```

Sairin is available on [NPM](https://www.npmjs.com/package/@nisoku/sairin)!

## Documentation

| Section | Description |
| --------- | ------------- |
| [Quick Start](https://nisoku.github.io/Sairin/getting-started/quickstart) | Your first Sairin app |
| [Configuration](https://nisoku.github.io/Sairin/getting-started/configuration) | Lock behavior and logging |
| [Path System](https://nisoku.github.io/Sairin/guide/path-system) | Paths, globs, and aliases |
| [Signals](https://nisoku.github.io/Sairin/guide/signals) | Creating and using signals |
| [Effects](https://nisoku.github.io/Sairin/guide/effects) | Running code when signals change |
| [Derived](https://nisoku.github.io/Sairin/guide/derived) | Computed values that auto-update |
| [Batching](https://nisoku.github.io/Sairin/guide/batching) | Grouping updates efficiently |
| [Locks](https://nisoku.github.io/Sairin/guide/locks) | Preventing unauthorized writes |
| [API Reference](https://nisoku.github.io/Sairin/api/) | Complete API documentation |

## Project Structure

```txt
Sairin/
  Build/            # Source code and build config
    src/            # TypeScript source
      kernel/      # Core reactivity (signals, effects, derived)
      store/       # Reactive data structures
      flow/        # Async flow utilities
      async/       # Async patterns
      dom/         # DOM bindings
  Docs/             # Documentation (docmd)
```

## Development

### Install dependencies

```bash
cd Build && npm install
```

### Run tests

```bash
cd Build && npm test
```

### Type check

```bash
cd Build && npm run typecheck
```

### Build

```bash
cd Build && npm run build
```

### Build docs

```bash
cd ../Docs && npm run build
```

## License

[Apache License v2.0](LICENSE)
