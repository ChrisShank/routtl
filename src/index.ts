export type NamedRouteParameter<Name extends string = string, Data = any> = [
  name: Name,
  decoder: Decoder<Data>
];

export interface Decoder<Data> {
  <Name extends string>(name: Name): NamedRouteParameter<Name, Data>;
  decode: (blob: string) => Data;
  encode: (data: Data) => string;
}

export const string: Decoder<string> = <Name extends string>(name: Name) => [name, string];
string.decode = (blob) => blob;
string.encode = (data) => data;

export const boolean: Decoder<boolean> = <Name extends string>(name: Name) => [name, boolean];
boolean.decode = (blob) => blob === 'true';
boolean.encode = (data) => data.toString();

export const num: Decoder<number> = <Name extends string>(name: Name) => [name, num];
num.decode = (blob) => +blob;
num.encode = (data) => data.toString();

export const date: Decoder<Date> = <Name extends string>(name: Name) => [name, date];
date.decode = (blob) => new Date(blob);
date.encode = (data) => data.toISOString().split('T')[0];

export const datetime: Decoder<Date> = <Name extends string>(name: Name) => [name, datetime];
datetime.decode = (blob) => new Date(blob);
datetime.encode = (data) => data.toISOString();

export function array<Data>(decoder: Decoder<Data>): Decoder<Data[]> {
  const arrayDecoder: Decoder<Data[]> = <Name extends string>(name: Name) => [name, arrayDecoder];

  arrayDecoder.decode = (blob) => {
    const arr = JSON.parse(blob);
    if (!(arr instanceof Array)) {
      throw new Error('[routtl]: `array` decoder failed to parse array.');
    }
    return arr.map((value) => decoder.decode(value));
  };

  arrayDecoder.encode = (data) => JSON.stringify(data.map((value) => decoder.encode(value)));

  return arrayDecoder;
}

export type RouteParameter<Data = any> = Decoder<Data> & {
  <Name extends string>(name: Name): NamedRouteParameter<Name, Data>;
};

export type InferRouteParameterName<P> = P extends NamedRouteParameter<infer Name> ? Name : never;

export type InferRouteParameterData<P> = P extends NamedRouteParameter<string, infer Data>
  ? Data
  : never;

export type InferRouteParserParameters<Parser> = Parser extends RouteParser<infer Parameters>
  ? Parameters
  : never;

export type InferRouteData<Parser> = Parser extends RouteParser<
  Array<NamedRouteParameter>,
  infer Data
>
  ? Data
  : never;

export type RouteValue = NamedRouteParameter | RouteParser;

export type RouteValues = Array<RouteValue> /* | [...RouteValue[], Decoder<URLSearchParams>] */;

export type FlattenRouteParameters<
  Values extends Array<unknown>,
  Result extends Array<unknown> = []
> = Values extends []
  ? Result
  : Values extends [infer Head, ...infer Tail]
  ? Head extends RouteParser
    ? FlattenRouteParameters<Tail, [...Result, ...InferRouteParserParameters<Head>]>
    : FlattenRouteParameters<Tail, [...Result, Head]>
  : never;

export type EmptyObject = Record<never, never>;

export type ExtractRouteData<Parameters extends Array<NamedRouteParameter>> = Parameters extends []
  ? EmptyObject
  : {
      [Value in Parameters[keyof Parameters] as InferRouteParameterName<Value>]: InferRouteParameterData<Value>;
    };

export interface RouteData<Params> {
  params: Params;
  search?: {};
  hash?: string;
}

// Don't prettify if `T` is an empty object since it will return `{}`, which is not correct.
type Prettify<T> = T extends EmptyObject
  ? T
  : {
      [K in keyof T]: T[K];
    } & {};

const escapeRegex = /[-\/\\^$*+?.()|[\]{}]/g;

export class RouteParser<
  Values extends RouteValues = [],
  Data = Prettify<ExtractRouteData<FlattenRouteParameters<Values>>>
> {
  readonly #tokens: Array<string | NamedRouteParameter>;
  readonly #routeParameters: NamedRouteParameter[] = [];
  readonly #regex: RegExp;

  get tokens() {
    return this.#tokens;
  }

  constructor(strings: TemplateStringsArray, values: Values) {
    // We should probably interleave these in the TTL instead.
    this.#tokens = strings
      .flatMap((str, i) => {
        // Inject a slash into the first string since URL will do that for us
        if (i === 0 && !str.startsWith('/')) {
          str = '/' + str;
        }

        const value = values[i];
        return [str, ...(value instanceof RouteParser ? value.#tokens : [value])];
      })
      .filter((token) => !!token);

    let regexStrings: string[] = [];
    let duplicates: string[] = [];
    const uniqueNames = new Set<string>();

    for (const token of this.#tokens) {
      if (typeof token === 'string') {
        regexStrings.push(token.replace(escapeRegex, '\\$&'));
      } else {
        regexStrings.push('([^/]+)');
        this.#routeParameters.push(token);

        const name = token[0];
        uniqueNames.has(name) ? duplicates.push(name) : uniqueNames.add(name);
      }
    }

    if (duplicates.length > 0) {
      throw new Error(
        `Duplicate params detected: ${duplicates.map((name) => `'${name}'`).join(', ')}`
      );
    }

    this.#regex = new RegExp('^' + regexStrings.join('') + '$');
  }

  decode(path: string): RouteData<Data> | null {
    // In the future we can use `URL.parse()`.
    if (!URL.canParse(path, 'https://a.com')) return null;

    const { pathname, searchParams, hash } = new URL(path, 'https://a.com');
    const results = this.#regex.exec(pathname);

    if (results === null) return null;

    const params = {} as Data;

    for (let i = 0; i < this.#routeParameters.length; i += 1) {
      const [name, decoder] = this.#routeParameters[i];

      // Offset by one since the first value of results is the matched string
      const strParam = results[i + 1];

      if (strParam === undefined) return null;

      // Catch decode errors?
      const param = decoder.decode(decodeURIComponent(strParam));
      params[name as keyof Data] = param;
    }

    return {
      params,
      search: Object.fromEntries(searchParams),
      hash: hash.slice(1),
    };
  }

  encode(data: RouteData<Data>): string {
    const url = new URL('https://a.com');

    url.pathname = this.#tokens
      .map((token) =>
        typeof token === 'string'
          ? token
          : encodeURIComponent(token[1].encode(data.params[token[0] as keyof Data]))
      )
      .join('');

    if (data.search) {
      for (const [key, value] of Object.entries(data.search)) {
        url.searchParams.append(key, String(value));
      }
    }

    if (data.hash) {
      url.hash = data.hash;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  }
}

export const route = <const Values extends RouteValues>(
  strings: TemplateStringsArray,
  ...values: Values
) => new RouteParser(strings, values);
