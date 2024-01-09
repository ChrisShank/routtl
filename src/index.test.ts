import test from 'node:test';
import assert from 'node:assert';
import { route } from './index.js';

test('base path', () => {
  const r = route`/`;

  assert.strictEqual(r.decode('/foo'), null);
  assert.deepStrictEqual(r.decode('/'), {});
  assert.strictEqual(r.encode({}), '/');
});
