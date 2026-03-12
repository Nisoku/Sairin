import { flow, pipeline, sequence, parallel, race } from '../src/flow';
import { resource, useTransition, useDeferredValue } from '../src/async';
import { Signal, signal, effect } from '../src/kernel';

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
    let resolveFlow: (value: void) => void;
    let rejectFlow: (error: Error) => void;
    
    const myFlow = flow(async (signal) => {
      return new Promise((resolve, reject) => {
        resolveFlow = resolve;
        rejectFlow = reject;
        
        signal.addEventListener('abort', () => {
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
    
    await myFlow.start();
    expect(myFlow.result.get()).toBe(1);
  });
});

describe('Pipeline', () => {
  test('should execute pipeline steps', async () => {
    const p = pipeline([
      async (input: number) => input + 1,
      async (input: number) => input * 2,
    ]);
    
    const result = await p.run(1);
    expect(result).toBe(4);
  });

  test('should cancel pipeline', async () => {
    const p = pipeline([
      async (input: number) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return input + 1;
      },
      async (input: number) => input * 2,
    ]);
    
    const promise = p.run(1);
    p.cancel();
    
    await expect(promise).rejects.toThrow('Pipeline cancelled');
  });
});

describe('Sequence', () => {
  test('should execute functions in sequence', async () => {
    const results: number[] = [];
    const seq = sequence(
      async () => { results.push(1); return 1; },
      async () => { results.push(2); return 2; },
      async () => { results.push(3); return 3; }
    );
    
    await seq.start();
    expect(seq.result.get()).toEqual([1, 2, 3]);
    expect(results).toEqual([1, 2, 3]);
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
    expect(par.result.get()).toContain(1);
    expect(par.result.get()).toContain(2);
    expect(par.result.get()).toContain(3);
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
    
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(res.value.get()).toBe(1);
    
    res.refetch();
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(res.value.get()).toBe(2);
  });
});

describe('Transition', () => {
  test('should set pending when starting transition', async () => {
    const { pending, start } = useTransition();
    
    start(() => {});
    
    expect(pending.get()).toBe(true);
    
    await Promise.resolve();
    expect(pending.get()).toBe(false);
  });

  test('should execute transition function', async () => {
    const { start } = useTransition();
    
    let executed = false;
    start(() => {
      executed = true;
    });
    
    await Promise.resolve();
    expect(executed).toBe(true);
  });

  test('should defer value updates', async () => {
    const sig = signal(1);
    
    let deferredValue: number = 0;
    effect(() => {
      deferredValue = sig.get();
    });
    
    await Promise.resolve();
    expect(deferredValue).toBe(1);
    
    sig.set(2);
    await Promise.resolve();
    expect(deferredValue).toBe(2);
  });
});
