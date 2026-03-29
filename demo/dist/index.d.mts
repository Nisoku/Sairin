import { SatoriInstance } from '@nisoku/satori';

type Subscriber = () => void;
declare function getGlobalActiveComputation(): (() => void) | null;
declare function setGlobalActiveComputation(computation: (() => void) | null): void;
declare function generateId(): number;
declare function generateUniqueId(): string;
declare function trackDependency(signal: {
    subscribe: (fn: Subscriber) => () => void;
}): void;

interface PathKey {
    readonly segments: readonly string[];
    readonly raw: string;
    readonly isGlob: boolean;
    readonly globType: "none" | "shallow" | "deep";
}
declare function path(...parts: (string | number)[]): PathKey;
declare function isPathKey(value: unknown): value is PathKey;
declare function matchesPath(pattern: PathKey, target: PathKey): boolean;
declare function getParentPath(p: PathKey): PathKey | null;
declare function joinPath(base: PathKey, ...parts: string[]): PathKey;

type ReactiveKind = "signal" | "derived" | "effect";
interface ReactiveNode {
    readonly path: PathKey;
    readonly kind: ReactiveKind;
    version: number;
    subscribers: Set<Subscriber>;
}
declare function getOrCreateNode<T>(p: PathKey, kind: ReactiveKind): ReactiveNode;
declare function getNode(p: PathKey): ReactiveNode | undefined;
declare function hasNode(p: PathKey): boolean;
declare function deleteNode(p: PathKey): boolean;
declare function getAllNodes(): Iterable<ReactiveNode>;
declare function getNodesUnder(prefix: PathKey): ReactiveNode[];
declare function subscribe(node: ReactiveNode, fn: Subscriber): () => void;
declare function unsubscribe(node: ReactiveNode, fn: Subscriber): void;
declare function notifySubscribers(node: ReactiveNode): void;
declare function watch(pattern: PathKey, callback: (path: PathKey, kind: ReactiveKind) => void): () => void;
declare function alias(aliasPath: PathKey, targetPath: PathKey): void;
declare function resolveAlias(path: PathKey): PathKey | undefined;
declare function unalias(aliasPath: PathKey): boolean;
declare function isAlias(path: PathKey): boolean;
declare function trackNode(node: ReactiveNode): void;
declare function __resetRegistryForTesting(): void;
declare function lock(path: PathKey, options: {
    owner: string;
    shallow?: boolean;
}): void;
declare function unlock(path: PathKey): void;
declare function isLocked(path: PathKey): boolean;
declare function checkLock(path: PathKey, owner: string): boolean;
declare function assertLock(path: PathKey, owner: string, attemptedOwner?: string): boolean;
declare function scheduleIncrementalCleanup(nodes: ReactiveNode[], options?: {
    chunkSize?: number;
}): void;
declare function capRetainedMemory(nodes: ReactiveNode[]): void;

declare class Signal<T> {
    readonly id: number;
    readonly path: PathKey;
    private _node;
    constructor(path: PathKey, initial: T, forceSet?: boolean);
    get(): T;
    set(next: T, options?: {
        owner?: string;
    }): void;
    update(fn: (value: T) => T, options?: {
        owner?: string;
    }): void;
    subscribe(fn: Subscriber): () => void;
    unsubscribe(fn: Subscriber): void;
    getSubscriberCount(): number;
    peek(): T;
    get version(): number;
}
declare function signal<T>(pathOrInitial: PathKey | T, initial?: T): Signal<T>;
declare function isSignal<T>(value: unknown): value is Signal<T>;

interface DerivedOptions {
    eager?: boolean;
}
declare class Derived<T> {
    readonly id: number;
    readonly path: PathKey;
    private _node;
    private _tracker;
    private _sources;
    private _isComputing;
    constructor(path: PathKey, fn: () => T, options?: DerivedOptions);
    private recompute;
    get(): T;
    subscribe(fn: Subscriber): () => void;
    unsubscribe(fn: Subscriber): void;
    getSubscriberCount(): number;
    isDirty(): boolean;
    peek(): T;
    get version(): number;
}
declare function derived<T>(path: PathKey, fn: () => T, options?: DerivedOptions): Derived<T>;

type CleanupFn = (() => void) | void;
declare function onCleanup(fn: () => void): void;
declare const effect: (fn: () => CleanupFn) => () => void;
declare const effectSync: (fn: () => CleanupFn) => () => void;
declare const effectIdle: (fn: () => CleanupFn) => () => void;
declare function untracked<T>(fn: () => T): T;

type EffectFn = () => void;
declare function scheduleEffect(fn: EffectFn): void;
declare function batch(fn: () => void): void;
declare function isFlushing(): boolean;
declare function hasPendingEffects(): boolean;
declare function __resetBatchForTesting(): void;

type LockViolationBehavior = "throw" | "warn" | "silent";
interface SairinConfig {
    lockViolation: LockViolationBehavior;
    satori: SatoriInstance;
}
declare function configureSairin(config: Partial<SairinConfig>): void;
declare function getSairinConfig(): Readonly<SairinConfig>;

declare function createSignal<T>(path: PathKey, value: T): Signal<T>;
declare function createMemo<T>(path: PathKey, fn: () => T, options?: {
    eager?: boolean;
}): Derived<T>;
declare function createEffect(fn: () => void | (() => void)): () => void;
declare function createEffectSync(fn: () => void | (() => void)): () => void;
declare function onDispose(fn: () => void): void;
declare function untrack<T>(fn: () => T): T;
declare function batched(fn: () => void): void;

type ReactiveObject<T> = {
    [K in keyof T]: T[K] extends object ? ReactiveObject<T[K]> : Signal<T[K]>;
} & {
    $: Signal<T>;
    $raw: T;
};
declare function reactive<T extends object>(obj: T, basePath?: string | PathKey): ReactiveObject<T>;
declare function isReactive<T>(value: unknown): value is ReactiveObject<T>;
declare function toRaw<T>(reactiveObj: ReactiveObject<T>): T;
declare function setReactive<T extends object>(reactiveObj: ReactiveObject<T>, value: T): void;

declare class ReactiveArray<T> {
    private id;
    private itemsSignal;
    private lengthSignal;
    private subscribers;
    constructor(initial?: T[]);
    private notify;
    private update;
    get length(): number;
    get(index: number): T | undefined;
    set(index: number, value: T): void;
    push(...values: T[]): number;
    pop(): T | undefined;
    shift(): T | undefined;
    unshift(...values: T[]): number;
    clear(): void;
    splice(start: number, deleteCount?: number, ...items: T[]): T[];
    filter(predicate: (value: T, index: number) => boolean): T[];
    map<U>(fn: (value: T, index: number) => U): U[];
    reduce<U>(fn: (acc: U, value: T, index: number) => U, initial: U): U;
    find(predicate: (value: T, index: number) => boolean): T | undefined;
    findIndex(predicate: (value: T, index: number) => boolean): number;
    includes(searchElement: T): boolean;
    indexOf(searchElement: T): number;
    some(predicate: (value: T, index: number) => boolean): boolean;
    every(predicate: (value: T, index: number) => boolean): boolean;
    toArray(): T[];
    subscribe(fn: Subscriber): () => void;
    unsubscribe(fn: Subscriber): void;
    [Symbol.iterator](): Iterator<T>;
}
declare function reactiveArray<T>(items?: T[]): ReactiveArray<T>;

declare class ReactiveMap<K, V> {
    private id;
    private entries;
    private keyIds;
    private primKeyIds;
    private nextKeyId;
    private sizeSignal;
    private subscribers;
    constructor(initial?: [K, V][]);
    private getKeyId;
    private removeKeyId;
    private notify;
    get(key: K): V | undefined;
    set(key: K, value: V): void;
    has(key: K): boolean;
    delete(key: K): boolean;
    clear(): void;
    get size(): number;
    keys(): IterableIterator<K>;
    values(): IterableIterator<V>;
    entriesIterable(): IterableIterator<[K, V]>;
    forEach(fn: (value: V, key: K, map: ReactiveMap<K, V>) => void): void;
    toArray(): [K, V][];
    subscribe(fn: Subscriber): () => void;
    unsubscribe(fn: Subscriber): void;
    [Symbol.iterator](): IterableIterator<[K, V]>;
}
declare function reactiveMap<K, V>(entries?: [K, V][]): ReactiveMap<K, V>;

declare function createStore<T extends object>(initial: T): ReactiveObject<T>;
declare function updateStore<T extends object>(store: ReactiveObject<T>, value: Partial<T>): void;
declare function createList<T>(items?: T[]): ReactiveArray<T>;
declare function createMap<K, V>(entries?: [K, V][]): ReactiveMap<K, V>;

interface Flow<T> {
    running: Signal<boolean>;
    result: Signal<T | null>;
    error: Signal<Error | null>;
    start: () => Promise<void>;
    cancel: () => void;
}
declare function flow<T>(fn: (signal: AbortSignal) => Promise<T>): Flow<T>;
interface Pipeline<T, R> {
    running: Signal<boolean>;
    result: Signal<R | null>;
    error: Signal<Error | null>;
    start: (input: T) => Promise<void>;
    cancel: () => void;
}
declare function pipeline<T, R>(fn: (input: T, signal: AbortSignal) => Promise<R>): Pipeline<T, R>;
interface Sequence<T> {
    running: Signal<boolean>;
    results: Signal<T[]>;
    errors: Signal<Error[]>;
    start: () => Promise<void>;
    cancel: () => void;
}
declare function sequence<T>(...fns: ((signal: AbortSignal) => Promise<T>)[]): Sequence<T>;
interface Parallel<T> {
    running: Signal<boolean>;
    results: Signal<T[]>;
    errors: Signal<Error[]>;
    start: () => Promise<void>;
    cancel: () => void;
}
declare function parallel<T>(...fns: ((signal: AbortSignal) => Promise<T>)[]): Parallel<T>;
interface Race<T> {
    running: Signal<boolean>;
    result: Signal<T | null>;
    error: Signal<Error | null>;
    winner: Signal<number>;
    start: () => Promise<void>;
    cancel: () => void;
}
declare function race<T>(...fns: ((signal: AbortSignal) => Promise<T>)[]): Race<T>;

interface Resource<T> {
    value: Signal<T | null>;
    loading: Signal<boolean>;
    error: Signal<Error | null>;
    refetch: () => void;
    abort: () => void;
}
declare function resource<T>(loader: () => Promise<T>, initialValue?: T | null): Resource<T>;
declare function resourceWithSignal<T>(source: Signal<(() => Promise<T>) | null>, initialValue?: T | null): Resource<T>;
interface SuspenseConfig {
    fallback: any;
    timeout?: number;
}
declare class SuspenseBoundary {
    private id;
    private loading;
    private error;
    private fallback;
    constructor(config: SuspenseConfig);
    get loadingSignal(): Signal<boolean>;
    get errorSignal(): Signal<Error | null>;
    getFallback(): any;
    showFallback(show: boolean): void;
    handleError(e: Error): void;
}

declare function startTransition(fn: () => void): void;
declare function getIsTransition(): boolean;
interface TransitionResult {
    pending: Signal<boolean>;
    start: (fn: () => void) => void;
}
declare function useTransition(timeout?: number): TransitionResult;
interface DeferredValueOptions<T> {
    timeoutMs?: number;
    equals?: (a: T, b: T) => boolean;
}
declare function deferred<T>(value: Signal<T>, options?: DeferredValueOptions<T>): {
    signal: Signal<T>;
    dispose: () => void;
};
declare function useDeferred<T>(value: Signal<T>, timeoutMs?: number): Signal<T>;
declare function useDeferredValue<T>(value: T | Signal<T>, timeoutMs?: number): Signal<T>;

declare function createResource<T>(loader: () => Promise<T>, initialValue?: T): Resource<T>;
declare function createResourceFromSignal<T>(source: Signal<(() => Promise<T>) | null>, initialValue?: T): Resource<T>;
declare function useTransitionResult(): TransitionResult;
declare function deferValue<T>(value: T, timeoutMs?: number): ReturnType<typeof useDeferredValue>;

interface Context<T> {
    defaultValue: T;
    Provider: (props: {
        value: T;
        children?: any;
    }) => () => void;
    consume: () => T;
}
declare function createContext<T>(defaultValue: T, name?: string): Context<T>;
interface ProviderProps<T> {
    value: T;
    children?: any;
}
declare function useContext<T>(context: Context<T>): T;
declare function useContextProvider<T>(context: Context<T>, value: T): () => void;
interface CreateContextOptions<T> {
    name?: string;
    strict?: boolean;
}
declare function createContextWithOptions<T>(defaultValue: T, options?: CreateContextOptions<T>): Context<T>;

interface DebugHooks {
    onSignalCreated?: (signal: Signal<any>, name?: string) => void;
    onSignalRead?: (signal: Signal<any>) => void;
    onSignalWritten?: (signal: Signal<any>, oldValue: any, newValue: any) => void;
    onEffectCreated?: (effect: () => void) => void;
    onEffectRun?: (effect: () => void) => void;
    onDerivedInvalidated?: (derived: Derived<any>) => void;
}
declare function enableDebug(hooks: Partial<DebugHooks>): void;
declare function disableDebug(): void;
declare function getDebugHooks(): DebugHooks;
declare function notifySignalCreated(signal: Signal<any>, name?: string): void;
declare function notifySignalRead(signal: Signal<any>): void;
declare function notifySignalWritten(signal: Signal<any>, oldValue: any, newValue: any): void;
declare function notifyEffectCreated(effect: () => void): void;
declare function notifyEffectRun(effect: () => void): void;
declare function notifyDerivedInvalidated(derived: Derived<any>): void;
interface GraphSnapshotSignal {
    id: number;
    value: any;
    subscriberCount: number;
}
interface GraphSnapshotEffect {
    id: number;
    dependencies: number[];
}
interface GraphSnapshotDerived {
    id: number;
    cached: any;
    dirty: boolean;
    dependencies: number[];
}
interface GraphSnapshot {
    signals: GraphSnapshotSignal[];
    effects: GraphSnapshotEffect[];
    derived: GraphSnapshotDerived[];
}
declare function registerSignal(signal: Signal<any>): void;
declare function registerEffect(effect: () => void, id: number): void;
declare function registerDerived(derived: Derived<any>): void;
declare function captureGraph(): GraphSnapshot;
declare function clearGraph(): void;

type Readable<T> = Signal<T> | Derived<T>;
declare function bindText(el: Node, readable: Readable<string>): () => void;
declare function bindHtml(el: Element, readable: Readable<string>): () => void;
declare function bindAttribute(el: Element, attr: string, readable: Readable<any>): () => void;
declare function bindProperty<T extends Element, K extends keyof T>(el: T, prop: K, readable: Readable<T[K]>): () => void;
declare function bindClass(el: Element, readable: Readable<string>): () => void;
declare function bindStyle(el: HTMLElement, styleProp: string, readable: Readable<string>): () => void;
declare function bindEvent<T extends Element>(el: T, eventName: string, handler: (event: Event) => void, options?: AddEventListenerOptions): () => void;
declare function bindInputValue(input: HTMLInputElement | HTMLTextAreaElement, sig: Signal<string>): () => void;
declare function bindInputChecked(input: HTMLInputElement, sig: Signal<boolean>): () => void;
declare function bindSelectValue(select: HTMLSelectElement, sig: Signal<string>): () => void;
declare function bindVisibility(el: Element, readable: Readable<boolean>): () => void;
declare function bindDisabled(el: Element, readable: Readable<boolean>): () => void;
declare function bindElementSignal<T extends Element>(el: T, sig: Signal<T | null>, parent: Element): () => void;
interface Binding {
    destroy: () => void;
}
declare function createBinding(destroyFn: () => void): Binding;

export { type Binding, type CleanupFn, type Context, type CreateContextOptions, type DebugHooks, type DeferredValueOptions, Derived, type DerivedOptions, type Flow, type GraphSnapshot, type GraphSnapshotDerived, type GraphSnapshotEffect, type GraphSnapshotSignal, type LockViolationBehavior, type Parallel, type PathKey, type Pipeline, type ProviderProps, type Race, ReactiveArray, type ReactiveKind, ReactiveMap, type ReactiveNode, type ReactiveObject, type Readable, type Resource, type SairinConfig, type Sequence, Signal, type Subscriber, SuspenseBoundary, type SuspenseConfig, type TransitionResult, __resetBatchForTesting, __resetRegistryForTesting, alias, assertLock, batch, batched, bindAttribute, bindClass, bindDisabled, bindElementSignal, bindEvent, bindHtml, bindInputChecked, bindInputValue, bindProperty, bindSelectValue, bindStyle, bindText, bindVisibility, capRetainedMemory, captureGraph, checkLock, clearGraph, configureSairin, createBinding, createContext, createContextWithOptions, createEffect, createEffectSync, createList, createMap, createMemo, path as createPath, createResource, createResourceFromSignal, createSignal, createStore, deferValue, deferred, deleteNode, derived, disableDebug, effect, effectIdle, effectSync, enableDebug, flow, generateId, generateUniqueId, getAllNodes, getDebugHooks, getGlobalActiveComputation, getIsTransition, getNode, getNodesUnder, getOrCreateNode, getParentPath, getSairinConfig, hasNode, hasPendingEffects, isAlias, isFlushing, isLocked, isPathKey, isReactive, isSignal, joinPath, lock, matchesPath, notifyDerivedInvalidated, notifyEffectCreated, notifyEffectRun, notifySignalCreated, notifySignalRead, notifySignalWritten, notifySubscribers, onCleanup, onDispose, parallel, path, pipeline, race, reactive, reactiveArray, reactiveMap, registerDerived, registerEffect, registerSignal, resolveAlias, resource, resourceWithSignal, scheduleEffect, scheduleIncrementalCleanup, sequence, setGlobalActiveComputation, setReactive, signal, startTransition, subscribe, toRaw, trackDependency, trackNode, unalias, unlock, unsubscribe, untrack, untracked, updateStore, useContext, useContextProvider, useDeferred, useDeferredValue, useTransition, useTransitionResult, watch };
