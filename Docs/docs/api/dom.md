---
title: "DOM Bindings API"
description: "DOM binding utilities for Sairin"
order: 5
---

DOM bindings connect reactive signals to DOM elements. Each binding returns a cleanup function.

## Setup

Import bindings from `sairin`:

```typescript
import { bindText, bindEvent, bindInputValue } from 'sairin';
```

All bindings return a cleanup function:

```typescript
const cleanup = bindText(element, mySignal);
cleanup(); // Remove the binding
```

---

## Text & HTML

### bindText

Bind element text content to a signal.

```typescript
function bindText(el: Node, readable: Readable<string>): () => void
```

```typescript
const name = signal(path("user", "name"), "World");
bindText(document.querySelector('#greeting'), name);
```

### bindHtml

Bind element innerHTML to a signal.

```typescript
function bindHtml(el: Element, readable: Readable<string>): () => void
```

---

## Attributes & Properties

### bindAttribute

Bind an element attribute to a signal.

```typescript
function bindAttribute(
  el: Element,
  attr: string,
  readable: Readable<any>
): () => void
```

```typescript
// Sets or removes the attribute based on value
bindAttribute(img, 'src', imageUrl);        // <img src="...">
bindAttribute(div, 'data-id', itemId);      // <div data-id="...">
bindAttribute(input, 'placeholder', hint);   // <input placeholder="...">
```

### bindProperty

Bind an element property to a signal.

```typescript
function bindProperty<T extends Element, K extends keyof T>(
  el: T,
  prop: K,
  readable: Readable<T[K]>
): () => void
```

```typescript
// Direct property assignment
bindProperty(canvas, 'width', canvasWidth);
bindProperty(input, 'disabled', isDisabled);
```

---

## Classes & Styles

### bindClass

Bind an element's className to a signal.

```typescript
function bindClass(el: Element, readable: Readable<string>): () => void
```

```typescript
bindClass(button, themeClass);  // button.className = themeClass.get()
```

### bindStyle

Bind a single CSS property to a signal.

```typescript
function bindStyle(
  el: HTMLElement,
  styleProp: string,
  readable: Readable<string>
): () => void
```

```typescript
bindStyle(progress, 'width', progressWidth);  // progress.style.width = "50%"
bindStyle(box, 'color', textColor);
```

---

## Visibility & State

### bindVisibility

Show or hide an element based on a boolean signal.

```typescript
function bindVisibility(el: Element, readable: Readable<boolean>): () => void
```

```typescript
bindVisibility(modal, isOpen);  // Adds/removes "hidden" attribute
```

### bindDisabled

Enable or disable an element based on a boolean signal.

```typescript
function bindDisabled(el: Element, readable: Readable<boolean>): () => void
```

```typescript
bindDisabled(submitBtn, isSubmitting);  // Adds/removes "disabled" attribute
```

### bindBooleanAttribute

Add or remove a boolean attribute based on a signal value.

```typescript
function bindBooleanAttribute(
  el: Element,
  attr: string,
  readable: Readable<boolean>
): () => void
```

```typescript
bindBooleanAttribute(div, 'hidden', isHidden);      // <div hidden>
bindBooleanAttribute(input, 'required', isRequired);    // <input required>
```

### bindElementSignal

Move an element into/out of a parent based on a signal value.

```typescript
function bindElementSignal<T extends Element>(
  el: T,
  sig: Signal<T | null>,
  parent: Element
): () => void
```

---

## Events

### bindEvent

Attach an event listener with automatic cleanup.

```typescript
function bindEvent<T extends Element>(
  el: T,
  eventName: string,
  handler: (event: Event) => void,
  options?: AddEventListenerOptions
): () => void
```

```typescript
bindEvent(button, 'click', () => {
  count.set(count.get() + 1);
});

bindEvent(input, 'input', (e) => {
  value.set((e.target as HTMLInputElement).value);
});
```

---

## Form Inputs

### bindInputValue

Two-way bind an input's value to a signal.

```typescript
function bindInputValue(
  input: HTMLInputElement | HTMLTextAreaElement,
  sig: Readable<string>
): () => void
```

```typescript
const username = signal(path("form", "username"), "");
bindInputValue(document.querySelector('#username'), username);
```

### bindInputChecked

Two-way bind a checkbox or radio's checked state.

```typescript
function bindInputChecked(
  input: HTMLInputElement,
  sig: Readable<boolean>
): () => void
```

```typescript
const agreed = signal(path("form", "agreed"), false);
bindInputChecked(document.querySelector('#agree'), agreed);
```

### bindSelectValue

Two-way bind a select element's value.

```typescript
function bindSelectValue(
  select: HTMLSelectElement,
  sig: Readable<string>
): () => void
```

```typescript
const color = signal(path("settings", "color"), "blue");
bindSelectValue(document.querySelector('#color-select'), color);
```

---

## Readable Type

Most bindings accept a `Readable<T>`:

```typescript
type Readable<T> = Signal<T> | Derived<T>;
```

This means you can pass either a signal or a derived value to any binding.
