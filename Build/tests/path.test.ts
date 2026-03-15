import { path, matchesPath, isPathKey, getParentPath, joinPath } from '../src/kernel';

describe('path', () => {
  describe('basic path creation', () => {
    test('should create simple paths', () => {
      const p = path("user", "name");
      expect(p.raw).toBe("/user/name");
      expect(p.segments).toEqual(["user", "name"]);
      expect(p.isGlob).toBe(false);
      expect(p.globType).toBe("none");
    });

    test('should handle numbers', () => {
      const p = path("items", 0, "value");
      expect(p.raw).toBe("/items/0/value");
      expect(p.segments).toEqual(["items", "0", "value"]);
    });

    test('should handle single segment', () => {
      const p = path("user");
      expect(p.raw).toBe("/user");
      expect(p.segments).toEqual(["user"]);
    });
  });

  describe('glob patterns', () => {
    test('should detect shallow glob', () => {
      const p = path("user", "*");
      expect(p.isGlob).toBe(true);
      expect(p.globType).toBe("shallow");
      expect(p.segments).toContain("*");
    });

    test('should detect deep glob', () => {
      const p = path("user", "**");
      expect(p.isGlob).toBe(true);
      expect(p.globType).toBe("deep");
      expect(p.segments).toContain("**");
    });

    test('should throw on * after **', () => {
      expect(() => path("user", "**", "*")).toThrow("Cannot use * after **");
    });

    test('should throw on ** after *', () => {
      expect(() => path("user", "*", "**")).toThrow("Cannot use ** after *");
    });

    test('should throw on empty segment', () => {
      expect(() => path("user", "", "name")).toThrow("Path segment cannot be empty");
    });
  });

  describe('isPathKey', () => {
    test('should return true for path keys', () => {
      const p = path("user", "name");
      expect(isPathKey(p)).toBe(true);
    });

    test('should return false for strings', () => {
      expect(isPathKey("/user/name")).toBe(false);
    });

    test('should return false for objects without segments', () => {
      expect(isPathKey({ foo: "bar" })).toBe(false);
    });

    test('should return false for null', () => {
      expect(isPathKey(null)).toBe(false);
    });
  });

  describe('matchesPath', () => {
    describe('exact matches', () => {
      test('should match exact paths', () => {
        const pattern = path("user", "name");
        const target = path("user", "name");
        expect(matchesPath(pattern, target)).toBe(true);
      });

      test('should not match different paths', () => {
        const pattern = path("user", "name");
        const target = path("user", "age");
        expect(matchesPath(pattern, target)).toBe(false);
      });
    });

    describe('shallow glob (*)', () => {
      test('should match single segment wildcard', () => {
        const pattern = path("user", "*");
        const target = path("user", "name");
        expect(matchesPath(pattern, target)).toBe(true);
      });

      test('should match age with user *', () => {
        const pattern = path("user", "*");
        const target = path("user", "age");
        expect(matchesPath(pattern, target)).toBe(true);
      });

      test('should not match nested paths', () => {
        const pattern = path("user", "*");
        const target = path("user", "profile", "name");
        expect(matchesPath(pattern, target)).toBe(false);
      });

      test('should not match different prefixes', () => {
        const pattern = path("user", "*");
        const target = path("admin", "name");
        expect(matchesPath(pattern, target)).toBe(false);
      });
    });

    describe('deep glob (**)', () => {
      test('should match all descendants', () => {
        const pattern = path("user", "**");
        const target = path("user", "name");
        expect(matchesPath(pattern, target)).toBe(true);
      });

      test('should match deeply nested', () => {
        const pattern = path("user", "**");
        const target = path("user", "profile", "settings", "theme");
        expect(matchesPath(pattern, target)).toBe(true);
      });

      test('should match exact path', () => {
        const pattern = path("user", "**");
        const target = path("user");
        expect(matchesPath(pattern, target)).toBe(true);
      });

      test('should not match sibling paths', () => {
        const pattern = path("user", "**");
        const target = path("admin", "name");
        expect(matchesPath(pattern, target)).toBe(false);
      });
    });
  });

  describe('getParentPath', () => {
    test('should get parent of nested path', () => {
      const p = path("user", "profile", "name");
      const parent = getParentPath(p);
      expect(parent?.raw).toBe("/user/profile");
    });

    test('should get parent of two-segment path', () => {
      const p = path("user", "name");
      const parent = getParentPath(p);
      expect(parent?.raw).toBe("/user");
    });

    test('should return null for root path', () => {
      const p = path("user");
      expect(getParentPath(p)).toBe(null);
    });

    test('should ignore glob in parent calculation', () => {
      const p = path("user", "**", "name");
      const parent = getParentPath(p);
      expect(parent?.raw).toBe("/user");
    });
  });

  describe('joinPath', () => {
    test('should join segments', () => {
      const base = path("user", "profile");
      const joined = joinPath(base, "settings", "theme");
      expect(joined.raw).toBe("/user/profile/settings/theme");
    });

    test('should handle empty join', () => {
      const base = path("user");
      const joined = joinPath(base);
      expect(joined.raw).toBe("/user");
    });

    test('should ignore globs in base', () => {
      const base = path("user", "**");
      const joined = joinPath(base, "name");
      expect(joined.raw).toBe("/user/name");
    });
  });
});
