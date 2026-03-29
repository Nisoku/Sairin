import { Signal, signal, derived, effect, path } from '../src/kernel';
import { __resetRegistryForTesting } from '../src/kernel/graph';
import { __resetBatchForTesting } from '../src/kernel/batch';
import {
  bindText,
  bindHtml,
  bindAttribute,
  bindProperty,
  bindClass,
  bindStyle,
  bindVisibility,
  bindDisabled,
  type Readable,
} from '../src/dom/bindings';

beforeEach(() => {
  __resetRegistryForTesting();
  __resetBatchForTesting();
});

describe('Readable Types', () => {
  describe('bindText', () => {
    test('works with Signal<string>', async () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      
      const sig = signal(path("test", "text"), "Hello");
      container.textContent = "initial";
      
      bindText(container, sig);
      await Promise.resolve();
      
      expect(container.textContent).toBe("Hello");
      
      sig.set("World");
      await Promise.resolve();
      expect(container.textContent).toBe("World");
      
      document.body.removeChild(container);
    });

    test('works with Derived<string>', async () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      
      const first = signal(path("test", "first"), "Hello");
      const last = signal(path("test", "last"), "World");
      const fullName = derived(path("test", "fullName"), () => `${first.get()} ${last.get()}`);
      
      container.textContent = "initial";
      
      bindText(container, fullName);
      await Promise.resolve();
      
      expect(container.textContent).toBe("Hello World");
      
      first.set("Hi");
      await Promise.resolve();
      expect(container.textContent).toBe("Hi World");
      
      document.body.removeChild(container);
    });

    test('does not update if value is same', async () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      
      const sig = signal(path("test", "sameText"), "Hello");
      bindText(container, sig);
      await Promise.resolve();
      
      const initial = container.textContent;
      sig.set("Hello");
      await Promise.resolve();
      
      expect(container.textContent).toBe(initial);
      
      document.body.removeChild(container);
    });
  });

  describe('bindHtml', () => {
    test('works with Signal<string>', async () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      
      const sig = signal(path("test", "html"), "<strong>Bold</strong>");
      bindHtml(container, sig);
      await Promise.resolve();
      
      expect(container.innerHTML).toBe("<strong>Bold</strong>");
      
      sig.set("<em>Italic</em>");
      await Promise.resolve();
      expect(container.innerHTML).toBe("<em>Italic</em>");
      
      document.body.removeChild(container);
    });

    test('works with Derived<string>', async () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      
      const template = signal(path("test", "template"), "<span>{{name}}</span>");
      const name = signal(path("test", "name"), "John");
      const html = derived(path("test", "html"), () => template.get().replace("{{name}}", name.get()));
      
      bindHtml(container, html);
      await Promise.resolve();
      
      expect(container.innerHTML).toBe("<span>John</span>");
      
      name.set("Jane");
      await Promise.resolve();
      expect(container.innerHTML).toBe("<span>Jane</span>");
      
      document.body.removeChild(container);
    });
  });

  describe('bindAttribute', () => {
    test('works with Signal<string>', async () => {
      const el = document.createElement('div');
      document.body.appendChild(el);
      
      const sig = signal(path("test", "attr"), "value123");
      bindAttribute(el, "data-value", sig);
      await Promise.resolve();
      
      expect(el.getAttribute("data-value")).toBe("value123");
      
      sig.set("newValue");
      await Promise.resolve();
      expect(el.getAttribute("data-value")).toBe("newValue");
      
      document.body.removeChild(el);
    });

    test('works with Derived<string>', async () => {
      const el = document.createElement('div');
      document.body.appendChild(el);
      
      const prefix = signal(path("test", "prefix"), "id-");
      const id = signal(path("test", "id"), "123");
      const fullId = derived(path("test", "fullId"), () => `${prefix.get()}${id.get()}`);
      
      bindAttribute(el, "id", fullId);
      await Promise.resolve();
      
      expect(el.getAttribute("id")).toBe("id-123");
      
      id.set("456");
      await Promise.resolve();
      expect(el.getAttribute("id")).toBe("id-456");
      
      document.body.removeChild(el);
    });

    test('removes attribute when value is null', async () => {
      const el = document.createElement('div');
      el.setAttribute("data-value", "initial");
      document.body.appendChild(el);
      
      const sig = signal<string | null>(path("test", "nullable"), "visible");
      bindAttribute(el, "data-value", sig);
      await Promise.resolve();
      
      expect(el.getAttribute("data-value")).toBe("visible");
      
      sig.set(null);
      await Promise.resolve();
      expect(el.getAttribute("data-value")).toBe(null);
      
      document.body.removeChild(el);
    });
  });

  describe('bindProperty', () => {
    test('works with Signal<string>', async () => {
      const el = document.createElement('input');
      document.body.appendChild(el);
      
      const sig = signal(path("test", "prop"), "test value");
      bindProperty(el, "value", sig);
      await Promise.resolve();
      
      expect((el as HTMLInputElement).value).toBe("test value");
      
      sig.set("new value");
      await Promise.resolve();
      expect((el as HTMLInputElement).value).toBe("new value");
      
      document.body.removeChild(el);
    });

    test('works with Derived<string> for title', async () => {
      const el = document.createElement('div');
      document.body.appendChild(el);
      
      const base = signal(path("test", "base"), "Page");
      const suffix = signal(path("test", "suffix"), " | App");
      const title = derived(path("test", "title"), () => base.get() + suffix.get());
      
      bindProperty(el, "title", title);
      await Promise.resolve();
      
      expect((el as any).title).toBe("Page | App");
      
      suffix.set(": Dashboard");
      await Promise.resolve();
      expect((el as any).title).toBe("Page: Dashboard");
      
      document.body.removeChild(el);
    });
  });

  describe('bindClass', () => {
    test('works with Signal<string>', async () => {
      const el = document.createElement('div');
      document.body.appendChild(el);
      
      const sig = signal(path("test", "class"), "active highlight");
      bindClass(el, sig);
      await Promise.resolve();
      
      expect(el.className).toBe("active highlight");
      
      sig.set("inactive");
      await Promise.resolve();
      expect(el.className).toBe("inactive");
      
      document.body.removeChild(el);
    });

    test('works with Derived<string>', async () => {
      const el = document.createElement('div');
      document.body.appendChild(el);
      
      const base = signal(path("test", "base"), "base-class");
      const extra = signal(path("test", "extra"), "extra-class");
      const combined = derived(path("test", "combined"), () => `${base.get()} ${extra.get()}`);
      
      bindClass(el, combined);
      await Promise.resolve();
      
      expect(el.className).toBe("base-class extra-class");
      
      extra.set("another-class");
      await Promise.resolve();
      expect(el.className).toBe("base-class another-class");
      
      document.body.removeChild(el);
    });
  });

  describe('bindStyle', () => {
    test('works with Signal<string>', async () => {
      const el = document.createElement('div');
      document.body.appendChild(el);
      
      const sig = signal(path("test", "color"), "red");
      bindStyle(el, "color", sig);
      await Promise.resolve();
      
      expect(el.style.color).toBe("red");
      
      sig.set("blue");
      await Promise.resolve();
      expect(el.style.color).toBe("blue");
      
      document.body.removeChild(el);
    });

    test('works with Derived<string>', async () => {
      const el = document.createElement('div');
      document.body.appendChild(el);
      
      const hue = signal(path("test", "hue"), 0);
      const color = derived(path("test", "color"), () => {
        const h = hue.get();
        return h === 0 ? "red" : h === 120 ? "green" : "blue";
      });
      
      bindStyle(el, "color", color);
      await Promise.resolve();
      await Promise.resolve();
      
      expect(el.style.color).toBe("red");
      
      hue.set(120);
      await Promise.resolve();
      await Promise.resolve();
      expect(el.style.color).toBe("green");
      
      document.body.removeChild(el);
    });
  });

  describe('bindVisibility', () => {
    test('works with Signal<boolean>', async () => {
      const el = document.createElement('div');
      el.setAttribute("hidden", "");
      document.body.appendChild(el);
      
      const sig = signal(path("test", "visible"), true);
      bindVisibility(el, sig);
      await Promise.resolve();
      
      expect(el.hasAttribute("hidden")).toBe(false);
      
      sig.set(false);
      await Promise.resolve();
      expect(el.hasAttribute("hidden")).toBe(true);
      
      document.body.removeChild(el);
    });

    test('works with Derived<boolean>', async () => {
      const el = document.createElement('div');
      el.setAttribute("hidden", "");
      document.body.appendChild(el);
      
      const isLoggedIn = signal(path("test", "loggedIn"), true);
      const isPremium = signal(path("test", "premium"), false);
      const showContent = derived(path("test", "show"), () => isLoggedIn.get() && isPremium.get());
      
      bindVisibility(el, showContent);
      await Promise.resolve();
      
      expect(el.hasAttribute("hidden")).toBe(true);
      
      isPremium.set(true);
      await Promise.resolve();
      expect(el.hasAttribute("hidden")).toBe(false);
      
      document.body.removeChild(el);
    });
  });

  describe('bindDisabled', () => {
    test('works with Signal<boolean>', async () => {
      const el = document.createElement('button');
      el.disabled = false;
      document.body.appendChild(el);
      
      const sig = signal(path("test", "disabled"), true);
      bindDisabled(el, sig);
      await Promise.resolve();
      
      expect(el.disabled).toBe(true);
      
      sig.set(false);
      await Promise.resolve();
      expect(el.disabled).toBe(false);
      
      document.body.removeChild(el);
    });

    test('works with Derived<boolean>', async () => {
      const el = document.createElement('button');
      document.body.appendChild(el);
      
      const isAdmin = signal(path("test", "admin"), false);
      const isOwner = signal(path("test", "owner"), true);
      const canEdit = derived(path("test", "canEdit"), () => isAdmin.get() || isOwner.get());
      
      bindDisabled(el, canEdit);
      await Promise.resolve();
      
      expect(el.disabled).toBe(true);
      
      isAdmin.set(true);
      await Promise.resolve();
      expect(el.disabled).toBe(true);
      
      isOwner.set(false);
      await Promise.resolve();
      expect(el.disabled).toBe(true);
      
      isAdmin.set(false);
      await Promise.resolve();
      expect(el.disabled).toBe(false);
      
      document.body.removeChild(el);
    });
  });

  describe('Edge cases', () => {
    test('binding cleanup removes effect', async () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      
      const sig = signal(path("test", "cleanup"), "initial");
      const dispose = bindText(container, sig);
      await Promise.resolve();
      
      expect(container.textContent).toBe("initial");
      
      dispose();
      
      sig.set("after cleanup");
      await Promise.resolve();
      
      expect(container.textContent).toBe("initial");
      
      document.body.removeChild(container);
    });

    test('multiple bindings on same element', async () => {
      const el = document.createElement('div');
      document.body.appendChild(el);
      
      const text = signal(path("test", "multiText"), "Hello");
      const color = signal(path("test", "multiColor"), "red");
      const hidden = signal(path("test", "multiHidden"), true);
      
      bindText(el, text);
      bindStyle(el, "color", color);
      bindVisibility(el, hidden);
      await Promise.resolve();
      
      expect(el.textContent).toBe("Hello");
      expect(el.style.color).toBe("red");
      expect(el.hasAttribute("hidden")).toBe(false);
      
      document.body.removeChild(el);
    });

    test('derived with complex computations', async () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      
      const items = signal(path("test", "items"), [1, 2, 3]);
      const filter = signal(path("test", "filter"), 2);
      const filtered = derived(path("test", "filtered"), () => 
        items.get().filter(n => n >= filter.get()).join(', ')
      );
      
      bindText(container, filtered);
      await Promise.resolve();
      
      expect(container.textContent).toBe("2, 3");
      
      filter.set(1);
      await Promise.resolve();
      expect(container.textContent).toBe("1, 2, 3");
      
      document.body.removeChild(container);
    });

    test('binding to null values', async () => {
      const el = document.createElement('div');
      el.setAttribute("data-test", "initial");
      document.body.appendChild(el);
      
      const sig = signal<string | null>(path("test", "null"), null);
      bindAttribute(el, "data-test", sig);
      await Promise.resolve();
      
      expect(el.getAttribute("data-test")).toBe(null);
      
      sig.set("has value");
      await Promise.resolve();
      expect(el.getAttribute("data-test")).toBe("has value");
      
      document.body.removeChild(el);
    });
  });
});

describe('Integration Patterns', () => {
  test('computed display with conditional styling', async () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    
    const status = signal(path("status", "value"), "success");
    const message = signal(path("status", "message"), "Operation completed");
    
    const className = derived(path("status", "class"), () => {
      switch (status.get()) {
        case "success": return "alert alert-success";
        case "error": return "alert alert-error";
        case "warning": return "alert alert-warning";
        default: return "alert";
      }
    });
    
    bindClass(el, className);
    bindText(el, message);
    await Promise.resolve();
    
    expect(el.className).toBe("alert alert-success");
    expect(el.textContent).toBe("Operation completed");
    
    status.set("error");
    message.set("Something went wrong");
    await Promise.resolve();
    
    expect(el.className).toBe("alert alert-error");
    expect(el.textContent).toBe("Something went wrong");
    
    document.body.removeChild(el);
  });

  test('form validation state', async () => {
    const emailInput = document.createElement('input');
    const errorMsg = document.createElement('div');
    document.body.appendChild(emailInput);
    document.body.appendChild(errorMsg);
    
    const email = signal(path("form", "email"), "test@example.com");
    const touched = signal(path("form", "touched"), false);
    
    const isValid = derived(path("form", "valid"), () => email.get().includes("@"));
    const isValidClass = derived(path("form", "validClass"), () => isValid.get() ? "valid" : "invalid");
    const showError = derived(path("form", "showError"), () => touched.get() && !isValid.get());
    const errorText = derived(path("form", "errorText"), () => showError.get() ? "Invalid email" : "");
    
    bindClass(emailInput, isValidClass);
    bindText(errorMsg, errorText);
    bindVisibility(errorMsg, showError);
    await Promise.resolve();
    
    expect(emailInput.className).toBe("valid");
    expect(errorMsg.hasAttribute("hidden")).toBe(true);
    
    touched.set(true);
    await Promise.resolve();
    expect(showError.get()).toBe(false);
    
    email.set("invalid");
    await Promise.resolve();
    expect(showError.get()).toBe(true);
    expect(errorMsg.textContent).toBe("Invalid email");
    
    document.body.removeChild(emailInput);
    document.body.removeChild(errorMsg);
  });

  test('shopping cart total calculation', async () => {
    const items = signal(path("cart", "items"), [
      { name: "Apple", price: 1.5, quantity: 3 },
      { name: "Banana", price: 0.5, quantity: 5 }
    ]);
    
    const subtotal = derived(path("cart", "subtotal"), () =>
      items.get().reduce((sum, item) => sum + item.price * item.quantity, 0)
    );
    
    const tax = derived(path("cart", "tax"), () => subtotal.get() * 0.1);
    const total = derived(path("cart", "total"), () => subtotal.get() + tax.get());
    
    expect(subtotal.get()).toBe(7);
    expect(tax.get()).toBeCloseTo(0.7, 2);
    expect(total.get()).toBeCloseTo(7.7, 2);
    
    items.set([
      { name: "Apple", price: 1.5, quantity: 10 }
    ]);
    
    expect(subtotal.get()).toBe(15);
    expect(tax.get()).toBeCloseTo(1.5, 2);
    expect(total.get()).toBeCloseTo(16.5, 2);
  });
});
