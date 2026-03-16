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
