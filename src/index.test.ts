import test from 'node:test';
import assert from 'node:assert';
import {
  RouteData,
  RouteParser,
  boolean,
  date,
  datetime,
  float,
  int,
  route,
  string,
} from './index.js';

type DecodeFixture =
  | {
      route: () => RouteParser;
      input: string;
      expectedMatch: ReturnType<RouteParser['decode']>;
      error?: undefined;
    }
  | {
      route: () => RouteParser;
      input: string;
      expectedMatch?: undefined;
      error: true;
    };

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
    route: () => route`/foo/${['bar', string]}`,
    input: '/foo/bar',
    expectedMatch: {
      params: { bar: 'bar' },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/foo/${['bar', string]}`,
    input: '/foo/index.html',
    expectedMatch: {
      params: { bar: 'index.html' },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/foo/${['bar', string]}`,
    input: '/foo/',
    expectedMatch: null,
  },
  {
    route: () => route`/foo/${['bar', string]}`,
    input: '/foo/bar/',
    expectedMatch: null,
  },
  {
    route: () => route`/${['café', string]}`,
    input: '/foo',
    expectedMatch: {
      params: { café: 'foo' },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/${['\u2118', string]}`,
    input: '/foo',
    expectedMatch: {
      params: { '\u2118': 'foo' },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/${['\u3400', string]}`,
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
    route: () => route`${['name', string]}.html`,
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
  {
    route: () => route`/${['id', string]}/${['id', string]}`,
    input: 'Throw error',
    error: true,
  },
];

const decoderFixtures: DecodeFixture[] = [
  {
    route: () => route`/${['int', int]}`,
    input: '/1',
    expectedMatch: {
      params: { int: 1 },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/${['float', float]}`,
    input: '/1.01',
    expectedMatch: {
      params: { float: 1.01 },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/${['boolean', boolean]}`,
    input: '/true',
    expectedMatch: {
      params: { boolean: true },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/${['boolean', boolean]}`,
    input: '/false',
    expectedMatch: {
      params: { boolean: false },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/${['date', date]}`,
    input: '/01-01-2000',
    expectedMatch: {
      params: { date: new Date('01-01-2000') },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/${['datetime', datetime]}`,
    input: '/2000-01-01T07%3A07%3A06.664Z',
    expectedMatch: {
      params: { datetime: new Date('2000-01-01T07:07:06.664Z') },
      search: {},
      hash: '',
    },
  },
];

const decodeFixtures = [...URLPatternDecoderFixtures, ...decoderFixtures];

for (const { route, input, expectedMatch, error } of decodeFixtures) {
  test(`Decode: '${input}' for ${route}`, () => {
    if (error) {
      assert.throws(() => route());
    } else {
      assert.deepStrictEqual(route().decode(input), expectedMatch);
    }
  });
}

type EncodeFixture =
  | {
      route: () => RouteParser;
      input: RouteData<Record<string, any>>;
      expectedMatch: string;
      error?: undefined;
    }
  | {
      route: () => RouteParser;
      input: RouteData<Record<string, any>>;
      expectedMatch?: undefined;
      error: true;
    };

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
    route: () => route`/${['int', int]}`,
    input: {
      params: { int: 1 },
    },
    expectedMatch: '/1',
  },
  {
    route: () => route`/${['float', float]}`,
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

for (const { route, input, expectedMatch, error } of encodeFixtures) {
  test(`Encode: '${expectedMatch}' for ${route}`, () => {
    if (error) {
      assert.throws(() => route());
    } else {
      assert.deepStrictEqual(route().encode(input), expectedMatch);
    }
  });
}
