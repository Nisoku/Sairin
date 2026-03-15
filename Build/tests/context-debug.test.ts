import { createContext, useContext } from '../src/context';
import { 
  enableDebug, 
  disableDebug, 
  getDebugHooks, 
  notifySignalCreated, 
  notifySignalRead,
  notifySignalWritten,
  captureGraph,
  clearGraph
} from '../src/debug';
import { Signal, path } from '../src/kernel';

describe('Context', () => {
  test('should create context with default value', () => {
    const ctx = createContext('default');
    expect(ctx.defaultValue).toBe('default');
  });

  test('should consume context value', () => {
    const ctx = createContext('default');
    expect(ctx.consume()).toBe('default');
  });

  test('should provide and consume new value', () => {
    const ctx = createContext('default');
    
    const cleanup = ctx.Provider({ value: 'new-value' });
    expect(ctx.consume()).toBe('new-value');
    cleanup();
    expect(ctx.consume()).toBe('default');
  });

  test('should use useContext helper', () => {
    const ctx = createContext(42);
    
    ctx.Provider({ value: 100 });
    expect(useContext(ctx)).toBe(100);
  });

  test('should restore previous value after provider cleanup', () => {
    const ctx = createContext('root');
    
    expect(ctx.consume()).toBe('root');
    
    const cleanup1 = ctx.Provider({ value: 'outer' });
    expect(ctx.consume()).toBe('outer');
    
    cleanup1();
    expect(ctx.consume()).toBe('root');
  });

  test('should handle nested providers', () => {
    const ctx = createContext('root');
    
    const cleanup1 = ctx.Provider({ value: 'outer' });
    expect(ctx.consume()).toBe('outer');
    
    const cleanup2 = ctx.Provider({ value: 'inner' });
    expect(ctx.consume()).toBe('inner');
    
    cleanup2();
    expect(ctx.consume()).toBe('outer');
    
    cleanup1();
    expect(ctx.consume()).toBe('root');
  });
});

describe('Debug', () => {
  test('should enable debug hooks', () => {
    const onSignalCreated = jest.fn();
    enableDebug({ onSignalCreated });
    
    const hooks = getDebugHooks();
    expect(hooks.onSignalCreated).toBe(onSignalCreated);
  });

  test('should disable debug hooks', () => {
    enableDebug({ onSignalCreated: jest.fn() });
    disableDebug();
    
    const hooks = getDebugHooks();
    expect(hooks.onSignalCreated).toBeDefined();
  });

  test('should notify signal created', () => {
    const onSignalCreated = jest.fn();
    enableDebug({ onSignalCreated });
    
    const sig = new Signal(path("debug", "test1"), 42);
    notifySignalCreated(sig, 'test-signal');
    
    expect(onSignalCreated).toHaveBeenCalledWith(sig, 'test-signal');
  });

  test('should notify signal read', () => {
    const onSignalRead = jest.fn();
    enableDebug({ onSignalRead });
    
    const sig = new Signal(path("debug", "test2"), 42);
    notifySignalRead(sig);
    sig.get();
    
    expect(onSignalRead).toHaveBeenCalledWith(sig);
  });

  test('should notify signal written', () => {
    const onSignalWritten = jest.fn();
    enableDebug({ onSignalWritten });
    
    const sig = new Signal(path("debug", "test3"), 42);
    notifySignalWritten(sig, 42, 100);
    
    expect(onSignalWritten).toHaveBeenCalledWith(sig, 42, 100);
  });

  test('should capture graph', () => {
    clearGraph();
    
    const sig1 = new Signal(path("debug", "graph1"), 1);
    const sig2 = new Signal(path("debug", "graph2"), 2);
    
    const graph = captureGraph();
    
    expect(Array.isArray(graph.signals)).toBe(true);
    expect(Array.isArray(graph.effects)).toBe(true);
    expect(Array.isArray(graph.derived)).toBe(true);
  });
});
