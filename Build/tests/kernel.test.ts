import { Signal, signal, derived, effect, effectSync, batch, onCleanup, untracked, path } from '../src/kernel';
import { __resetRegistryForTesting } from '../src/kernel/graph';

beforeEach(() => __resetRegistryForTesting());

describe('Signal', () => {
  test('should create signal with initial value', () => {
    const sig = new Signal(path("test", "value"), 42);
    expect(sig.get()).toBe(42);
  });

  test('should notify subscribers on change', () => {
    const sig = new Signal(path("test", "counter"), 0);
    const subscriber = jest.fn();
    sig.subscribe(subscriber);
    
    sig.set(1);
    expect(subscriber).toHaveBeenCalledTimes(1);
    
    sig.set(2);
    expect(subscriber).toHaveBeenCalledTimes(2);
  });

  test('should not notify subscribers when value is same', () => {
    const sig = new Signal(path("test", "same"), 42);
    const subscriber = jest.fn();
    sig.subscribe(subscriber);
    
    sig.set(42);
    expect(subscriber).not.toHaveBeenCalled();
  });

  test('should return unsubscribe function', () => {
    const sig = new Signal(path("test", "unsubscribe"), 0);
    const subscriber = jest.fn();
    const unsubscribe = sig.subscribe(subscriber);
    
    sig.set(1);
    expect(subscriber).toHaveBeenCalledTimes(1);
    
    unsubscribe();
    sig.set(2);
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  test('should use update function', () => {
    const sig = new Signal(path("test", "update"), 5);
    sig.update(v => v * 2);
    expect(sig.get()).toBe(10);
  });

  test('should track dependencies', () => {
    const sig = new Signal(path("test", "source"), 10);
    const d = derived(path("test", "derived"), () => sig.get() * 2);
    expect(d.get()).toBe(20);
  });
});

describe('derived', () => {
  test('should compute value lazily', () => {
    const computeFn = jest.fn(() => 42);
    const d = derived(path("test", "lazy"), computeFn);
    
    expect(computeFn).not.toHaveBeenCalled();
    expect(d.get()).toBe(42);
    expect(computeFn).toHaveBeenCalledTimes(1);
  });

  test('should memoize result until dependencies change', () => {
    const sig = new Signal(path("test", "memo"), 2);
    const computeFn = jest.fn(() => sig.get() * 2);
    const d = derived(path("test", "memo2"), computeFn);
    
    expect(d.get()).toBe(4);
    expect(computeFn).toHaveBeenCalledTimes(1);
    
    expect(d.get()).toBe(4);
    expect(computeFn).toHaveBeenCalledTimes(1);
  });

  test('should recompute when dependencies change', () => {
    const sig = new Signal(path("test", "recompute"), 2);
    const computeFn = jest.fn(() => sig.get() * 2);
    const d = derived(path("test", "recompute2"), computeFn);
    
    expect(d.get()).toBe(4);
    expect(computeFn).toHaveBeenCalledTimes(1);
    
    sig.set(5);
    expect(d.get()).toBe(10);
    expect(computeFn).toHaveBeenCalledTimes(2);
  });

  test('should notify subscribers when value changes', () => {
    const sig = new Signal(path("test", "notify"), 1);
    const d = derived(path("test", "notify2"), () => sig.get() * 2);
    d.get();
    const subscriber = jest.fn();
    d.subscribe(subscriber);
    
    expect(subscriber).not.toHaveBeenCalled();
    sig.set(2);
    expect(subscriber).toHaveBeenCalled();
  });

  test('should return peek without tracking', () => {
    const sig = new Signal(path("test", "peek"), 10);
    const d = derived(path("test", "peek2"), () => sig.get() * 2);
    d.get();
    
    const value = d.peek();
    expect(value).toBe(20);
  });

  test('should support eager derivation', () => {
    const sig = new Signal(path("test", "eager"), 5);
    const d = derived(path("test", "eager2"), () => sig.get() * 2, { eager: true });
    expect(d.get()).toBe(10);
  });

  test('should track multiple dependencies', () => {
    const a = new Signal(path("test", "multi", "a"), 1);
    const b = new Signal(path("test", "multi", "b"), 2);
    const c = new Signal(path("test", "multi", "c"), 3);
    
    const sum = derived(path("test", "multi", "sum"), () => a.get() + b.get() + c.get());
    expect(sum.get()).toBe(6);
    
    a.set(10);
    expect(sum.get()).toBe(15);
    
    b.set(20);
    expect(sum.get()).toBe(33);
    
    c.set(30);
    expect(sum.get()).toBe(60);
  });

  test('should handle derived from derived (chained)', () => {
    const base = new Signal(path("test", "chain", "base"), 2);
    const doubled = derived(path("test", "chain", "doubled"), () => base.get() * 2);
    const quadrupled = derived(path("test", "chain", "quad"), () => doubled.get() * 2);
    
    expect(quadrupled.get()).toBe(8);
    
    base.set(3);
    expect(doubled.get()).toBe(6);
    expect(quadrupled.get()).toBe(12);
  });

  test('should recompute only once when multiple dependencies change in batch', () => {
    const a = new Signal(path("test", "batch", "a"), 1);
    const b = new Signal(path("test", "batch", "b"), 1);
    const computeFn = jest.fn(() => a.get() + b.get());
    const sum = derived(path("test", "batch", "sum"), computeFn);
    
    expect(sum.get()).toBe(2);
    expect(computeFn).toHaveBeenCalledTimes(1);
    
    a.set(5);
    b.set(10);
    expect(sum.get()).toBe(15);
    expect(computeFn).toHaveBeenCalledTimes(2);
  });

  test('should handle complex expressions', () => {
    const items = new Signal(path("test", "expr", "items"), [1, 2, 3, 4, 5]);
    const filter = new Signal(path("test", "expr", "filter"), 3);
    
    const result = derived(path("test", "expr", "result"), () => 
      items.get().filter(n => n >= filter.get())
    );
    
    expect(result.get()).toEqual([3, 4, 5]);
    
    filter.set(4);
    expect(result.get()).toEqual([4, 5]);
    
    items.set([2, 4, 6, 8]);
    expect(result.get()).toEqual([4, 6, 8]);
  });

  test('should handle object transformations', () => {
    const user = new Signal(path("test", "obj", "user"), {
      firstName: 'John',
      lastName: 'Doe',
      age: 30
    });
    
    const fullName = derived(path("test", "obj", "fullName"), () => 
      `${user.get().firstName} ${user.get().lastName}`
    );
    
    expect(fullName.get()).toBe('John Doe');
  });

  test('should handle conditional logic', () => {
    const isLoggedIn = new Signal(path("test", "cond", "login"), true);
    const isPremium = new Signal(path("test", "cond", "premium"), false);
    
    const message = derived(path("test", "cond", "message"), () => {
      if (!isLoggedIn.get()) return 'Please log in';
      if (isPremium.get()) return 'Welcome, premium member!';
      return 'Welcome, free user!';
    });
    
    expect(message.get()).toBe('Welcome, free user!');
    
    isPremium.set(true);
    expect(message.get()).toBe('Welcome, premium member!');
    
    isLoggedIn.set(false);
    expect(message.get()).toBe('Please log in');
  });

  test('should handle computed properties', () => {
    const width = new Signal(path("test", "prop", "width"), 100);
    const height = new Signal(path("test", "prop", "height"), 50);
    
    const area = derived(path("test", "prop", "area"), () => width.get() * height.get());
    const perimeter = derived(path("test", "prop", "perimeter"), () => 2 * (width.get() + height.get()));
    const aspectRatio = derived(path("test", "prop", "ratio"), () => width.get() / height.get());
    
    expect(area.get()).toBe(5000);
    expect(perimeter.get()).toBe(300);
    expect(aspectRatio.get()).toBe(2);
    
    width.set(200);
    expect(area.get()).toBe(10000);
    expect(perimeter.get()).toBe(500);
    expect(aspectRatio.get()).toBe(4);
  });

  test('should work with string operations', () => {
    const template = new Signal(path("test", "str", "template"), 'Hello, {{name}}!');
    const name = new Signal(path("test", "str", "name"), 'World');
    
    const message = derived(path("test", "str", "message"), () => 
      template.get().replace('{{name}}', name.get())
    );
    
    expect(message.get()).toBe('Hello, World!');
    
    name.set('John');
    expect(message.get()).toBe('Hello, John!');
    
    template.set('Hi, {{name}}!');
    expect(message.get()).toBe('Hi, John!');
  });

  test('should handle null and undefined', () => {
    const value = new Signal<string | null>(path("test", "null"), null);
    
    const upper = derived(path("test", "null", "upper"), () => {
      const v = value.get();
      return v ? v.toUpperCase() : 'N/A';
    });
    
    expect(upper.get()).toBe('N/A');
    
    value.set('hello');
    expect(upper.get()).toBe('HELLO');
  });

  test('should handle async-like patterns (throttled)', () => {
    const input = new Signal(path("test", "async", "input"), 'initial');
    const debounced = derived(path("test", "async", "debounced"), () => {
      return input.get();
    });
    
    expect(debounced.get()).toBe('initial');
    
    input.set('first');
    input.set('second');
    input.set('third');
    
    expect(debounced.get()).toBe('third');
  });

  test('should handle computed collections', () => {
    const items = new Signal(path("test", "col", "items"), [
      { name: 'apple', count: 5 },
      { name: 'banana', count: 3 },
      { name: 'cherry', count: 7 }
    ]);
    
    const totalCount = derived(path("test", "col", "total"), () => 
      items.get().reduce((sum, item) => sum + item.count, 0)
    );
    
    const itemNames = derived(path("test", "col", "names"), () => 
      items.get().map(item => item.name).join(', ')
    );
    
    expect(totalCount.get()).toBe(15);
    expect(itemNames.get()).toBe('apple, banana, cherry');
    
    items.set([
      { name: 'date', count: 2 },
      { name: 'elderberry', count: 4 }
    ]);
    
    expect(totalCount.get()).toBe(6);
    expect(itemNames.get()).toBe('date, elderberry');
  });
});

describe('effect', () => {
  test('should run effect immediately', async () => {
    const runFn = jest.fn(() => {});
    effect(runFn);
    await Promise.resolve();
    expect(runFn).toHaveBeenCalled();
  });

  test('should rerun when dependencies change', async () => {
    const sig = new Signal(path("test", "effect"), 0);
    const runFn = jest.fn(() => {
      sig.get();
    });
    effect(runFn);
    await Promise.resolve();
    
    expect(runFn).toHaveBeenCalledTimes(1);
    
    sig.set(1);
    await Promise.resolve();
    expect(runFn).toHaveBeenCalledTimes(2);
  });

  test('should return cleanup function', async () => {
    const sig = new Signal(path("test", "cleanup"), 0);
    const cleanup = jest.fn();
    const runFn = jest.fn(() => cleanup);
    const destroy = effect(runFn);
    
    await Promise.resolve();
    expect(runFn).toHaveBeenCalledTimes(1);
    expect(cleanup).not.toHaveBeenCalled();
    
    destroy();
    expect(cleanup).toHaveBeenCalled();
  });

  test('should call onCleanup functions', () => {
    const cleanup1 = jest.fn();
    const cleanup2 = jest.fn();
    
    effectSync(() => {
      onCleanup(cleanup1);
      onCleanup(cleanup2);
    });
    
    expect(cleanup1).not.toHaveBeenCalled();
    expect(cleanup2).not.toHaveBeenCalled();
  });

  test('should not track dependencies inside untracked', async () => {
    const sig = new Signal(path("test", "untracked"), 1);
    const trackedFn = jest.fn();
    const untrackedFn = jest.fn();
    
    effect(() => {
      trackedFn();
      untracked(() => {
        untrackedFn();
        sig.get();
      });
    });
    
    await Promise.resolve();
    expect(trackedFn).toHaveBeenCalledTimes(1);
    expect(untrackedFn).toHaveBeenCalledTimes(1);
    
    sig.set(2);
    await Promise.resolve();
    expect(trackedFn).toHaveBeenCalledTimes(1);
    expect(untrackedFn).toHaveBeenCalledTimes(1);
  });
});

describe('batch', () => {
  test('should batch updates', () => {
    const sig1 = new Signal(path("test", "batch1"), 0);
    const sig2 = new Signal(path("test", "batch2"), 0);
    const subscriber1 = jest.fn();
    const subscriber2 = jest.fn();
    
    sig1.subscribe(subscriber1);
    sig2.subscribe(subscriber2);
    
    batch(() => {
      sig1.set(1);
      sig2.set(2);
    });
    
    expect(subscriber1).toHaveBeenCalled();
    expect(subscriber2).toHaveBeenCalled();
  });
});

describe('path', () => {
  test('should create simple paths', () => {
    const p = path("user", "name");
    expect(p.raw).toBe("/user/name");
  });
});
