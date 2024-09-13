import test from 'node:test';
import assert from 'node:assert';
import { RouteData, RouteParser, boolean, date, datetime, num, route, string } from './index.js';

interface DecodeFixture {
  route: () => RouteParser;
  input: string;
  expectedMatch: ReturnType<RouteParser['decode']>;
}

// Adapted from the URLPattern test suite: https://github.com/kenchris/urlpattern-polyfill/blob/main/test/urlpatterntestdata.json
const URLPatternDecoderFixtures: DecodeFixture[] = [
  {
    route: () => route`/foo/bar`,
    input: '/foo/bar',
    expectedMatch: {
      params: {},
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/foo/bar`,
    input: '/foo/ba',
    expectedMatch: null,
  },
  {
    route: () => route`/foo/bar`,
    input: '/foo/bar/',
    expectedMatch: null,
  },
  {
    route: () => route`/foo/bar`,
    input: '/foo/bar/baz',
    expectedMatch: null,
  },
  {
    route: () => route`/foo/${string('bar')}`,
    input: '/foo/bar',
    expectedMatch: {
      params: { bar: 'bar' },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/foo/${string('bar')}`,
    input: '/foo/index.html',
    expectedMatch: {
      params: { bar: 'index.html' },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/foo/${string('bar')}`,
    input: '/foo/',
    expectedMatch: null,
  },
  {
    route: () => route`/foo/${string('bar')}`,
    input: '/foo/bar/',
    expectedMatch: null,
  },
  {
    route: () => route`/${string('café')}`,
    input: '/foo',
    expectedMatch: {
      params: { café: 'foo' },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/${string('\u2118')}`,
    input: '/foo',
    expectedMatch: {
      params: { '\u2118': 'foo' },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/${string('\u3400')}`,
    input: '/foo',
    expectedMatch: {
      params: { '\u3400': 'foo' },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/foo/bar`,
    input: '/foo/./bar',
    expectedMatch: {
      params: {},
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/foo/baz`,
    input: '/foo/bar/../baz',
    expectedMatch: {
      params: {},
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/caf%C3%A9`,
    input: '/café',
    expectedMatch: {
      params: {},
      search: {},
      hash: '',
    },
  },
  /* should we parse this TTL
  {
    route: () => route`/café`,
    input: '/café',
    expectedMatch: {
      params: {},
      search: {},
      hash: '',
    },
  }, */
  {
    route: () => route`/caf%c3%a9`,
    input: '/café',
    expectedMatch: null,
  },
  // Note URLPattern doesn't match here
  {
    route: () => route`/foo/bar`,
    input: 'foo/bar',
    expectedMatch: {
      params: {},
      search: {},
      hash: '',
    },
  },
  /* Support relative paths in definition?
   * This would require parsing the URL before generating the regex.
  {
    route: () => route`/foo/../bar`,
    input: '/bar',
    expectedMatch: {
      params: {},
      search: {},
      hash: '',
    },
  },
   {
    route: () => route`./foo/bar`,
    input: 'foo/bar',
    expectedMatch: {
      params: {},
      search: {},
      hash: '',
    },
  },
  **/
  {
    route: () => route``,
    input: '/',
    expectedMatch: {
      params: {},
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`${string('name')}.html`,
    input: 'foo.html',
    expectedMatch: {
      params: { name: 'foo' },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/foo!`,
    input: '/foo!',
    expectedMatch: {
      params: {},
      search: {},
      hash: '',
    },
  },
];

const decoderFixtures: DecodeFixture[] = [
  {
    route: () => route`/${num('num')}`,
    input: '/1',
    expectedMatch: {
      params: { num: 1 },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/${num('float')}`,
    input: '/1.01',
    expectedMatch: {
      params: { float: 1.01 },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/${boolean('boolean')}`,
    input: '/true',
    expectedMatch: {
      params: { boolean: true },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/${boolean('boolean')}`,
    input: '/false',
    expectedMatch: {
      params: { boolean: false },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/${date('date')}`,
    input: '/01-01-2000',
    expectedMatch: {
      params: { date: new Date('01-01-2000') },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/${datetime('datetime')}`,
    input: '/2000-01-01T07%3A07%3A06.664Z',
    expectedMatch: {
      params: { datetime: new Date('2000-01-01T07:07:06.664Z') },
      search: {},
      hash: '',
    },
  },
];

const decodeFixtures = [...URLPatternDecoderFixtures, ...decoderFixtures];

for (const { route, input, expectedMatch } of decodeFixtures) {
  test(`Decode: '${input}' for ${route}`, () => {
    assert.deepStrictEqual(route().decode(input), expectedMatch);
  });
}

interface EncodeFixture {
  route: () => RouteParser;
  input: RouteData<Record<string, any>>;
  expectedMatch: string;
}

// Adapted from the URLPattern test suite: https://github.com/kenchris/urlpattern-polyfill/blob/main/test/urlpatterntestdata.json
const URLPatternEncoderFixtures: EncodeFixture[] = [
  {
    route: () => route`/foo/bar`,
    input: {
      params: {},
    },
    expectedMatch: '/foo/bar',
  },
  {
    route: () => route`/foo/${['bar', string]}`,
    input: {
      params: { bar: 'bar' },
    },
    expectedMatch: '/foo/bar',
  },
  {
    route: () => route`/foo/${['bar', string]}`,
    input: {
      params: { bar: 'index.html' },
    },
    expectedMatch: '/foo/index.html',
  },
  {
    route: () => route`/${['café', string]}`,
    input: {
      params: { café: 'foo' },
    },
    expectedMatch: '/foo',
  },
  {
    route: () => route`/${['\u2118', string]}`,
    input: {
      params: { '\u2118': 'foo' },
    },
    expectedMatch: '/foo',
  },
  {
    route: () => route`/${['\u3400', string]}`,
    input: {
      params: { '\u3400': 'foo' },
    },
    expectedMatch: '/foo',
  },
  {
    route: () => route`/café`,
    input: {
      params: {},
    },
    expectedMatch: '/caf%C3%A9',
  },
  /* Support relative paths in definition?
   * This would require parsing the URL before generating the regex.
  {
    route: () => route`/foo/../bar`,
    input: '/bar',
    expectedMatch: {
      params: {},
    },
  },
   {
    route: () => route`./foo/bar`,
    input: 'foo/bar',
    expectedMatch: {
      params: {},
    },
  },
  **/
  {
    route: () => route``,
    input: {
      params: {},
    },
    expectedMatch: '/',
  },
  {
    route: () => route`${['name', string]}.html`,
    input: {
      params: { name: 'foo' },
    },
    expectedMatch: '/foo.html',
  },
  {
    route: () => route`/foo!`,
    input: {
      params: {},
    },
    expectedMatch: '/foo!',
  },
];

const encoderFixtures: EncodeFixture[] = [
  {
    route: () => route`/${['num', num]}`,
    input: {
      params: { num: 1 },
    },
    expectedMatch: '/1',
  },
  {
    route: () => route`/${['float', num]}`,
    input: {
      params: { float: 1.01 },
    },
    expectedMatch: '/1.01',
  },
  {
    route: () => route`/${['boolean', boolean]}`,
    input: {
      params: { boolean: true },
    },
    expectedMatch: '/true',
  },
  {
    route: () => route`/${['boolean', boolean]}`,
    input: {
      params: { boolean: false },
    },
    expectedMatch: '/false',
  },
  {
    route: () => route`/${['date', date]}`,
    input: {
      params: { date: new Date('2000-01-01') },
    },
    expectedMatch: '/2000-01-01',
  },
  {
    route: () => route`/${['datetime', datetime]}`,
    input: {
      params: { datetime: new Date('2000-01-01T07:07:06.664Z') },
    },
    expectedMatch: '/2000-01-01T07%3A07%3A06.664Z',
  },
];

const encodeFixtures = [...URLPatternEncoderFixtures, ...encoderFixtures];

for (const { route, input, expectedMatch } of encodeFixtures) {
  test(`Encode: '${expectedMatch}' for ${route}`, () => {
    assert.deepStrictEqual(route().encode(input), expectedMatch);
  });
}

type ErrorFixture = () => RouteParser;

const errorFixtures: ErrorFixture[] = [() => route`/${string('id')}/${string('id')}`];

for (const route of errorFixtures) {
  test(`Throws: '${route}'`, () => {
    assert.throws(() => route());
  });
}
