---
title: "Context API"
description: "Context system for Sairin"
order: 6
---

Context provides a way to pass values through the component tree without prop drilling.

## Overview

Sairin's context system uses a stack-based approach, allowing for nested providers with automatic cleanup.

```typescript
import { createContext, useContext } from 'sairin';
```

---

## createContext

Create a new context with a default value.

```typescript
function createContext<T>(defaultValue: T, name?: string): Context<T>
```

```typescript
const themeContext = createContext('light');
const userContext = createContext<User | null>(null);
```

---

## Context Interface

```typescript
interface Context<T> {
  defaultValue: T;
  Provider: (props: { value: T; children?: any }) => () => void;
  consume: () => T;
}
```

### Provider

A component that provides a value to its children. Returns a cleanup function.

```typescript
const cleanup = themeContext.Provider({ value: 'dark' });
// ... components can now read 'dark'
cleanup();
// ... back to default value
```

### consume

Read the current value from the context.

```typescript
const currentValue = themeContext.consume();
```

---

## useContext

Hook to read a context value.

```typescript
function useContext<T>(context: Context<T>): T
```

```typescript
const theme = useContext(themeContext);
```

---

## useContextProvider

Convenience function to set up a provider.

```typescript
function useContextProvider<T>(
  context: Context<T>,
  value: T,
): () => void
```

```typescript
const cleanup = useContextProvider(themeContext, 'dark');
```

---

## Example

```typescript
import { createContext, useContext, useContextProvider } from 'sairin';

const ThemeContext = createContext('light');
const UserContext = createContext<{ name: string } | null>(null);

function App() {
  // Provide theme
  const cleanupTheme = useContextProvider(ThemeContext, 'dark');
  
  // Provide user
  const cleanupUser = useContextProvider(UserContext, { name: 'Alice' });
  
  // Clean up on unmount
  return () => {
    cleanupTheme();
    cleanupUser();
  };
}

function Header() {
  const theme = useContext(ThemeContext);
  const user = useContext(UserContext);
  
  return `${user?.name} using ${theme} theme`;
}
```

---

## Nested Providers

Contexts can be nested, and the inner provider shadows the outer one:

```typescript
const ctx = createContext('root');

const cleanup1 = ctx.Provider({ value: 'outer' });
console.log(ctx.consume()); // 'outer'

const cleanup2 = ctx.Provider({ value: 'inner' });
console.log(ctx.consume()); // 'inner'

cleanup2();
console.log(ctx.consume()); // 'outer'

cleanup1();
console.log(ctx.consume()); // 'root'
```
