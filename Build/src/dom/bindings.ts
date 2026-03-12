import { Signal } from '../kernel/signal';
import { effect, onCleanup } from '../kernel/effect';

export function bindText(el: Node, sig: Signal<string>): () => void {
  const update = () => {
    const value = sig.get();
    if (el.textContent !== value) {
      el.textContent = value;
    }
  };

  return effect(() => {
    update();
  });
}

export function bindHtml(el: Element, sig: Signal<string>): () => void {
  return effect(() => {
    const value = sig.get();
    if (el.innerHTML !== value) {
      el.innerHTML = value;
    }
  });
}

export function bindAttribute(
  el: Element,
  attr: string,
  sig: Signal<any>
): () => void {
  return effect(() => {
    const value = sig.get();
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
  sig: Signal<T[K]>
): () => void {
  return effect(() => {
    const value = sig.get();
    if ((el as any)[prop] !== value) {
      (el as any)[prop] = value;
    }
  });
}

export function bindClass(el: Element, sig: Signal<string>): () => void {
  return effect(() => {
    const value = sig.get();
    el.className = value;
  });
}

export function bindStyle(
  el: HTMLElement,
  styleProp: string,
  sig: Signal<string>
): () => void {
  return effect(() => {
    const value = sig.get();
    (el.style as any)[styleProp] = value;
  });
}

export function bindEvent<T extends Element>(
  el: T,
  eventName: string,
  handler: (event: Event) => void,
  options?: AddEventListenerOptions
): () => void {
  el.addEventListener(eventName, handler, options);
  return () => {
    el.removeEventListener(eventName, handler, options);
  };
}

export function bindInputValue(
  input: HTMLInputElement | HTMLTextAreaElement,
  sig: Signal<string>
): () => void {
  const updateValue = () => {
    const value = sig.get();
    if (input.value !== value) {
      input.value = value;
    }
  };

  const handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    sig.set(target.value);
  };

  updateValue();
  input.addEventListener('input', handleInput);

  return () => {
    input.removeEventListener('input', handleInput);
  };
}

export function bindInputChecked(
  input: HTMLInputElement,
  sig: Signal<boolean>
): () => void {
  const updateChecked = () => {
    input.checked = sig.get();
  };

  const handleChange = () => {
    sig.set(input.checked);
  };

  updateChecked();
  input.addEventListener('change', handleChange);

  return () => {
    input.removeEventListener('change', handleChange);
  };
}

export function bindSelectValue(
  select: HTMLSelectElement,
  sig: Signal<string>
): () => void {
  const updateValue = () => {
    const value = sig.get();
    if (select.value !== value) {
      select.value = value;
    }
  };

  const handleChange = () => {
    sig.set(select.value);
  };

  updateValue();
  select.addEventListener('change', handleChange);

  return () => {
    select.removeEventListener('change', handleChange);
  };
}

export function bindVisibility(
  el: Element,
  sig: Signal<boolean>
): () => void {
  return effect(() => {
    const visible = sig.get();
    if (visible) {
      el.removeAttribute('hidden');
    } else {
      el.setAttribute('hidden', '');
    }
  });
}

export function bindDisabled(
  el: Element,
  sig: Signal<boolean>
): () => void {
  return effect(() => {
    const disabled = sig.get();
    if (disabled) {
      el.setAttribute('disabled', '');
    } else {
      el.removeAttribute('disabled');
    }
  });
}

export function bindElementSignal<T extends Element>(
  el: T,
  sig: Signal<T | null>,
  parent: Element
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
