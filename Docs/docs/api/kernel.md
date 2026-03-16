---
title: "Kernel API"
description: "Core Sairin primitives"
order: 1
---

Core Sairin primitives.

## Signals

### signal

```typescript
function signal<T>(path: PathKey, initial: T): Signal<T>
```

Create a reactive signal at a path.

### Signal Class

```typescript
class Signal<T> {
  readonly id: number;
  readonly path: PathKey;

  get(): T
  set(value: T, options?: { owner?: string }): void
  update(fn: (value: T) => T): void
  subscribe(fn: Subscriber): () => void
  unsubscribe(fn: Subscriber): void
  peek(): T
  get version(): number
}
```

### isSignal

```typescript
function isSignal<T>(value: unknown): value is Signal<T>
```

Check if a value is a signal.

## Derived

### derived

```typescript
function derived<T>(
  path: PathKey, 
  fn: () => T, 
  options?: { eager?: boolean }
): Derived<T>
```

Create a computed value.

### Derived Class

```typescript
class Derived<T> {
  readonly id: number;
  readonly path: PathKey;

  get(): T
  subscribe(fn: Subscriber): () => void
  isDirty(): boolean
  peek(): T
  get version(): number
}
```

## Effects

### effect

```typescript
function effect(fn: () => CleanupFn): () => void
```

Create an effect (runs in next microtask).

### effectSync

```typescript
function effectSync(fn: () => CleanupFn): () => void
```

Create a synchronous effect.

### effectIdle

```typescript
function effectIdle(fn: () => CleanupFn): () => void
```

Create an idle effect.

### onCleanup

```typescript
function onCleanup(fn: () => void): void
```

Register cleanup in an effect.

### untracked

```typescript
function untracked<T>(fn: () => T): T
```

Run without subscribing.

## Batching

### batch

```typescript
function batch(fn: () => void): void
```

Group updates into one flush.

### isFlushing

```typescript
function isFlushing(): boolean
```

Currently in a flush?

### hasPendingEffects

```typescript
function hasPendingEffects(): boolean
```

Effects waiting to run?

## Configuration

### configureSairin

```typescript
function configureSairin(config: SairinConfig): void
```

Configure Sairin behavior.

### getSairinConfig

```typescript
function getSairinConfig(): Readonly<SairinConfig>
```

Get current config.
