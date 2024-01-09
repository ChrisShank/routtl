import test from 'node:test';
import assert from 'node:assert';
import { num, route, string } from './index.js';

test('base path', () => {
  const r = route`/`;

  assert.strictEqual(r.decode('/foo'), null);
  assert.deepStrictEqual(r.decode('/'), {});
  assert.strictEqual(r.encode({}), '/');
});

test('int decoder', () => {
  const r = route`/int/${['id', num]}`;

  assert.strictEqual(r.decode('/int'), null);
  assert.deepStrictEqual(r.decode('/int/foo'), { id: NaN });
  assert.deepStrictEqual(r.decode('/int/1'), { id: 1 });
  assert.strictEqual(r.encode({ id: 1 }), '/int/1');
});

test('string decoder', () => {
  const r = route`/str/${['id', string]}`;

  assert.strictEqual(r.decode('/str'), null);
  assert.deepStrictEqual(r.decode('/str/1'), { id: '1' });
  assert.deepStrictEqual(r.decode('/str/foo'), { id: 'foo' });
  assert.strictEqual(r.encode({ id: '1' }), '/str/1');
});
