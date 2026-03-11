import { ReactiveArray, reactiveArray, ReactiveMap, reactiveMap, reactive, isReactive, toRaw, setReactive } from '../src/store';

describe('ReactiveArray', () => {
  test('should create reactive array', () => {
    const arr = new ReactiveArray([1, 2, 3]);
    expect(arr.length).toBe(3);
    expect(arr.get(0)).toBe(1);
    expect(arr.get(1)).toBe(2);
    expect(arr.get(2)).toBe(3);
  });

  test('should push items', () => {
    const arr = reactiveArray<number>();
    arr.push(1);
    arr.push(2);
    expect(arr.length).toBe(2);
    expect(arr.get(0)).toBe(1);
    expect(arr.get(1)).toBe(2);
  });

  test('should pop items', () => {
    const arr = reactiveArray([1, 2, 3]);
    const popped = arr.pop();
    expect(popped).toBe(3);
    expect(arr.length).toBe(2);
  });

  test('should notify subscribers on change', () => {
    const arr = reactiveArray([1, 2, 3]);
    const subscriber = jest.fn();
    arr.subscribe(subscriber);
    
    arr.push(4);
    expect(subscriber).toHaveBeenCalled();
  });

  test('should map items', () => {
    const arr = reactiveArray([1, 2, 3]);
    const mapped = arr.map(x => x * 2);
    expect(mapped).toEqual([2, 4, 6]);
  });

  test('should filter items', () => {
    const arr = reactiveArray([1, 2, 3, 4]);
    const filtered = arr.filter(x => x > 2);
    expect(filtered).toEqual([3, 4]);
  });

  test('should reduce items', () => {
    const arr = reactiveArray([1, 2, 3, 4]);
    const sum = arr.reduce((acc, x) => acc + x, 0);
    expect(sum).toBe(10);
  });

  test('should convert to array', () => {
    const arr = reactiveArray([1, 2, 3]);
    const copy = arr.toArray();
    expect(copy).toEqual([1, 2, 3]);
    expect(copy).not.toBe(arr['itemsSignal'].peek());
  });

  test('should handle shift', () => {
    const arr = reactiveArray([1, 2, 3]);
    const shifted = arr.shift();
    expect(shifted).toBe(1);
    expect(arr.length).toBe(2);
  });

  test('should handle unshift', () => {
    const arr = reactiveArray([2, 3]);
    arr.unshift(1);
    expect(arr.get(0)).toBe(1);
    expect(arr.length).toBe(3);
  });

  test('should handle splice', () => {
    const arr = reactiveArray([1, 2, 3, 4]);
    const deleted = arr.splice(1, 2, 5, 6);
    expect(deleted).toEqual([2, 3]);
    expect(arr.toArray()).toEqual([1, 5, 6, 4]);
  });

  test('should handle clear', () => {
    const arr = reactiveArray([1, 2, 3]);
    arr.clear();
    expect(arr.length).toBe(0);
  });
});

describe('ReactiveMap', () => {
  test('should create reactive map', () => {
    const map = new ReactiveMap([['a', 1], ['b', 2]]);
    expect(map.size).toBe(2);
    expect(map.get('a')).toBe(1);
    expect(map.get('b')).toBe(2);
  });

  test('should set values', () => {
    const map = reactiveMap<string, number>();
    map.set('a', 1);
    expect(map.get('a')).toBe(1);
    expect(map.size).toBe(1);
  });

  test('should update existing values', () => {
    const map = reactiveMap([['a', 1]]);
    map.set('a', 2);
    expect(map.get('a')).toBe(2);
    expect(map.size).toBe(1);
  });

  test('should delete values', () => {
    const map = reactiveMap([['a', 1], ['b', 2]]);
    const deleted = map.delete('a');
    expect(deleted).toBe(true);
    expect(map.size).toBe(1);
    expect(map.get('a')).toBeUndefined();
  });

  test('should check has', () => {
    const map = reactiveMap([['a', 1]]);
    expect(map.has('a')).toBe(true);
    expect(map.has('b')).toBe(false);
  });

  test('should notify subscribers on change', () => {
    const map = reactiveMap<string, number>();
    const subscriber = jest.fn();
    map.subscribe(subscriber);
    
    map.set('a', 1);
    expect(subscriber).toHaveBeenCalled();
  });

  test('should convert to array', () => {
    const map = reactiveMap([['a', 1], ['b', 2]]);
    const arr = map.toArray();
    expect(arr).toContainEqual(['a', 1]);
    expect(arr).toContainEqual(['b', 2]);
  });

  test('should iterate values', () => {
    const map = reactiveMap([['a', 1], ['b', 2]]);
    const values: number[] = [];
    map.forEach((v) => values.push(v));
    expect(values).toEqual([1, 2]);
  });
});

describe('reactive', () => {
  test('should create reactive object', () => {
    const obj = reactive({ a: 1, b: 2 });
    expect(isReactive(obj)).toBe(true);
  });

  test('should get values', () => {
    const obj = reactive({ a: 1, b: 2 });
    expect((obj.a as any).get()).toBe(1);
    expect((obj.b as any).get()).toBe(2);
  });

  test('should set values', () => {
    const obj = reactive({ a: 1 });
    (obj.a as any).set(2);
    expect((obj.a as any).get()).toBe(2);
  });

  test('should get raw object', () => {
    const obj = reactive({ a: 1, b: 2 });
    const raw = toRaw(obj);
    expect(raw).toEqual({ a: 1, b: 2 });
  });

  test('should set entire reactive object', () => {
    const obj = reactive({ a: 1 });
    setReactive(obj, { a: 2 });
    expect((obj.a as any).get()).toBe(2);
  });
});
