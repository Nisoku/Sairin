import { Signal } from "../kernel/signal";
import { Derived } from "../kernel/derived";

export interface DebugHooks {
  onSignalCreated?: (signal: Signal<unknown>, name?: string) => void;
  onSignalRead?: (signal: Signal<unknown>) => void;
  onSignalWritten?: (
    signal: Signal<unknown>,
    oldValue: unknown,
    newValue: unknown,
  ) => void;
  onEffectCreated?: (effect: () => void) => void;
  onEffectRun?: (effect: () => void) => void;
  onDerivedInvalidated?: (derived: Derived<unknown>) => void;
}

const defaultHooks: DebugHooks = {
  onSignalCreated: () => {},
  onSignalRead: () => {},
  onSignalWritten: () => {},
  onEffectCreated: () => {},
  onEffectRun: () => {},
  onDerivedInvalidated: () => {},
};

let debugHooks: DebugHooks = { ...defaultHooks };

export function enableDebug(hooks: Partial<DebugHooks>): void {
  debugHooks = { ...defaultHooks, ...hooks };
}

export function disableDebug(): void {
  debugHooks = { ...defaultHooks };
}

export function getDebugHooks(): DebugHooks {
  return debugHooks;
}

export function notifySignalCreated(
  signal: Signal<unknown>,
  name?: string,
): void {
  debugHooks.onSignalCreated?.(signal, name);
}

export function notifySignalRead(signal: Signal<unknown>): void {
  debugHooks.onSignalRead?.(signal);
}

export function notifySignalWritten(
  signal: Signal<unknown>,
  oldValue: unknown,
  newValue: unknown,
): void {
  debugHooks.onSignalWritten?.(signal, oldValue, newValue);
}

export function notifyEffectCreated(effect: () => void): void {
  debugHooks.onEffectCreated?.(effect);
}

export function notifyEffectRun(effect: () => void): void {
  debugHooks.onEffectRun?.(effect);
}

export function notifyDerivedInvalidated(derived: Derived<unknown>): void {
  debugHooks.onDerivedInvalidated?.(derived);
}

export interface GraphSnapshotSignal {
  id: number;
  value: unknown;
  subscriberCount: number;
}

export interface GraphSnapshotEffect {
  id: number;
  dependencies: number[];
}

export interface GraphSnapshotDerived {
  id: number;
  cached: unknown;
  dirty: boolean;
  dependencies: number[];
}

export interface GraphSnapshot {
  signals: GraphSnapshotSignal[];
  effects: GraphSnapshotEffect[];
  derived: GraphSnapshotDerived[];
}

const registeredSignals = new Map<number, Signal<unknown>>();
const registeredEffects = new Map<number, () => void>();
const registeredDerived = new Map<number, Derived<unknown>>();

export function registerSignal(signal: Signal<unknown>): void {
  registeredSignals.set(signal.id, signal);
}

export function registerEffect(effect: () => void, id: number): void {
  registeredEffects.set(id, effect);
}

export function registerDerived(derived: Derived<unknown>): void {
  registeredDerived.set(derived.id, derived);
}

export function captureGraph(): GraphSnapshot {
  const signals: GraphSnapshotSignal[] = [];
  const effects: GraphSnapshotEffect[] = [];
  const derived: GraphSnapshotDerived[] = [];

  registeredSignals.forEach((signal) => {
    signals.push({
      id: signal.id,
      value: signal.peek(),
      subscriberCount: signal.getSubscriberCount(),
    });
  });

  registeredEffects.forEach((_effect) => {
    effects.push({
      id: 0,
      dependencies: [],
    });
  });

  registeredDerived.forEach((d) => {
    derived.push({
      id: d.id,
      cached: d.peek(),
      dirty: d.isDirty(),
      dependencies: [],
    });
  });

  return { signals, effects, derived };
}

export function clearGraph(): void {
  registeredSignals.clear();
  registeredEffects.clear();
  registeredDerived.clear();
}
