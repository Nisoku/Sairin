import { signal, derived, effect, path, watch, lock, unlock, isLocked, checkLock, scheduleIncrementalCleanup, __resetRegistryForTesting, configureSairin, getSairinConfig, type SairinConfig, alias, resolveAlias, unalias, isAlias, capRetainedMemory } from '../src/kernel';

describe('graph', () => {
  beforeEach(() => __resetRegistryForTesting());

  describe('watch', () => {
    test('should watch for changes on matching paths', async () => {
      const sig1 = signal(path("user", "name"), "John");
      const sig2 = signal(path("user", "age"), 30);
      const sig3 = signal(path("admin", "name"), "Admin");

      const callback = jest.fn();
      watch(path("user", "**"), callback);

      sig1.set("Jane");
      await Promise.resolve();
      
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(path("user", "name"), "signal");
    });

    test('should watch shallow glob', async () => {
      const sig1 = signal(path("user", "name"), "John");
      const sig2 = signal(path("user", "profile", "name"), "Jane");

      const callback = jest.fn();
      watch(path("user", "*"), callback);

      sig1.set("Updated");
      await Promise.resolve();
      
      expect(callback).toHaveBeenCalledTimes(1);

      sig2.set("Also Updated");
      await Promise.resolve();
      
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should return unsubscribe function', async () => {
      const sig = signal(path("user", "name"), "John");

      const callback = jest.fn();
      const unwatch = watch(path("user", "**"), callback);

      sig.set("Jane");
      await Promise.resolve();
      expect(callback).toHaveBeenCalledTimes(1);

      unwatch();

      sig.set("Bob");
      await Promise.resolve();
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should match existing nodes on watch creation', () => {
      // This tests that watch subscribes to existing matching nodes
      const sig1 = signal(path("user", "name"), "John");
      const sig2 = signal(path("user", "age"), 30);

      const callback = jest.fn();
      const unwatch = watch(path("user", "**"), callback);

      // Should be subscribed, verify by triggering change
      sig1.set("Jane");
      expect(callback).toHaveBeenCalled();
      
      unwatch();
    });
  });

  describe('lock', () => {
    test('should lock a path', () => {
      const sig = signal(path("app", "theme"), "dark");
      
      lock(path("app", "theme"), { owner: "theme" });
      
      expect(isLocked(path("app", "theme"))).toBe(true);
    });

    test('should unlock a path', () => {
      const sig = signal(path("app", "theme"), "dark");
      
      lock(path("app", "theme"), { owner: "theme" });
      unlock(path("app", "theme"));
      
      expect(isLocked(path("app", "theme"))).toBe(false);
    });

    test('should check lock ownership', () => {
      lock(path("app", "theme"), { owner: "theme" });
      
      expect(checkLock(path("app", "theme"), "theme")).toBe(true);
      expect(checkLock(path("app", "theme"), "other")).toBe(false);
    });

    test('deep lock should cover descendants', () => {
      lock(path("app", "user"), { owner: "core", shallow: false });
      
      expect(isLocked(path("app", "user"))).toBe(true);
      expect(isLocked(path("app", "user", "name"))).toBe(true);
      expect(isLocked(path("app", "settings"))).toBe(false);
    });

    test('shallow lock should only cover exact path', () => {
      lock(path("app", "settings"), { owner: "core", shallow: true });
      
      expect(isLocked(path("app", "settings"))).toBe(true);
      expect(isLocked(path("app", "settings", "theme"))).toBe(false);
    });
  });

  describe('scheduleIncrementalCleanup', () => {
    test('should cleanup nodes in chunks', async () => {
      const nodes: any[] = [];
      
      for (let i = 0; i < 25; i++) {
        const sig = signal(path("test", String(i)), i);
        // Add a subscriber to each node
        const dummyFn = () => {};
        (sig as any)._node.subscribers.add(dummyFn);
        nodes.push((sig as any)._node);
      }

      // Verify nodes have subscribers before cleanup
      for (const node of nodes) {
        expect(node.subscribers.size).toBe(1);
      }

      scheduleIncrementalCleanup(nodes, { chunkSize: 10 });

      // After first microtask, first chunk cleared
      await Promise.resolve();
      for (let i = 0; i < 10; i++) {
        expect(nodes[i].subscribers.size).toBe(0);
      }
      for (let i = 10; i < 25; i++) {
        expect(nodes[i].subscribers.size).toBe(1);
      }

      // After second microtask, second chunk cleared
      await Promise.resolve();
      for (let i = 10; i < 20; i++) {
        expect(nodes[i].subscribers.size).toBe(0);
      }

      // After third microtask, all cleared
      await Promise.resolve();
      for (const node of nodes) {
        expect(node.subscribers.size).toBe(0);
      }
    });

    test('should handle empty node list', () => {
      expect(() => scheduleIncrementalCleanup([])).not.toThrow();
    });

    test('should mark derived as dirty', async () => {
      const sig = signal(path("test", "base"), 1);
      const deriv = derived(path("test", "doubled"), () => sig.get() * 2);
      
      deriv.get();
      
      const derivNode = (deriv as any)._node;
      expect(derivNode.dirty).toBe(false);
      
      scheduleIncrementalCleanup([derivNode]);
      
      await Promise.resolve();
      expect(derivNode.dirty).toBe(true);
    });
  });

  describe('configureSairin', () => {
    const originalConfig = getSairinConfig();

    afterEach(() => {
      configureSairin({ lockViolation: "throw", satori: null });
    });

    test('should default to throw on lock violations', () => {
      expect(getSairinConfig().lockViolation).toBe("throw");
    });

    test('should configure lockViolation behavior', () => {
      configureSairin({ lockViolation: "warn" });
      expect(getSairinConfig().lockViolation).toBe("warn");

      configureSairin({ lockViolation: "silent" });
      expect(getSairinConfig().lockViolation).toBe("silent");
    });

    test('should throw on lock violation when set to throw', () => {
      configureSairin({ lockViolation: "throw" });
      lock(path("app", "theme"), { owner: "theme" });
      
      const sig = signal(path("app", "theme"), "dark");
      
      expect(() => {
        sig.set("light", { owner: "other" });
      }).toThrow();
      
      unlock(path("app", "theme"));
    });

    test('should warn on lock violation when set to warn', () => {
      configureSairin({ lockViolation: "warn" });
      lock(path("app", "theme"), { owner: "theme" });
      
      const sig = signal(path("app", "theme"), "dark");
      const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      sig.set("light", { owner: "other" });
      
      expect(consoleWarn).toHaveBeenCalled();
      consoleWarn.mockRestore();
      
      unlock(path("app", "theme"));
    });

    test('should silently drop write on lock violation when set to silent', () => {
      configureSairin({ lockViolation: "silent" });
      lock(path("app", "theme"), { owner: "theme" });
      
      const sig = signal(path("app", "theme"), "dark");
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      sig.set("light", { owner: "other" });
      
      expect(consoleError).not.toHaveBeenCalled();
      expect(sig.get()).toBe("dark");
      
      consoleError.mockRestore();
      unlock(path("app", "theme"));
    });

    test('should allow write with correct owner', () => {
      configureSairin({ lockViolation: "throw" });
      lock(path("app", "theme"), { owner: "theme" });
      
      const sig = signal(path("app", "theme"), "dark");
      
      expect(() => {
        sig.set("light", { owner: "theme" });
      }).not.toThrow();
      
      expect(sig.get()).toBe("light");
      
      unlock(path("app", "theme"));
    });

    test('should allow write when not locked', () => {
      configureSairin({ lockViolation: "throw" });
      
      const sig = signal(path("app", "theme"), "dark");
      
      expect(() => {
        sig.set("light");
      }).not.toThrow();
      
      expect(sig.get()).toBe("light");
    });
  });

  describe('alias', () => {
    test('should create an alias', () => {
      alias(path("ui", "currentUser"), path("user", "name"));
      
      expect(isAlias(path("ui", "currentUser"))).toBe(true);
      expect(resolveAlias(path("ui", "currentUser"))).toEqual(path("user", "name"));
    });

    test('should resolve alias when creating signal', () => {
      const target = signal(path("user", "name"), "John");
      
      alias(path("ui", "currentUser"), path("user", "name"));
      
      const aliasSignal = signal(path("ui", "currentUser"), "Jane");
      
      expect(aliasSignal.get()).toBe("John");
    });

    test('should unalias a path', () => {
      alias(path("ui", "currentUser"), path("user", "name"));
      
      expect(unalias(path("ui", "currentUser"))).toBe(true);
      expect(isAlias(path("ui", "currentUser"))).toBe(false);
    });

    test('should return undefined for non-aliased path', () => {
      expect(resolveAlias(path("user", "name"))).toBeUndefined();
      expect(isAlias(path("user", "name"))).toBe(false);
    });

    test('alias should reflect target changes', () => {
      const target = signal(path("user", "name"), "John");
      
      alias(path("ui", "currentUser"), path("user", "name"));
      
      const aliasSignal = signal(path("ui", "currentUser"), "Initial");
      
      target.set("Jane");
      
      expect(aliasSignal.get()).toBe("Jane");
    });
  });

  describe('capRetainedMemory', () => {
    test('should strip cached values from derived nodes', () => {
      const sig = signal(path("test", "base"), 1);
      const deriv = derived(path("test", "doubled"), () => sig.get() * 2);
      
      deriv.get();
      
      const derivNode = (deriv as any)._node;
      expect(derivNode.cached).toBe(2);
      expect(derivNode.dirty).toBe(false);
      
      capRetainedMemory([derivNode]);
      
      expect(derivNode.cached).toBeUndefined();
      expect(derivNode.dirty).toBe(true);
    });

    test('should clear subscribers from all nodes', () => {
      const sig = signal(path("test", "value"), 1);
      const dummyFn = () => {};
      (sig as any)._node.subscribers.add(dummyFn);
      
      expect((sig as any)._node.subscribers.size).toBe(1);
      
      capRetainedMemory([(sig as any)._node]);
      
      expect((sig as any)._node.subscribers.size).toBe(0);
    });
  });
});
