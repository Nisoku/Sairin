export type Subscriber = () => void;

let globalActiveComputation: (() => void) | null = null;
let globalIdCounter = 0;

export function getGlobalActiveComputation(): (() => void) | null {
  return globalActiveComputation;
}

export function setGlobalActiveComputation(
  computation: (() => void) | null,
): void {
  globalActiveComputation = computation;
}

export function generateId(): number {
  return ++globalIdCounter;
}

let uniqueIdCounter = 0;
let uniqueIdRandom = Math.random().toString(36).slice(2, 8);

export function generateUniqueId(): string {
  uniqueIdCounter++;
  return `${uniqueIdRandom}${uniqueIdCounter.toString(36)}`;
}

export function trackDependency(signal: {
  subscribe: (fn: Subscriber) => () => void;
}): void {
  if (globalActiveComputation) {
    signal.subscribe(globalActiveComputation);
  }
}
