import test from 'node:test';
import assert from 'node:assert';
import { num, route } from './index.js';

test('base path', () => {
  const r = route`/`;

  assert.strictEqual(r.decode('/foo'), null);
  assert.deepStrictEqual(r.decode('/'), {});
  assert.strictEqual(r.encode({}), '/');
});

test('todo path', () => {
  const r = route`/todo/${['id', num]}`;

  assert.strictEqual(r.decode('/todo'), null);
  assert.deepStrictEqual(r.decode('/todo/1'), { id: 1 });
  assert.strictEqual(r.encode({ id: 1 }), '/todo/1');
});
