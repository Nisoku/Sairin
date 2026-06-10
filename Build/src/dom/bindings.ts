import { Signal } from "../kernel/signal";
import { Derived } from "../kernel/derived";
import { effect, onCleanup } from "../kernel/effect";

export type Readable<T> = Signal<T> | Derived<T>;

export function bindText(el: Node, readable: Readable<string>): () => void {
  const update = () => {
    const value = readable.get();
    if (el.textContent !== value) {
      el.textContent = value;
    }
  };

  return effect(() => {
    update();
  });
}

export function bindHtml(el: Element, readable: Readable<string>): () => void {
  return effect(() => {
    const value = readable.get();
    if (el.innerHTML !== value) {
      el.innerHTML = value;
    }
  });
}

export function bindAttribute(
  el: Element,
  attr: string,
  readable: Readable<any>,
): () => void {
  return effect(() => {
    const value = readable.get();
    if (value == null) {
      el.removeAttribute(attr);
    } else {
      el.setAttribute(attr, String(value));
    }
  });
}

export function bindProperty<T extends Element, K extends keyof T>(
  el: T,
  prop: K,
  readable: Readable<T[K]>,
): () => void {
  return effect(() => {
    const value = readable.get();
    if ((el as any)[prop] !== value) {
      (el as any)[prop] = value;
    }
  });
}

export function bindClass(el: Element, readable: Readable<string>): () => void {
  return effect(() => {
    const value = readable.get();
    el.className = value;
  });
}

export function bindStyle(
  el: HTMLElement,
  styleProp: string,
  readable: Readable<string>,
): () => void {
  return effect(() => {
    const value = readable.get();
    (el.style as any)[styleProp] = value;
  });
}

export function bindEvent<T extends Element>(
  el: T,
  eventName: string,
  handler: (event: Event) => void,
  options?: AddEventListenerOptions,
): () => void {
  el.addEventListener(eventName, handler, options);
  return () => {
    el.removeEventListener(eventName, handler, options);
  };
}

export function bindInputValue(
  input: HTMLInputElement | HTMLTextAreaElement,
  sig: Readable<string>,
): () => void {
  const updateValue = () => {
    const value = sig.get();
    if (input.value !== value) {
      input.value = value;
    }
  };

  const handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    if ("set" in sig && typeof (sig as Signal<string>).set === "function") {
      (sig as Signal<string>).set(target.value);
    }
  };

  input.addEventListener("input", handleInput);

  const disposeEffect = effect(() => {
    updateValue();
  });

  return () => {
    input.removeEventListener("input", handleInput);
    disposeEffect();
  };
}

export function bindInputChecked(
  input: HTMLInputElement,
  sig: Readable<boolean>,
): () => void {
  const updateChecked = () => {
    input.checked = sig.get();
  };

  const handleChange = () => {
    if ("set" in sig && typeof (sig as Signal<boolean>).set === "function") {
      (sig as Signal<boolean>).set(input.checked);
    }
  };

  input.addEventListener("change", handleChange);

  return effect(() => {
    updateChecked();
    return () => {
      input.removeEventListener("change", handleChange);
    };
  });
}

export function bindSelectValue(
  select: HTMLSelectElement,
  sig: Readable<string>,
): () => void {
  const updateValue = () => {
    const value = sig.get();
    if (select.value !== value) {
      select.value = value;
    }
  };

  const handleChange = () => {
    if ("set" in sig && typeof (sig as Signal<string>).set === "function") {
      (sig as Signal<string>).set(select.value);
    }
  };

  select.addEventListener("change", handleChange);

  return effect(() => {
    updateValue();
    return () => {
      select.removeEventListener("change", handleChange);
    };
  });
}

export function bindVisibility(
  el: Element,
  readable: Readable<boolean>,
): () => void {
  return effect(() => {
    const visible = readable.get();
    if (visible) {
      el.removeAttribute("hidden");
    } else {
      el.setAttribute("hidden", "");
    }
  });
}

export function bindDisabled(
  el: Element,
  readable: Readable<boolean>,
): () => void {
  return effect(() => {
    const disabled = readable.get();
    if (disabled) {
      el.setAttribute("disabled", "");
    } else {
      el.removeAttribute("disabled");
    }
  });
}

export function bindBooleanAttribute(
  el: Element,
  attr: string,
  readable: Readable<boolean>,
): () => void {
  return effect(() => {
    const value = readable.get();
    if (value) {
      el.setAttribute(attr, "");
    } else {
      el.removeAttribute(attr);
    }
  });
}

export function bindElementSignal<T extends Element>(
  el: T,
  sig: Signal<T | null>,
  parent: Element,
): () => void {
  return effect(() => {
    const target = sig.get();
    if (target === el) {
      if (!parent.contains(el)) {
        parent.appendChild(el);
      }
    }
  });
}

export interface Binding {
  destroy: () => void;
}

export function createBinding(destroyFn: () => void): Binding {
  return { destroy: destroyFn };
}
