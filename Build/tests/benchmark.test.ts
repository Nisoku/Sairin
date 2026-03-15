import { Signal, signal, derived, effect, effectSync, batch, path } from '../src/kernel';
import { __resetRegistryForTesting } from '../src/kernel/graph';

describe('Performance Benchmarks', () => {
  beforeEach(() => __resetRegistryForTesting());

  describe('Signal', () => {
    test('signal read should be fast', () => {
      const sig = new Signal(path("bench", "read"), 0);
      const iterations = 100000;
      
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        sig.get();
      }
      const end = performance.now();
      
      const timePerOp = ((end - start) / iterations) * 1000000;
      expect(timePerOp).toBeLessThan(2000);
    });

    test('signal write should scale with subscribers', () => {
      const sig = new Signal(path("bench", "write"), 0);
      const subscriberCount = 10;
      const subscribers: (() => void)[] = [];
      
      for (let i = 0; i < subscriberCount; i++) {
        subscribers.push(() => {});
        sig.subscribe(subscribers[i]);
      }
      
      const iterations = 10000;
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        sig.set(i);
      }
      const end = performance.now();
      
      const timePerOp = ((end - start) / iterations) * 1000;
      expect(timePerOp).toBeLessThan(3);
    });
  });

  describe('Derived', () => {
    test('derived read should be fast when clean', () => {
      const sig = new Signal(path("bench", "derived1"), 1);
      const d = derived(path("bench", "derived2"), () => sig.get() * 2);
      d.get();
      
      const iterations = 100000;
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        d.get();
      }
      const end = performance.now();
      
      const timePerOp = ((end - start) / iterations) * 1000000;
      expect(timePerOp).toBeLessThan(500);
    });

    test('derived should only recompute when dirty', () => {
      const sig = new Signal(path("bench", "derived3"), 1);
      const computeFn = jest.fn(() => sig.get() * 2);
      const d = derived(path("bench", "derived4"), computeFn);
      
      d.get();
      expect(computeFn).toHaveBeenCalledTimes(1);
      
      d.get();
      expect(computeFn).toHaveBeenCalledTimes(1);
      
      sig.set(2);
      d.get();
      expect(computeFn).toHaveBeenCalledTimes(2);
    });

    test('eager derived computes on construction', () => {
      const computeFn = jest.fn(() => 42);
      const d = derived(path("bench", "eager1"), computeFn, { eager: true });
      
      expect(computeFn).toHaveBeenCalledTimes(1);
      expect(d.get()).toBe(42);
    });

    test('lazy derived computes on first access', () => {
      const computeFn = jest.fn(() => 42);
      const d = derived(path("bench", "lazy1"), computeFn);
      
      expect(computeFn).not.toHaveBeenCalled();
      expect(d.get()).toBe(42);
      expect(computeFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Effect', () => {
    test('effect cleanup should be fast', () => {
      const cleanup = jest.fn();
      
      const iterations = 1000;
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        const destroy = effectSync(() => {
          return cleanup;
        });
        destroy();
      }
      const end = performance.now();
      
      expect(cleanup).toHaveBeenCalledTimes(iterations);
      const timePerOp = ((end - start) / iterations);
      expect(timePerOp).toBeLessThan(3);
    });
  });

  describe('Batch', () => {
    test('batch should coalesce multiple updates', () => {
      const sig1 = new Signal(path("bench", "batch1"), 0);
      const sig2 = new Signal(path("bench", "batch2"), 0);
      const subscriber = jest.fn();
      
      sig1.subscribe(subscriber);
      sig2.subscribe(subscriber);
      
      const iterations = 10000;
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        batch(() => {
          sig1.set(i);
          sig2.set(i);
        });
      }
      const end = performance.now();
      
      const timePerOp = ((end - start) / iterations);
      expect(timePerOp).toBeLessThan(3);
    });
  });
});
