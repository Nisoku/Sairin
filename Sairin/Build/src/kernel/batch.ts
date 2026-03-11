type EffectFn = () => void;

let pendingEffects = new Set<EffectFn>();
let flushScheduled = false;
let batchDepth = 0;

export function scheduleEffect(fn: EffectFn): void {
  pendingEffects.add(fn);
  if (!flushScheduled) {
    flushScheduled = true;
    queueMicrotask(() => {
      flushScheduled = false;
      const effects = [...pendingEffects];
      pendingEffects.clear();
      effects.forEach((effect) => effect());
    });
  }
}

export function batch(fn: () => void): void {
  const previousDepth = batchDepth;
  batchDepth++;
  
  try {
    fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0 && pendingEffects.size > 0) {
      const effects = [...pendingEffects];
      pendingEffects.clear();
      effects.forEach((effect) => effect());
    }
  }
}

export function isFlushing(): boolean {
  return flushScheduled;
}

export function hasPendingEffects(): boolean {
  return pendingEffects.size > 0;
}
