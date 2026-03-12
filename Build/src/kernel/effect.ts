import { getGlobalActiveComputation, setGlobalActiveComputation } from './dependency';
import { scheduleEffect } from './batch';

export type CleanupFn = (() => void) | void;

let cleanupStack: CleanupFn[] = [];

export function onCleanup(fn: () => void): void {
  cleanupStack.push(fn);
}

function runCleanup(): void {
  while (cleanupStack.length > 0) {
    const fn = cleanupStack.pop();
    if (fn) fn();
  }
}

export function effect(fn: () => CleanupFn): () => void {
  let cleanupFn: CleanupFn;
  let disposed = false;
  let dependencies: Set<any> = new Set();

  const run = () => {
    if (disposed) return;

    runCleanup();
    if (cleanupFn) cleanupFn();

    const previousComputation = getGlobalActiveComputation();
    setGlobalActiveComputation(run);
    
    try {
      cleanupFn = fn();
    } finally {
      setGlobalActiveComputation(previousComputation);
    }
  };

  scheduleEffect(run);

  return () => {
    disposed = true;
    runCleanup();
    if (cleanupFn) {
      if (typeof cleanupFn === 'function') {
        cleanupFn();
      }
    }
  };
}

export function effectSync(fn: () => CleanupFn): () => void {
  let cleanupFn: CleanupFn;
  let disposed = false;

  const run = () => {
    if (disposed) return;

    runCleanup();
    if (cleanupFn) cleanupFn();

    const previousComputation = getGlobalActiveComputation();
    setGlobalActiveComputation(run);
    
    try {
      cleanupFn = fn();
    } finally {
      setGlobalActiveComputation(previousComputation);
    }
  };

  run();

  return () => {
    disposed = true;
    runCleanup();
    if (cleanupFn) {
      if (typeof cleanupFn === 'function') {
        cleanupFn();
      }
    }
  };
}

export function untracked<T>(fn: () => T): T {
  const previousComputation = getGlobalActiveComputation();
  setGlobalActiveComputation(null);
  
  try {
    return fn();
  } finally {
    setGlobalActiveComputation(previousComputation);
  }
}
