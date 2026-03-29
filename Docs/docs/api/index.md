---
title: "API Reference"
description: "Complete API documentation for Sairin"
order: 1
---

Sairin provides a comprehensive API for building reactive applications.

## Overview

The API is organized into several modules:

| Module           | Description                                       |
|------------------|---------------------------------------------------|
| [Kernel](kernel) | Core reactivity: signals, effects, derived, batch |
| [Store](store)   | Reactive data structures                          |
| [Flow](flow)     | Async flow control utilities                      |
| [Async](async)   | Async patterns                                    |

## Quick Reference

### Creating Reactivity

```typescript
import { signal, derived, effect, batch } from 'sairin';

const mySignal = signal(path("path", "to", "value"), initialValue);
const myDerived = derived(path("path", "to", "derived"), () => computation);
const dispose = effect(() => { /* side effect */ });
batch(() => { /* grouped updates */ });
```

### Core Concepts

- **Signals** - Reactive value containers
- **Derived** - Computed values that auto-update
- **Effects** - Side effects that track dependencies
- **Batching** - Group multiple updates

### Path-Based Features

```typescript
import { path, watch, lock, alias } from 'sairin';

const myPath = path("app", "component", "state");
watch(myPath, (changedPath) => { /* ... */ });
lock(myPath, { owner: "myModule" });
alias(path("alias"), path("target"));
```

## Installation

```bash
npm install @nisoku/sairin
```

## TypeScript

Sairin is written in TypeScript and includes full type definitions. No additional `@types` package needed.
