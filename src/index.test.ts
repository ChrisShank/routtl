import test from 'node:test';
import assert from 'node:assert';
import { DecodedRouteData, RouteParser, route, string } from './index.js';

type DecodeFixture =
  | {
      route: () => RouteParser;
      input: string;
      expected_match: DecodedRouteData<Record<string, any>>;
      error?: undefined;
    }
  | {
      route: () => RouteParser;
      input: string;
      expected_match?: undefined;
      error: true;
    };

// Adapted from the URLPattern test suite: https://github.com/kenchris/urlpattern-polyfill/blob/main/test/urlpatterntestdata.json
const fixtures: DecodeFixture[] = [
  {
    route: () => route`/foo/bar`,
    input: '/foo/bar',
    expected_match: {
      matched: true,
      params: {},
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/foo/bar`,
    input: '/foo/ba',
    expected_match: {
      matched: false,
      params: {},
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/foo/bar`,
    input: '/foo/bar/',
    expected_match: {
      matched: false,
      params: {},
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/foo/bar`,
    input: '/foo/bar/baz',
    expected_match: {
      matched: false,
      params: {},
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/foo/${['bar', string]}`,
    input: '/foo/bar',
    expected_match: {
      matched: true,
      params: { bar: 'bar' },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/foo/${['bar', string]}`,
    input: '/foo/index.html',
    expected_match: {
      matched: true,
      params: { bar: 'index.html' },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/foo/${['bar', string]}`,
    input: '/foo/',
    expected_match: {
      matched: false,
      params: {},
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/foo/${['bar', string]}`,
    input: '/foo/bar/',
    expected_match: {
      matched: false,
      params: {},
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/${['café', string]}`,
    input: '/foo',
    expected_match: {
      matched: true,
      params: { café: 'foo' },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/${['\u2118', string]}`,
    input: '/foo',
    expected_match: {
      matched: true,
      params: { '\u2118': 'foo' },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/${['\u3400', string]}`,
    input: '/foo',
    expected_match: {
      matched: true,
      params: { '\u3400': 'foo' },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/foo/bar`,
    input: '/foo/./bar',
    expected_match: {
      matched: true,
      params: {},
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/foo/baz`,
    input: '/foo/bar/../baz',
    expected_match: {
      matched: true,
      params: {},
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/caf%C3%A9`,
    input: '/café',
    expected_match: {
      matched: true,
      params: {},
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/caf%c3%a9`,
    input: '/café',
    expected_match: {
      matched: false,
      params: {},
      search: {},
      hash: '',
    },
  },
  // Note URLPattern doesn't match here
  {
    route: () => route`/foo/bar`,
    input: 'foo/bar',
    expected_match: {
      matched: true,
      params: {},
      search: {},
      hash: '',
    },
  },
  /* Support relative paths in definition?
  {
    route: () => route`/foo/../bar`,
    input: '/bar',
    expected_match: {
      matched: true,
      params: {},
      search: {},
      hash: '',
    },
  },
   {
    route: () => route`./foo/bar`,
    input: 'foo/bar',
    expected_match: {
      matched: true,
      params: {},
      search: {},
      hash: '',
    },
  },
  **/
  /** Normalize routes without a slash?
  {
    route: () => route``,
    input: '/',
    expected_match: {
      matched: true,
      params: {},
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`${['name', string]}.html`,
    input: 'foo.html',
    expected_match: {
      matched: false,
      params: { name: 'foo' },
      search: {},
      hash: '',
    },
  },
  */
  {
    route: () => route`/foo!`,
    input: '/foo!',
    expected_match: {
      matched: true,
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

for (const { route, input, expected_match, error } of fixtures) {
  test(`Decode: '${input}' for route '${route.toString().slice(6)}'`, () => {
    if (error) {
      assert.throws(() => route());
    } else {
      assert.deepStrictEqual(route().decode(input), expected_match);
    }
  });
}
