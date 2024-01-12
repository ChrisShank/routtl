import test from 'node:test';
import assert from 'node:assert';
import { DecodedRouteData, RouteParser, route, string } from './index.js';

interface DecodeFixture {
  route: () => RouteParser;
  input: string;
  expected_match: DecodedRouteData<Record<string, any>>;
  error?: true;
}

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
    input: '',
    expected_match: {
      matched: true,
      params: {},
      search: {},
      hash: '',
    },
    error: true,
  },
];

//   {
//     pattern: ['https://example.com:8080/foo?bar#baz'],
//     inputs: [{ pathname: '/foo', search: 'bar', hash: 'baz', baseURL: 'https://example.com:8080' }],
//     expected_obj: {
//       protocol: 'https',
//       username: '*',
//       password: '*',
//       hostname: 'example.com',
//       port: '8080',
//       pathname: '/foo',
//       search: 'bar',
//       hash: 'baz',
//     },
//     expected_match: {
//       protocol: { input: 'https', groups: {} },
//       hostname: { input: 'example.com', groups: {} },
//       port: { input: '8080', groups: {} },
//       pathname: { input: '/foo', groups: {} },
//       search: { input: 'bar', groups: {} },
//       hash: { input: 'baz', groups: {} },
//     },
//   },
//   {
//     pattern: ['/foo?bar#baz', 'https://example.com:8080'],
//     inputs: [{ pathname: '/foo', search: 'bar', hash: 'baz', baseURL: 'https://example.com:8080' }],
//     expected_obj: {
//       pathname: '/foo',
//       search: 'bar',
//       hash: 'baz',
//     },
//     expected_match: {
//       protocol: { input: 'https', groups: {} },
//       hostname: { input: 'example.com', groups: {} },
//       port: { input: '8080', groups: {} },
//       pathname: { input: '/foo', groups: {} },
//       search: { input: 'bar', groups: {} },
//       hash: { input: 'baz', groups: {} },
//     },
//   },
//   {
//     pattern: ['http{s}?://{*.}?example.com/:product/:endpoint'],
//     inputs: ['https://sub.example.com/foo/bar'],
//     exactly_empty_components: ['port'],
//     expected_obj: {
//       protocol: 'http{s}?',
//       hostname: '{*.}?example.com',
//       pathname: '/:product/:endpoint',
//     },
//     expected_match: {
//       protocol: { input: 'https', groups: {} },
//       hostname: { input: 'sub.example.com', groups: { '0': 'sub' } },
//       pathname: { input: '/foo/bar', groups: { product: 'foo', endpoint: 'bar' } },
//     },
//   },
//   {
//     pattern: ['https://example.com?foo'],
//     inputs: ['https://example.com/?foo'],
//     exactly_empty_components: ['port'],
//     expected_obj: {
//       protocol: 'https',
//       hostname: 'example.com',
//       pathname: '/',
//       search: 'foo',
//     },
//     expected_match: {
//       protocol: { input: 'https', groups: {} },
//       hostname: { input: 'example.com', groups: {} },
//       pathname: { input: '/', groups: {} },
//       search: { input: 'foo', groups: {} },
//     },
//   },
//   {
//     pattern: ['https://example.com#foo'],
//     inputs: ['https://example.com/#foo'],
//     exactly_empty_components: ['port', 'search'],
//     expected_obj: {
//       protocol: 'https',
//       hostname: 'example.com',
//       pathname: '/',
//       hash: 'foo',
//     },
//     expected_match: {
//       protocol: { input: 'https', groups: {} },
//       hostname: { input: 'example.com', groups: {} },
//       pathname: { input: '/', groups: {} },
//       hash: { input: 'foo', groups: {} },
//     },
//   },
//   {
//     pattern: ['https://example.com:8080?foo'],
//     inputs: ['https://example.com:8080/?foo'],
//     expected_obj: {
//       protocol: 'https',
//       hostname: 'example.com',
//       port: '8080',
//       pathname: '/',
//       search: 'foo',
//     },
//     expected_match: {
//       protocol: { input: 'https', groups: {} },
//       hostname: { input: 'example.com', groups: {} },
//       port: { input: '8080', groups: {} },
//       pathname: { input: '/', groups: {} },
//       search: { input: 'foo', groups: {} },
//     },
//   },
//   {
//     pattern: ['https://example.com:8080#foo'],
//     inputs: ['https://example.com:8080/#foo'],
//     exactly_empty_components: ['search'],
//     expected_obj: {
//       protocol: 'https',
//       hostname: 'example.com',
//       port: '8080',
//       pathname: '/',
//       hash: 'foo',
//     },
//     expected_match: {
//       protocol: { input: 'https', groups: {} },
//       hostname: { input: 'example.com', groups: {} },
//       port: { input: '8080', groups: {} },
//       pathname: { input: '/', groups: {} },
//       hash: { input: 'foo', groups: {} },
//     },
//   },
//   {
//     pattern: ['https://example.com/?foo'],
//     inputs: ['https://example.com/?foo'],
//     exactly_empty_components: ['port'],
//     expected_obj: {
//       protocol: 'https',
//       hostname: 'example.com',
//       pathname: '/',
//       search: 'foo',
//     },
//     expected_match: {
//       protocol: { input: 'https', groups: {} },
//       hostname: { input: 'example.com', groups: {} },
//       pathname: { input: '/', groups: {} },
//       search: { input: 'foo', groups: {} },
//     },
//   },
//   {
//     pattern: ['https://example.com/#foo'],
//     inputs: ['https://example.com/#foo'],
//     exactly_empty_components: ['port', 'search'],
//     expected_obj: {
//       protocol: 'https',
//       hostname: 'example.com',
//       pathname: '/',
//       hash: 'foo',
//     },
//     expected_match: {
//       protocol: { input: 'https', groups: {} },
//       hostname: { input: 'example.com', groups: {} },
//       pathname: { input: '/', groups: {} },
//       hash: { input: 'foo', groups: {} },
//     },
//   },
//   {
//     pattern: ['https://example.com/*?foo'],
//     inputs: ['https://example.com/?foo'],
//     exactly_empty_components: ['port'],
//     expected_obj: {
//       protocol: 'https',
//       hostname: 'example.com',
//       pathname: '/*?foo',
//     },
//     expected_match: null,
//   },
//   {
//     pattern: ['https://example.com/*\\?foo'],
//     inputs: ['https://example.com/?foo'],
//     exactly_empty_components: ['port'],
//     expected_obj: {
//       protocol: 'https',
//       hostname: 'example.com',
//       pathname: '/*',
//       search: 'foo',
//     },
//     expected_match: {
//       protocol: { input: 'https', groups: {} },
//       hostname: { input: 'example.com', groups: {} },
//       pathname: { input: '/', groups: { '0': '' } },
//       search: { input: 'foo', groups: {} },
//     },
//   },
//   {
//     pattern: ['https://example.com/:name?foo'],
//     inputs: ['https://example.com/bar?foo'],
//     exactly_empty_components: ['port'],
//     expected_obj: {
//       protocol: 'https',
//       hostname: 'example.com',
//       pathname: '/:name?foo',
//     },
//     expected_match: null,
//   },
//   {
//     pattern: ['https://example.com/:name\\?foo'],
//     inputs: ['https://example.com/bar?foo'],
//     exactly_empty_components: ['port'],
//     expected_obj: {
//       protocol: 'https',
//       hostname: 'example.com',
//       pathname: '/:name',
//       search: 'foo',
//     },
//     expected_match: {
//       protocol: { input: 'https', groups: {} },
//       hostname: { input: 'example.com', groups: {} },
//       pathname: { input: '/bar', groups: { name: 'bar' } },
//       search: { input: 'foo', groups: {} },
//     },
//   },
//   {
//     pattern: ['https://example.com/(bar)?foo'],
//     inputs: ['https://example.com/bar?foo'],
//     exactly_empty_components: ['port'],
//     expected_obj: {
//       protocol: 'https',
//       hostname: 'example.com',
//       pathname: '/(bar)?foo',
//     },
//     expected_match: null,
//   },
//   {
//     pattern: ['https://example.com/(bar)\\?foo'],
//     inputs: ['https://example.com/bar?foo'],
//     exactly_empty_components: ['port'],
//     expected_obj: {
//       protocol: 'https',
//       hostname: 'example.com',
//       pathname: '/(bar)',
//       search: 'foo',
//     },
//     expected_match: {
//       protocol: { input: 'https', groups: {} },
//       hostname: { input: 'example.com', groups: {} },
//       pathname: { input: '/bar', groups: { '0': 'bar' } },
//       search: { input: 'foo', groups: {} },
//     },
//   },
//   {
//     pattern: ['https://example.com/{bar}?foo'],
//     inputs: ['https://example.com/bar?foo'],
//     exactly_empty_components: ['port'],
//     expected_obj: {
//       protocol: 'https',
//       hostname: 'example.com',
//       pathname: '/{bar}?foo',
//     },
//     expected_match: null,
//   },
//   {
//     pattern: ['https://example.com/{bar}\\?foo'],
//     inputs: ['https://example.com/bar?foo'],
//     exactly_empty_components: ['port'],
//     expected_obj: {
//       protocol: 'https',
//       hostname: 'example.com',
//       pathname: '/bar',
//       search: 'foo',
//     },
//     expected_match: {
//       protocol: { input: 'https', groups: {} },
//       hostname: { input: 'example.com', groups: {} },
//       pathname: { input: '/bar', groups: {} },
//       search: { input: 'foo', groups: {} },
//     },
//   },
//   {
//     pattern: ['https://example.com/'],
//     inputs: ['https://example.com:8080/'],
//     exactly_empty_components: ['port'],
//     expected_obj: {
//       protocol: 'https',
//       hostname: 'example.com',
//       port: '',
//       pathname: '/',
//     },
//     expected_match: null,
//   },
//   {
//     pattern: ['data:foobar'],
//     inputs: ['data:foobar'],
//     expected_obj: 'error',
//   },
//   {
//     pattern: ['data\\:foobar'],
//     inputs: ['data:foobar'],
//     exactly_empty_components: ['hostname', 'port'],
//     expected_obj: {
//       protocol: 'data',
//       pathname: 'foobar',
//     },
//     expected_match: {
//       protocol: { input: 'data', groups: {} },
//       pathname: { input: 'foobar', groups: {} },
//     },
//   },
//   {
//     pattern: ['https://{sub.}?example.com/foo'],
//     inputs: ['https://example.com/foo'],
//     exactly_empty_components: ['port'],
//     expected_obj: {
//       protocol: 'https',
//       hostname: '{sub.}?example.com',
//       pathname: '/foo',
//     },
//     expected_match: {
//       protocol: { input: 'https', groups: {} },
//       hostname: { input: 'example.com', groups: {} },
//       pathname: { input: '/foo', groups: {} },
//     },
//   },
//   {
//     pattern: ['https://{sub.}?example{.com/}foo'],
//     inputs: ['https://example.com/foo'],
//     expected_obj: 'error',
//   },
//   {
//     pattern: ['{https://}example.com/foo'],
//     inputs: ['https://example.com/foo'],
//     expected_obj: 'error',
//   },
//   {
//     pattern: ['https://(sub.)?example.com/foo'],
//     inputs: ['https://example.com/foo'],
//     exactly_empty_components: ['port'],
//     expected_obj: {
//       protocol: 'https',
//       hostname: '(sub.)?example.com',
//       pathname: '/foo',
//     },
//     '//': 'The `null` below is translated to undefined in the test harness.',
//     expected_match: {
//       protocol: { input: 'https', groups: {} },
//       hostname: { input: 'example.com', groups: { '0': null } },
//       pathname: { input: '/foo', groups: {} },
//     },
//   },
//   {
//     pattern: ['https://(sub.)?example(.com/)foo'],
//     inputs: ['https://example.com/foo'],
//     exactly_empty_components: ['port'],
//     expected_obj: {
//       protocol: 'https',
//       hostname: '(sub.)?example(.com/)foo',
//       pathname: '*',
//     },
//     expected_match: null,
//   },
//   {
//     pattern: ['(https://)example.com/foo'],
//     inputs: ['https://example.com/foo'],
//     expected_obj: 'error',
//   },
//   {
//     pattern: ['https://{sub{.}}example.com/foo'],
//     inputs: ['https://example.com/foo'],
//     expected_obj: 'error',
//   },
//   {
//     pattern: ['https://(sub(?:.))?example.com/foo'],
//     inputs: ['https://example.com/foo'],
//     exactly_empty_components: ['port'],
//     expected_obj: {
//       protocol: 'https',
//       hostname: '(sub(?:.))?example.com',
//       pathname: '/foo',
//     },
//     '//': 'The `null` below is translated to undefined in the test harness.',
//     expected_match: {
//       protocol: { input: 'https', groups: {} },
//       hostname: { input: 'example.com', groups: { '0': null } },
//       pathname: { input: '/foo', groups: {} },
//     },
//   },
//   {
//     pattern: ['file:///foo/bar'],
//     inputs: ['file:///foo/bar'],
//     exactly_empty_components: ['hostname', 'port'],
//     expected_obj: {
//       protocol: 'file',
//       pathname: '/foo/bar',
//     },
//     expected_match: {
//       protocol: { input: 'file', groups: {} },
//       pathname: { input: '/foo/bar', groups: {} },
//     },
//   },
//   {
//     pattern: ['data:'],
//     inputs: ['data:'],
//     exactly_empty_components: ['hostname', 'port', 'pathname'],
//     expected_obj: {
//       protocol: 'data',
//     },
//     expected_match: {
//       protocol: { input: 'data', groups: {} },
//     },
//   },
//   {
//     pattern: ['foo://bar'],
//     inputs: ['foo://bad_url_browser_interop'],
//     exactly_empty_components: ['port'],
//     expected_obj: {
//       protocol: 'foo',
//       hostname: 'bar',
//     },
//     expected_match: null,
//   },
//   {
//     pattern: ['(café)://foo'],
//     expected_obj: 'error',
//   },
//   {
//     pattern: ['https://example.com/foo?bar#baz'],
//     inputs: [
//       { protocol: 'https:', search: '?bar', hash: '#baz', baseURL: 'http://example.com/foo' },
//     ],
//     exactly_empty_components: ['port'],
//     expected_obj: {
//       protocol: 'https',
//       hostname: 'example.com',
//       pathname: '/foo',
//       search: 'bar',
//       hash: 'baz',
//     },
//     expected_match: null,
//   },
//   {
//     pattern: [{ protocol: 'http{s}?:', search: '?bar', hash: '#baz' }],
//     inputs: ['http://example.com/foo?bar#baz'],
//     expected_obj: {
//       protocol: 'http{s}?',
//       search: 'bar',
//       hash: 'baz',
//     },
//     expected_match: {
//       protocol: { input: 'http', groups: {} },
//       hostname: { input: 'example.com', groups: { '0': 'example.com' } },
//       pathname: { input: '/foo', groups: { '0': '/foo' } },
//       search: { input: 'bar', groups: {} },
//       hash: { input: 'baz', groups: {} },
//     },
//   },
//   {
//     pattern: ['?bar#baz', 'https://example.com/foo'],
//     inputs: ['?bar#baz', 'https://example.com/foo'],
//     exactly_empty_components: ['port'],
//     expected_obj: {
//       protocol: 'https',
//       hostname: 'example.com',
//       pathname: '/foo',
//       search: 'bar',
//       hash: 'baz',
//     },
//     expected_match: {
//       protocol: { input: 'https', groups: {} },
//       hostname: { input: 'example.com', groups: {} },
//       pathname: { input: '/foo', groups: {} },
//       search: { input: 'bar', groups: {} },
//       hash: { input: 'baz', groups: {} },
//     },
//   },
//   {
//     pattern: ['?bar', 'https://example.com/foo#baz'],
//     inputs: ['?bar', 'https://example.com/foo#snafu'],
//     exactly_empty_components: ['port'],
//     expected_obj: {
//       protocol: 'https',
//       hostname: 'example.com',
//       pathname: '/foo',
//       search: 'bar',
//       hash: '*',
//     },
//     expected_match: {
//       protocol: { input: 'https', groups: {} },
//       hostname: { input: 'example.com', groups: {} },
//       pathname: { input: '/foo', groups: {} },
//       search: { input: 'bar', groups: {} },
//     },
//   },
//   {
//     pattern: ['#baz', 'https://example.com/foo?bar'],
//     inputs: ['#baz', 'https://example.com/foo?bar'],
//     exactly_empty_components: ['port'],
//     expected_obj: {
//       protocol: 'https',
//       hostname: 'example.com',
//       pathname: '/foo',
//       search: 'bar',
//       hash: 'baz',
//     },
//     expected_match: {
//       protocol: { input: 'https', groups: {} },
//       hostname: { input: 'example.com', groups: {} },
//       pathname: { input: '/foo', groups: {} },
//       search: { input: 'bar', groups: {} },
//       hash: { input: 'baz', groups: {} },
//     },
//   },
//   {
//     pattern: ['#baz', 'https://example.com/foo'],
//     inputs: ['#baz', 'https://example.com/foo'],
//     exactly_empty_components: ['port', 'search'],
//     expected_obj: {
//       protocol: 'https',
//       hostname: 'example.com',
//       pathname: '/foo',
//       hash: 'baz',
//     },
//     expected_match: {
//       protocol: { input: 'https', groups: {} },
//       hostname: { input: 'example.com', groups: {} },
//       pathname: { input: '/foo', groups: {} },
//       hash: { input: 'baz', groups: {} },
//     },
//   },
//   {
//     pattern: [{ pathname: '*' }],
//     inputs: ['foo', 'data:data-urls-cannot-be-base-urls'],
//     expected_match: null,
//   },
//   {
//     pattern: [{ pathname: '*' }],
//     inputs: ['foo', 'not|a|valid|url'],
//     expected_match: null,
//   },
//   {
//     pattern: ['https://foo\\:bar@example.com'],
//     inputs: ['https://foo:bar@example.com'],
//     exactly_empty_components: ['port'],
//     expected_obj: {
//       protocol: 'https',
//       username: 'foo',
//       password: 'bar',
//       hostname: 'example.com',
//       pathname: '*',
//     },
//     expected_match: {
//       protocol: { input: 'https', groups: {} },
//       username: { input: 'foo', groups: {} },
//       password: { input: 'bar', groups: {} },
//       hostname: { input: 'example.com', groups: {} },
//       pathname: { input: '/', groups: { '0': '/' } },
//     },
//   },
//   {
//     pattern: ['https://foo@example.com'],
//     inputs: ['https://foo@example.com'],
//     exactly_empty_components: ['port'],
//     expected_obj: {
//       protocol: 'https',
//       username: 'foo',
//       hostname: 'example.com',
//       pathname: '*',
//     },
//     expected_match: {
//       protocol: { input: 'https', groups: {} },
//       username: { input: 'foo', groups: {} },
//       hostname: { input: 'example.com', groups: {} },
//       pathname: { input: '/', groups: { '0': '/' } },
//     },
//   },
//   {
//     pattern: ['https://\\:bar@example.com'],
//     inputs: ['https://:bar@example.com'],
//     exactly_empty_components: ['username', 'port'],
//     expected_obj: {
//       protocol: 'https',
//       password: 'bar',
//       hostname: 'example.com',
//       pathname: '*',
//     },
//     expected_match: {
//       protocol: { input: 'https', groups: {} },
//       password: { input: 'bar', groups: {} },
//       hostname: { input: 'example.com', groups: {} },
//       pathname: { input: '/', groups: { '0': '/' } },
//     },
//   },
//   {
//     pattern: ['https://:user::pass@example.com'],
//     inputs: ['https://foo:bar@example.com'],
//     exactly_empty_components: ['port'],
//     expected_obj: {
//       protocol: 'https',
//       username: ':user',
//       password: ':pass',
//       hostname: 'example.com',
//       pathname: '*',
//     },
//     expected_match: {
//       protocol: { input: 'https', groups: {} },
//       username: { input: 'foo', groups: { user: 'foo' } },
//       password: { input: 'bar', groups: { pass: 'bar' } },
//       hostname: { input: 'example.com', groups: {} },
//       pathname: { input: '/', groups: { '0': '/' } },
//     },
//   },
//   {
//     pattern: ['https\\:foo\\:bar@example.com'],
//     inputs: ['https:foo:bar@example.com'],
//     exactly_empty_components: ['port'],
//     expected_obj: {
//       protocol: 'https',
//       username: 'foo',
//       password: 'bar',
//       hostname: 'example.com',
//       pathname: '*',
//     },
//     expected_match: {
//       protocol: { input: 'https', groups: {} },
//       username: { input: 'foo', groups: {} },
//       password: { input: 'bar', groups: {} },
//       hostname: { input: 'example.com', groups: {} },
//       pathname: { input: '/', groups: { '0': '/' } },
//     },
//   },
//   {
//     pattern: ['data\\:foo\\:bar@example.com'],
//     inputs: ['data:foo:bar@example.com'],
//     exactly_empty_components: ['hostname', 'port'],
//     expected_obj: {
//       protocol: 'data',
//       pathname: 'foo\\:bar@example.com',
//     },
//     expected_match: {
//       protocol: { input: 'data', groups: {} },
//       pathname: { input: 'foo:bar@example.com', groups: {} },
//     },
//   },
//   {
//     pattern: ['https://foo{\\:}bar@example.com'],
//     inputs: ['https://foo:bar@example.com'],
//     exactly_empty_components: ['port'],
//     expected_obj: {
//       protocol: 'https',
//       username: 'foo%3Abar',
//       hostname: 'example.com',
//     },
//     expected_match: null,
//   },
//   {
//     pattern: ['data{\\:}channel.html', 'https://example.com'],
//     inputs: ['https://example.com/data:channel.html'],
//     exactly_empty_components: ['port'],
//     expected_obj: {
//       protocol: 'https',
//       hostname: 'example.com',
//       pathname: '/data\\:channel.html',
//       search: '*',
//       hash: '*',
//     },
//     expected_match: {
//       protocol: { input: 'https', groups: {} },
//       hostname: { input: 'example.com', groups: {} },
//       pathname: { input: '/data:channel.html', groups: {} },
//     },
//   },
//   {
//     pattern: ['http://[\\:\\:1]/'],
//     inputs: ['http://[::1]/'],
//     exactly_empty_components: ['port'],
//     expected_obj: {
//       protocol: 'http',
//       hostname: '[\\:\\:1]',
//       pathname: '/',
//     },
//     expected_match: {
//       protocol: { input: 'http', groups: {} },
//       hostname: { input: '[::1]', groups: {} },
//       pathname: { input: '/', groups: {} },
//     },
//   },
//   {
//     pattern: ['http://[\\:\\:1]:8080/'],
//     inputs: ['http://[::1]:8080/'],
//     expected_obj: {
//       protocol: 'http',
//       hostname: '[\\:\\:1]',
//       port: '8080',
//       pathname: '/',
//     },
//     expected_match: {
//       protocol: { input: 'http', groups: {} },
//       hostname: { input: '[::1]', groups: {} },
//       port: { input: '8080', groups: {} },
//       pathname: { input: '/', groups: {} },
//     },
//   },
//   {
//     pattern: ['http://[\\:\\:a]/'],
//     inputs: ['http://[::a]/'],
//     exactly_empty_components: ['port'],
//     expected_obj: {
//       protocol: 'http',
//       hostname: '[\\:\\:a]',
//       pathname: '/',
//     },
//     expected_match: {
//       protocol: { input: 'http', groups: {} },
//       hostname: { input: '[::a]', groups: {} },
//       pathname: { input: '/', groups: {} },
//     },
//   },
//   {
//     pattern: ['http://[:address]/'],
//     inputs: ['http://[::1]/'],
//     exactly_empty_components: ['port'],
//     expected_obj: {
//       protocol: 'http',
//       hostname: '[:address]',
//       pathname: '/',
//     },
//     expected_match: {
//       protocol: { input: 'http', groups: {} },
//       hostname: { input: '[::1]', groups: { address: '::1' } },
//       pathname: { input: '/', groups: {} },
//     },
//   },
//   {
//     pattern: ['http://[\\:\\:AB\\::num]/'],
//     inputs: ['http://[::ab:1]/'],
//     exactly_empty_components: ['port'],
//     expected_obj: {
//       protocol: 'http',
//       hostname: '[\\:\\:ab\\::num]',
//       pathname: '/',
//     },
//     expected_match: {
//       protocol: { input: 'http', groups: {} },
//       hostname: { input: '[::ab:1]', groups: { num: '1' } },
//       pathname: { input: '/', groups: {} },
//     },
//   },
//   {
//     pattern: [{ hostname: '[\\:\\:AB\\::num]' }],
//     inputs: [{ hostname: '[::ab:1]' }],
//     expected_obj: {
//       hostname: '[\\:\\:ab\\::num]',
//     },
//     expected_match: {
//       hostname: { input: '[::ab:1]', groups: { num: '1' } },
//     },
//   },
//   {
//     pattern: [{ hostname: '[\\:\\:xY\\::num]' }],
//     expected_obj: 'error',
//   },
//   {
//     pattern: [{ hostname: '{[\\:\\:ab\\::num]}' }],
//     inputs: [{ hostname: '[::ab:1]' }],
//     expected_match: {
//       hostname: { input: '[::ab:1]', groups: { num: '1' } },
//     },
//   },
//   {
//     pattern: [{ hostname: '{[\\:\\:fé\\::num]}' }],
//     expected_obj: 'error',
//   },
//   {
//     pattern: [{ hostname: '{[\\:\\::num\\:1]}' }],
//     inputs: [{ hostname: '[::ab:1]' }],
//     expected_match: {
//       hostname: { input: '[::ab:1]', groups: { num: 'ab' } },
//     },
//   },
//   {
//     pattern: [{ hostname: '{[\\:\\::num\\:fé]}' }],
//     expected_obj: 'error',
//   },
//   {
//     pattern: [{ hostname: '[*\\:1]' }],
//     inputs: [{ hostname: '[::ab:1]' }],
//     expected_match: {
//       hostname: { input: '[::ab:1]', groups: { '0': '::ab' } },
//     },
//   },
//   {
//     pattern: [{ hostname: '*\\:1]' }],
//     expected_obj: 'error',
//   },
//   {
//     pattern: ['https://foo{{@}}example.com'],
//     inputs: ['https://foo@example.com'],
//     expected_obj: 'error',
//   },
//   {
//     pattern: ['https://foo{@example.com'],
//     inputs: ['https://foo@example.com'],
//     expected_obj: 'error',
//   },
//   {
//     pattern: ['data\\:text/javascript,let x = 100/:tens?5;'],
//     inputs: ['data:text/javascript,let x = 100/5;'],
//     exactly_empty_components: ['hostname', 'port'],
//     expected_obj: {
//       protocol: 'data',
//       pathname: 'text/javascript,let x = 100/:tens?5;',
//     },
//     '//': 'The `null` below is translated to undefined in the test harness.',
//     expected_match: {
//       protocol: { input: 'data', groups: {} },
//       pathname: { input: 'text/javascript,let x = 100/5;', groups: { tens: null } },
//     },
//   },
//   {
//     pattern: [{ pathname: '/foo', baseURL: '' }],
//     expected_obj: 'error',
//   },
//   {
//     pattern: ['/foo', ''],
//     expected_obj: 'error',
//   },
//   {
//     pattern: [{ pathname: '/foo' }, 'https://example.com'],
//     expected_obj: 'error',
//   },
//   {
//     pattern: [{ pathname: ':name*' }],
//     inputs: [{ pathname: 'foobar' }],
//     expected_match: {
//       pathname: { input: 'foobar', groups: { name: 'foobar' } },
//     },
//   },
//   {
//     pattern: [{ pathname: ':name+' }],
//     inputs: [{ pathname: 'foobar' }],
//     expected_match: {
//       pathname: { input: 'foobar', groups: { name: 'foobar' } },
//     },
//   },
//   {
//     pattern: [{ pathname: ':name' }],
//     inputs: [{ pathname: 'foobar' }],
//     expected_match: {
//       pathname: { input: 'foobar', groups: { name: 'foobar' } },
//     },
//   },
//   {
//     pattern: [{ protocol: ':name*' }],
//     inputs: [{ protocol: 'foobar' }],
//     expected_match: {
//       protocol: { input: 'foobar', groups: { name: 'foobar' } },
//     },
//   },
//   {
//     pattern: [{ protocol: ':name+' }],
//     inputs: [{ protocol: 'foobar' }],
//     expected_match: {
//       protocol: { input: 'foobar', groups: { name: 'foobar' } },
//     },
//   },
//   {
//     pattern: [{ protocol: ':name' }],
//     inputs: [{ protocol: 'foobar' }],
//     expected_match: {
//       protocol: { input: 'foobar', groups: { name: 'foobar' } },
//     },
//   },
//   {
//     pattern: [{ hostname: 'bad hostname' }],
//     expected_obj: 'error',
//   },
//   {
//     pattern: [{ hostname: 'bad#hostname' }],
//     expected_obj: 'error',
//   },
//   {
//     pattern: [{ hostname: 'bad%hostname' }],
//     expected_obj: 'error',
//   },
//   {
//     pattern: [{ hostname: 'bad/hostname' }],
//     expected_obj: 'error',
//   },
//   {
//     pattern: [{ hostname: 'bad\\:hostname' }],
//     expected_obj: 'error',
//   },
//   {
//     pattern: [{ hostname: 'bad<hostname' }],
//     expected_obj: 'error',
//   },
//   {
//     pattern: [{ hostname: 'bad>hostname' }],
//     expected_obj: 'error',
//   },
//   {
//     pattern: [{ hostname: 'bad?hostname' }],
//     expected_obj: 'error',
//   },
//   {
//     pattern: [{ hostname: 'bad@hostname' }],
//     expected_obj: 'error',
//   },
//   {
//     pattern: [{ hostname: 'bad[hostname' }],
//     expected_obj: 'error',
//   },
//   {
//     pattern: [{ hostname: 'bad]hostname' }],
//     expected_obj: 'error',
//   },
//   {
//     pattern: [{ hostname: 'bad\\\\hostname' }],
//     expected_obj: 'error',
//   },
//   {
//     pattern: [{ hostname: 'bad^hostname' }],
//     expected_obj: 'error',
//   },
//   {
//     pattern: [{ hostname: 'bad|hostname' }],
//     expected_obj: 'error',
//   },
//   {
//     pattern: [{ hostname: 'bad\nhostname' }],
//     expected_obj: 'error',
//   },
//   {
//     pattern: [{ hostname: 'bad\rhostname' }],
//     expected_obj: 'error',
//   },
//   {
//     pattern: [{ hostname: 'bad\thostname' }],
//     expected_obj: 'error',
//   },
//   {
//     pattern: [{}],
//     inputs: ['https://example.com/'],
//     expected_match: {
//       protocol: { input: 'https', groups: { '0': 'https' } },
//       hostname: { input: 'example.com', groups: { '0': 'example.com' } },
//       pathname: { input: '/', groups: { '0': '/' } },
//     },
//   },
//   {
//     pattern: [],
//     inputs: ['https://example.com/'],
//     expected_match: {
//       protocol: { input: 'https', groups: { '0': 'https' } },
//       hostname: { input: 'example.com', groups: { '0': 'example.com' } },
//       pathname: { input: '/', groups: { '0': '/' } },
//     },
//   },
//   {
//     pattern: [],
//     inputs: [{}],
//     expected_match: {},
//   },
//   {
//     pattern: [],
//     inputs: [],
//     expected_match: { inputs: [{}] },
//   },
//   {
//     pattern: [{ pathname: '(foo)(.*)' }],
//     inputs: [{ pathname: 'foobarbaz' }],
//     expected_match: {
//       pathname: { input: 'foobarbaz', groups: { '0': 'foo', '1': 'barbaz' } },
//     },
//   },
//   {
//     pattern: [{ pathname: '{(foo)bar}(.*)' }],
//     inputs: [{ pathname: 'foobarbaz' }],
//     expected_match: {
//       pathname: { input: 'foobarbaz', groups: { '0': 'foo', '1': 'baz' } },
//     },
//   },
//   {
//     pattern: [{ pathname: '(foo)?(.*)' }],
//     inputs: [{ pathname: 'foobarbaz' }],
//     expected_obj: {
//       pathname: '(foo)?*',
//     },
//     expected_match: {
//       pathname: { input: 'foobarbaz', groups: { '0': 'foo', '1': 'barbaz' } },
//     },
//   },
//   {
//     pattern: [{ pathname: '{:foo}(.*)' }],
//     inputs: [{ pathname: 'foobarbaz' }],
//     expected_match: {
//       pathname: { input: 'foobarbaz', groups: { foo: 'f', '0': 'oobarbaz' } },
//     },
//   },
//   {
//     pattern: [{ pathname: '{:foo}(barbaz)' }],
//     inputs: [{ pathname: 'foobarbaz' }],
//     expected_match: {
//       pathname: { input: 'foobarbaz', groups: { foo: 'foo', '0': 'barbaz' } },
//     },
//   },
//   {
//     pattern: [{ pathname: '{:foo}{(.*)}' }],
//     inputs: [{ pathname: 'foobarbaz' }],
//     expected_obj: {
//       pathname: '{:foo}(.*)',
//     },
//     expected_match: {
//       pathname: { input: 'foobarbaz', groups: { foo: 'f', '0': 'oobarbaz' } },
//     },
//   },
//   {
//     pattern: [{ pathname: '{:foo}{(.*)bar}' }],
//     inputs: [{ pathname: 'foobarbaz' }],
//     expected_obj: {
//       pathname: ':foo{*bar}',
//     },
//     expected_match: null,
//   },
//   {
//     pattern: [{ pathname: '{:foo}{bar(.*)}' }],
//     inputs: [{ pathname: 'foobarbaz' }],
//     expected_obj: {
//       pathname: ':foo{bar*}',
//     },
//     expected_match: {
//       pathname: { input: 'foobarbaz', groups: { foo: 'foo', '0': 'baz' } },
//     },
//   },
//   {
//     pattern: [{ pathname: '{:foo}:bar(.*)' }],
//     inputs: [{ pathname: 'foobarbaz' }],
//     expected_obj: {
//       pathname: ':foo:bar(.*)',
//     },
//     expected_match: {
//       pathname: { input: 'foobarbaz', groups: { foo: 'f', bar: 'oobarbaz' } },
//     },
//   },
//   {
//     pattern: [{ pathname: '{:foo}?(.*)' }],
//     inputs: [{ pathname: 'foobarbaz' }],
//     expected_obj: {
//       pathname: ':foo?*',
//     },
//     expected_match: {
//       pathname: { input: 'foobarbaz', groups: { foo: 'f', '0': 'oobarbaz' } },
//     },
//   },
//   {
//     pattern: [{ pathname: '{:foo\\bar}' }],
//     inputs: [{ pathname: 'foobar' }],
//     expected_match: {
//       pathname: { input: 'foobar', groups: { foo: 'foo' } },
//     },
//   },
//   {
//     pattern: [{ pathname: '{:foo\\.bar}' }],
//     inputs: [{ pathname: 'foo.bar' }],
//     expected_obj: {
//       pathname: '{:foo.bar}',
//     },
//     expected_match: {
//       pathname: { input: 'foo.bar', groups: { foo: 'foo' } },
//     },
//   },
//   {
//     pattern: [{ pathname: '{:foo(foo)bar}' }],
//     inputs: [{ pathname: 'foobar' }],
//     expected_match: {
//       pathname: { input: 'foobar', groups: { foo: 'foo' } },
//     },
//   },
//   {
//     pattern: [{ pathname: '{:foo}bar' }],
//     inputs: [{ pathname: 'foobar' }],
//     expected_match: {
//       pathname: { input: 'foobar', groups: { foo: 'foo' } },
//     },
//   },
//   {
//     pattern: [{ pathname: ':foo\\bar' }],
//     inputs: [{ pathname: 'foobar' }],
//     expected_obj: {
//       pathname: '{:foo}bar',
//     },
//     expected_match: {
//       pathname: { input: 'foobar', groups: { foo: 'foo' } },
//     },
//   },
//   {
//     pattern: [{ pathname: ':foo{}(.*)' }],
//     inputs: [{ pathname: 'foobar' }],
//     expected_obj: {
//       pathname: '{:foo}(.*)',
//     },
//     expected_match: {
//       pathname: { input: 'foobar', groups: { foo: 'f', '0': 'oobar' } },
//     },
//   },
//   {
//     pattern: [{ pathname: ':foo{}bar' }],
//     inputs: [{ pathname: 'foobar' }],
//     expected_obj: {
//       pathname: '{:foo}bar',
//     },
//     expected_match: {
//       pathname: { input: 'foobar', groups: { foo: 'foo' } },
//     },
//   },
//   {
//     pattern: [{ pathname: ':foo{}?bar' }],
//     inputs: [{ pathname: 'foobar' }],
//     expected_obj: {
//       pathname: '{:foo}bar',
//     },
//     expected_match: {
//       pathname: { input: 'foobar', groups: { foo: 'foo' } },
//     },
//   },
//   {
//     pattern: [{ pathname: '*{}**?' }],
//     inputs: [{ pathname: 'foobar' }],
//     expected_obj: {
//       pathname: '*(.*)?',
//     },
//     '//': 'The `null` below is translated to undefined in the test harness.',
//     expected_match: {
//       pathname: { input: 'foobar', groups: { '0': 'foobar', '1': null } },
//     },
//   },
//   {
//     pattern: [{ pathname: ':foo(baz)(.*)' }],
//     inputs: [{ pathname: 'bazbar' }],
//     expected_match: {
//       pathname: { input: 'bazbar', groups: { foo: 'baz', '0': 'bar' } },
//     },
//   },
//   {
//     pattern: [{ pathname: ':foo(baz)bar' }],
//     inputs: [{ pathname: 'bazbar' }],
//     expected_match: {
//       pathname: { input: 'bazbar', groups: { foo: 'baz' } },
//     },
//   },
//   {
//     pattern: [{ pathname: '*/*' }],
//     inputs: [{ pathname: 'foo/bar' }],
//     expected_match: {
//       pathname: { input: 'foo/bar', groups: { '0': 'foo', '1': 'bar' } },
//     },
//   },
//   {
//     pattern: [{ pathname: '*\\/*' }],
//     inputs: [{ pathname: 'foo/bar' }],
//     expected_obj: {
//       pathname: '*/{*}',
//     },
//     expected_match: {
//       pathname: { input: 'foo/bar', groups: { '0': 'foo', '1': 'bar' } },
//     },
//   },
//   {
//     pattern: [{ pathname: '*/{*}' }],
//     inputs: [{ pathname: 'foo/bar' }],
//     expected_match: {
//       pathname: { input: 'foo/bar', groups: { '0': 'foo', '1': 'bar' } },
//     },
//   },
//   {
//     pattern: [{ pathname: '*//*' }],
//     inputs: [{ pathname: 'foo/bar' }],
//     expected_match: null,
//   },
//   {
//     pattern: [{ pathname: '/:foo.' }],
//     inputs: [{ pathname: '/bar.' }],
//     expected_match: {
//       pathname: { input: '/bar.', groups: { foo: 'bar' } },
//     },
//   },
//   {
//     pattern: [{ pathname: '/:foo..' }],
//     inputs: [{ pathname: '/bar..' }],
//     expected_match: {
//       pathname: { input: '/bar..', groups: { foo: 'bar' } },
//     },
//   },
//   {
//     pattern: [{ pathname: './foo' }],
//     inputs: [{ pathname: './foo' }],
//     expected_match: {
//       pathname: { input: './foo', groups: {} },
//     },
//   },
//   {
//     pattern: [{ pathname: '../foo' }],
//     inputs: [{ pathname: '../foo' }],
//     expected_match: {
//       pathname: { input: '../foo', groups: {} },
//     },
//   },
//   {
//     pattern: [{ pathname: ':foo./' }],
//     inputs: [{ pathname: 'bar./' }],
//     expected_match: {
//       pathname: { input: 'bar./', groups: { foo: 'bar' } },
//     },
//   },
//   {
//     pattern: [{ pathname: ':foo../' }],
//     inputs: [{ pathname: 'bar../' }],
//     expected_match: {
//       pathname: { input: 'bar../', groups: { foo: 'bar' } },
//     },
//   },
//   {
//     pattern: [{ pathname: '/:foo\\bar' }],
//     inputs: [{ pathname: '/bazbar' }],
//     expected_obj: {
//       pathname: '{/:foo}bar',
//     },
//     expected_match: {
//       pathname: { input: '/bazbar', groups: { foo: 'baz' } },
//     },
//   },
//   {
//     pattern: [{ pathname: '/foo/bar' }, { ignoreCase: true }],
//     inputs: [{ pathname: '/FOO/BAR' }],
//     expected_match: {
//       pathname: { input: '/FOO/BAR', groups: {} },
//     },
//   },
//   {
//     pattern: [{ ignoreCase: true }],
//     inputs: [{ pathname: '/FOO/BAR' }],
//     expected_match: {
//       pathname: { input: '/FOO/BAR', groups: { '0': '/FOO/BAR' } },
//     },
//   },
//   {
//     pattern: ['https://example.com:8080/foo?bar#baz', { ignoreCase: true }],
//     inputs: [{ pathname: '/FOO', search: 'BAR', hash: 'BAZ', baseURL: 'https://example.com:8080' }],
//     expected_obj: {
//       protocol: 'https',
//       hostname: 'example.com',
//       port: '8080',
//       pathname: '/foo',
//       search: 'bar',
//       hash: 'baz',
//     },
//     expected_match: {
//       protocol: { input: 'https', groups: {} },
//       hostname: { input: 'example.com', groups: {} },
//       port: { input: '8080', groups: {} },
//       pathname: { input: '/FOO', groups: {} },
//       search: { input: 'BAR', groups: {} },
//       hash: { input: 'BAZ', groups: {} },
//     },
//   },
//   {
//     pattern: ['/foo?bar#baz', 'https://example.com:8080', { ignoreCase: true }],
//     inputs: [{ pathname: '/FOO', search: 'BAR', hash: 'BAZ', baseURL: 'https://example.com:8080' }],
//     expected_obj: {
//       protocol: 'https',
//       hostname: 'example.com',
//       port: '8080',
//       pathname: '/foo',
//       search: 'bar',
//       hash: 'baz',
//     },
//     expected_match: {
//       protocol: { input: 'https', groups: {} },
//       hostname: { input: 'example.com', groups: {} },
//       port: { input: '8080', groups: {} },
//       pathname: { input: '/FOO', groups: {} },
//       search: { input: 'BAR', groups: {} },
//       hash: { input: 'BAZ', groups: {} },
//     },
//   },
//   {
//     pattern: ['/foo?bar#baz', { ignoreCase: true }, 'https://example.com:8080'],
//     inputs: [{ pathname: '/FOO', search: 'BAR', hash: 'BAZ', baseURL: 'https://example.com:8080' }],
//     expected_obj: 'error',
//   },
//   {
//     pattern: [{ search: 'foo', baseURL: 'https://example.com/a/+/b' }],
//     inputs: [{ search: 'foo', baseURL: 'https://example.com/a/+/b' }],
//     exactly_empty_components: ['port'],
//     expected_obj: {
//       pathname: '/a/\\+/b',
//     },
//     expected_match: {
//       hostname: { input: 'example.com', groups: {} },
//       pathname: { input: '/a/+/b', groups: {} },
//       protocol: { input: 'https', groups: {} },
//       search: { input: 'foo', groups: {} },
//     },
//   },
//   {
//     pattern: [{ hash: 'foo', baseURL: 'https://example.com/?q=*&v=?&hmm={}&umm=()' }],
//     inputs: [{ hash: 'foo', baseURL: 'https://example.com/?q=*&v=?&hmm={}&umm=()' }],
//     exactly_empty_components: ['port'],
//     expected_obj: {
//       search: 'q=\\*&v=\\?&hmm=\\{\\}&umm=\\(\\)',
//     },
//     expected_match: {
//       hostname: { input: 'example.com', groups: {} },
//       pathname: { input: '/', groups: {} },
//       protocol: { input: 'https', groups: {} },
//       search: { input: 'q=*&v=?&hmm={}&umm=()', groups: {} },
//       hash: { input: 'foo', groups: {} },
//     },
//   },
//   {
//     pattern: ['#foo', 'https://example.com/?q=*&v=?&hmm={}&umm=()'],
//     inputs: ['https://example.com/?q=*&v=?&hmm={}&umm=()#foo'],
//     exactly_empty_components: ['port'],
//     expected_obj: {
//       search: 'q=\\*&v=\\?&hmm=\\{\\}&umm=\\(\\)',
//       hash: 'foo',
//     },
//     expected_match: {
//       hostname: { input: 'example.com', groups: {} },
//       pathname: { input: '/', groups: {} },
//       protocol: { input: 'https', groups: {} },
//       search: { input: 'q=*&v=?&hmm={}&umm=()', groups: {} },
//       hash: { input: 'foo', groups: {} },
//     },
//   },

for (const { route, input, expected_match, error } of fixtures) {
  test(`Decode: '${input}' for route '${route}'`, () => {
    if (error) {
      assert.throws(() => route());
    } else {
      assert.deepStrictEqual(route().decode(input), expected_match);
    }
  });
}
