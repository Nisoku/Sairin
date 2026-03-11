export type Subscriber = () => void;

let globalActiveComputation: (() => void) | null = null;
let globalIdCounter = 0;

export function getGlobalActiveComputation(): (() => void) | null {
  return globalActiveComputation;
}

export function setGlobalActiveComputation(computation: (() => void) | null): void {
  globalActiveComputation = computation;
}

export function generateId(): number {
  return ++globalIdCounter;
}

export function trackDependency(signal: { subscribe: (fn: Subscriber) => () => void }): void {
  if (globalActiveComputation) {
    signal.subscribe(globalActiveComputation);
  }
}
