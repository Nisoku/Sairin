import { flow, pipeline, sequence, parallel, race } from '../src/flow';
import { resource, useTransition, useDeferredValue } from '../src/async';
import { Signal, signal, effect, path } from '../src/kernel';
import { __resetRegistryForTesting } from '../src/kernel/graph';

beforeEach(() => __resetRegistryForTesting());

describe('Flow', () => {
  test('should execute async function', async () => {
    const myFlow = flow(async () => {
      return 42;
    });
    
    await myFlow.start();
    expect(myFlow.result.get()).toBe(42);
    expect(myFlow.running.get()).toBe(false);
  });

  test('should set error on failure', async () => {
    const myFlow = flow(async () => {
      throw new Error('Test error');
    });
    
    await myFlow.start();
    expect(myFlow.error.get()).toBeInstanceOf(Error);
  });

  test('should cancel flow', async () => {
    const myFlow = flow(async (abortSignal) => {
      return new Promise((resolve, reject) => {
        abortSignal.addEventListener('abort', () => {
          reject(new Error('AbortError'));
        });
      });
    });
    
    const startPromise = myFlow.start();
    myFlow.cancel();
    
    await startPromise;
    expect(myFlow.running.get()).toBe(false);
  });

  test('should not start if already running', async () => {
    let counter = 0;
    const myFlow = flow(async () => {
      counter++;
      await new Promise(resolve => setTimeout(resolve, 50));
      return counter;
    });
    
    myFlow.start();
    await myFlow.start();
    
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(counter).toBe(1);
  });
});

describe('Pipeline', () => {
  test('should pass input to function', async () => {
    const p = pipeline(async (input: number) => {
      return input * 2;
    });
    
    await p.start(21);
    expect(p.result.get()).toBe(42);
  });
});

describe('Sequence', () => {
  test('should execute functions in order', async () => {
    const seq = sequence(
      async () => 1,
      async () => 2,
      async () => 3
    );
    
    await seq.start();
    expect(seq.results.get()).toEqual([1, 2, 3]);
  });
});

describe('Parallel', () => {
  test('should execute functions in parallel', async () => {
    const par = parallel(
      async () => 1,
      async () => 2,
      async () => 3
    );
    
    await par.start();
    expect(par.results.get()).toContain(1);
    expect(par.results.get()).toContain(2);
    expect(par.results.get()).toContain(3);
  });
});

describe('Race', () => {
  test('should return first resolved value', async () => {
    const r = race(
      async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'slow';
      },
      async () => 'fast'
    );
    
    await r.start();
    expect(r.result.get()).toBe('fast');
  });
});

describe('Resource', () => {
  test('should load data', async () => {
    const res = resource(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return 'data';
    });
    
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(res.value.get()).toBe('data');
    expect(res.loading.get()).toBe(false);
  });

  test('should handle error', async () => {
    const res = resource(async () => {
      throw new Error('Load failed');
    });
    
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(res.error.get()).toBeInstanceOf(Error);
    expect(res.loading.get()).toBe(false);
  });

  test('should refetch', async () => {
    let counter = 0;
    const res = resource(async () => {
      counter++;
      return counter;
    });

    await new Promise(resolve => setTimeout(resolve, 20));
    expect(res.value.get()).toBe(1);

    res.refetch();
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(res.value.get()).toBe(2);
  });
});

describe('Transition', () => {
  test('should track pending state', () => {
    const { pending, start } = useTransition();
    
    expect(pending.get()).toBe(false);
    
    start(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    
    expect(pending.get()).toBe(true);
  });

  test('should defer value updates', async () => {
    const sig = signal(path("test", "defer"), 0);
    const deferred = useDeferredValue(sig, 10);
    
    sig.set(1);
    expect(deferred.get()).toBe(0);
    
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(deferred.get()).toBe(1);
  });
});
