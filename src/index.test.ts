import test from 'node:test';
import assert from 'node:assert';
import { RouteParser, boolean, date, float, int, route, string } from './index.js';

type DecodeFixture =
  | {
      route: () => RouteParser;
      input: string;
      expected_match: ReturnType<RouteParser['decode']>;
      error?: undefined;
    }
  | {
      route: () => RouteParser;
      input: string;
      expected_match?: undefined;
      error: true;
    };

// Adapted from the URLPattern test suite: https://github.com/kenchris/urlpattern-polyfill/blob/main/test/urlpatterntestdata.json
const URLPatternFixtures: DecodeFixture[] = [
  {
    route: () => route`/foo/bar`,
    input: '/foo/bar',
    expected_match: {
      params: {},
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/foo/bar`,
    input: '/foo/ba',
    expected_match: null,
  },
  {
    route: () => route`/foo/bar`,
    input: '/foo/bar/',
    expected_match: null,
  },
  {
    route: () => route`/foo/bar`,
    input: '/foo/bar/baz',
    expected_match: null,
  },
  {
    route: () => route`/foo/${['bar', string]}`,
    input: '/foo/bar',
    expected_match: {
      params: { bar: 'bar' },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/foo/${['bar', string]}`,
    input: '/foo/index.html',
    expected_match: {
      params: { bar: 'index.html' },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/foo/${['bar', string]}`,
    input: '/foo/',
    expected_match: null,
  },
  {
    route: () => route`/foo/${['bar', string]}`,
    input: '/foo/bar/',
    expected_match: null,
  },
  {
    route: () => route`/${['café', string]}`,
    input: '/foo',
    expected_match: {
      params: { café: 'foo' },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/${['\u2118', string]}`,
    input: '/foo',
    expected_match: {
      params: { '\u2118': 'foo' },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/${['\u3400', string]}`,
    input: '/foo',
    expected_match: {
      params: { '\u3400': 'foo' },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/foo/bar`,
    input: '/foo/./bar',
    expected_match: {
      params: {},
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/foo/baz`,
    input: '/foo/bar/../baz',
    expected_match: {
      params: {},
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/caf%C3%A9`,
    input: '/café',
    expected_match: {
      params: {},
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/caf%c3%a9`,
    input: '/café',
    expected_match: null,
  },
  // Note URLPattern doesn't match here
  {
    route: () => route`/foo/bar`,
    input: 'foo/bar',
    expected_match: {
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
    expected_match: {
      params: {},
      search: {},
      hash: '',
    },
  },
   {
    route: () => route`./foo/bar`,
    input: 'foo/bar',
    expected_match: {
      params: {},
      search: {},
      hash: '',
    },
  },
  **/
  {
    route: () => route``,
    input: '/',
    expected_match: {
      params: {},
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`${['name', string]}.html`,
    input: 'foo.html',
    expected_match: {
      params: { name: 'foo' },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/foo!`,
    input: '/foo!',
    expected_match: {
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
    expected_match: {
      params: { int: 1 },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/${['float', float]}`,
    input: '/1.01',
    expected_match: {
      params: { float: 1.01 },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/${['boolean', boolean]}`,
    input: '/true',
    expected_match: {
      params: { boolean: true },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/${['boolean', boolean]}`,
    input: '/false',
    expected_match: {
      params: { boolean: false },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/${['data', date]}`,
    input: '/01-01-2000',
    expected_match: {
      params: { data: new Date('01-01-2000') },
      search: {},
      hash: '',
    },
  },
];

const fixtures = [...URLPatternFixtures, ...decoderFixtures];

for (const { route, input, expected_match, error } of fixtures) {
  test(`Decode: '${input}' for route '${route.toString().slice(6)}'`, () => {
    if (error) {
      assert.throws(() => route());
    } else {
      assert.deepStrictEqual(route().decode(input), expected_match);
    }
  });
}
