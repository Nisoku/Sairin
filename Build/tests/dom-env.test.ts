import { test, expect } from '@jest/globals';

test('basic', () => {
  expect(document).toBeDefined();
  expect(document.createElement('div')).toBeDefined();
});
