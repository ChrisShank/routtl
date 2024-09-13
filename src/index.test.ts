import test from 'node:test';
import assert from 'node:assert';
import {
  RouteData,
  RouteParser,
  array,
  boolean,
  date,
  datetime,
  num,
  route,
  string,
} from './index.js';

interface DecodeFixture {
  route: () => RouteParser;
  url: string;
  encodedURL?: string;
  data: RouteData<Record<string, any>> | null;
}

// Adapted from the URLPattern test suite: https://github.com/kenchris/urlpattern-polyfill/blob/main/test/urlpatterntestdata.json
const URLPatternFixtures: DecodeFixture[] = [
  {
    route: () => route`/foo/bar`,
    url: '/foo/bar',
    data: {
      params: {},
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/foo/bar`,
    url: '/foo/ba',
    data: null,
  },
  {
    route: () => route`/foo/bar`,
    url: '/foo/bar/',
    data: null,
  },
  {
    route: () => route`/foo/bar`,
    url: '/foo/bar/baz',
    data: null,
  },
  {
    route: () => route`/foo/${string('bar')}`,
    url: '/foo/bar',
    data: {
      params: { bar: 'bar' },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/foo/${string('bar')}`,
    url: '/foo/index.html',
    data: {
      params: { bar: 'index.html' },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/foo/${string('bar')}`,
    url: '/foo/',
    data: null,
  },
  {
    route: () => route`/foo/${string('bar')}`,
    url: '/foo/bar/',
    data: null,
  },
  {
    route: () => route`/${string('café')}`,
    url: '/foo',
    data: {
      params: { café: 'foo' },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/${string('\u2118')}`,
    url: '/foo',
    data: {
      params: { '\u2118': 'foo' },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/${string('\u3400')}`,
    url: '/foo',
    data: {
      params: { '\u3400': 'foo' },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/foo/bar`,
    url: '/foo/./bar',
    encodedURL: '/foo/bar',
    data: {
      params: {},
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/foo/baz`,
    url: '/foo/bar/../baz',
    encodedURL: '/foo/baz',
    data: {
      params: {},
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/caf%C3%A9`,
    url: '/café',
    encodedURL: '/caf%C3%A9',
    data: {
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
    url: '/café',
    data: null,
  },
  // Note URLPattern doesn't match here
  {
    route: () => route`/foo/bar`,
    url: 'foo/bar',
    encodedURL: '/foo/bar',
    data: {
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
    url: '/',
    data: {
      params: {},
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`${string('name')}.html`,
    url: 'foo.html',
    encodedURL: '/foo.html',
    data: {
      params: { name: 'foo' },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/foo!`,
    url: '/foo!',
    data: {
      params: {},
      search: {},
      hash: '',
    },
  },
];

const fixtures: DecodeFixture[] = [
  ...URLPatternFixtures,
  {
    route: () => route`/${num('num')}`,
    url: '/1',
    data: {
      params: { num: 1 },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/${num('float')}`,
    url: '/1.01',
    data: {
      params: { float: 1.01 },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/${boolean('boolean')}`,
    url: '/true',
    data: {
      params: { boolean: true },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/${boolean('boolean')}`,
    url: '/false',
    data: {
      params: { boolean: false },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/${date('date')}`,
    url: '/2000-01-01',
    data: {
      params: { date: new Date('2000-01-01') },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/${datetime('datetime')}`,
    url: '/2000-01-01T07%3A07%3A06.664Z',
    data: {
      params: { datetime: new Date('2000-01-01T07:07:06.664Z') },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/${array(num)('numArray')}`,
    url: '/%5B%221%22%2C%222%22%2C%223%22%5D',
    data: {
      params: { numArray: [1, 2, 3] },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/${array(string)('stringArray')}`,
    url: '/%5B%22foo%22%2C%22bar%22%2C%22baz%22%5D',
    data: {
      params: { stringArray: ['foo', 'bar', 'baz'] },
      search: {},
      hash: '',
    },
  },
  {
    route: () => route`/foo`,
    url: '/foo#bar',
    data: {
      params: {},
      search: {},
      hash: 'bar',
    },
  },
];

for (const { route, url, data, encodedURL } of fixtures) {
  test(`'${url}' for ${route}`, () => {
    assert.deepStrictEqual(route().decode(url), data);

    if (data !== null) {
      assert.deepStrictEqual(route().encode(data), encodedURL || url);
    }
  });
}

type ErrorFixture = () => RouteParser;

const errorFixtures: ErrorFixture[] = [() => route`/${string('id')}/${string('id')}`];

for (const route of errorFixtures) {
  test(`Throws: '${route}'`, () => {
    assert.throws(() => route());
  });
}
