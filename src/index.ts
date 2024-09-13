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

export type InferRouteParameterName<P> = P extends NamedRouteParameter<infer Name> ? Name : never;

export type InferRouteParameterData<P> = P extends NamedRouteParameter<string, infer Data>
  ? Data
  : never;

export type EmptyObject = Record<never, never>;

export type ExtractRouteData<Parameters extends NamedRouteParameter[]> = Parameters extends []
  ? EmptyObject
  : {
      [Value in Parameters[keyof Parameters] as InferRouteParameterName<Value>]: InferRouteParameterData<Value>;
    };

export interface RouteData<Params> {
  params: Params;
  search?: {};
  hash?: string;
}

type ExtractRouteParams<Params extends unknown[], Result extends unknown[] = []> = Params extends []
  ? Result
  : Params extends [infer Head, ...infer Tail]
  ? Head extends NamedRouteParameter
    ? ExtractRouteParams<Tail, [...Result, Head]>
    : ExtractRouteParams<Tail, Result>
  : never;

// Don't prettify if `T` is an empty object since it will return `{}`, which is not correct.
type Prettify<T> = T extends EmptyObject
  ? T
  : {
      [K in keyof T]: T[K];
    } & {};

const escapeRegex = /[-\/\\^$*+?.()|[\]{}]/g;

export class RouteParser<
  Tokens extends Array<string | NamedRouteParameter> = [],
  Params = Prettify<ExtractRouteData<ExtractRouteParams<Tokens>>>
> {
  readonly #tokens: Array<string | NamedRouteParameter>;
  readonly #routeParameters: NamedRouteParameter[] = [];
  readonly #regex: RegExp;

  get tokens() {
    return this.#tokens;
  }

  constructor(tokens: Tokens) {
    // We should probably interleave these in the TTL instead.
    this.#tokens = tokens;

    const firstToken = tokens[0];
    if (typeof firstToken === 'string' && !firstToken.startsWith('/')) {
      tokens[0] = '/' + firstToken;
    }

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

  decode(path: string): RouteData<Params> | null {
    // In the future we can use `URL.parse()`.
    if (!URL.canParse(path, 'https://a.com')) return null;

    const { pathname, searchParams, hash } = new URL(path, 'https://a.com');
    const results = this.#regex.exec(pathname);

    if (results === null) return null;

    const params = {} as Params;

    for (let i = 0; i < this.#routeParameters.length; i += 1) {
      const [name, decoder] = this.#routeParameters[i];

      // Offset by one since the first value of results is the matched string
      const strParam = results[i + 1];

      if (strParam === undefined) return null;

      // Catch decode errors?
      const param = decoder.decode(decodeURIComponent(strParam));
      params[name as keyof Params] = param;
    }

    return {
      params,
      search: Object.fromEntries(searchParams),
      hash: hash.slice(1),
    };
  }

  encode(data: RouteData<Params>): string {
    const url = new URL('https://a.com');

    url.pathname = this.#tokens
      .map((token) =>
        typeof token === 'string'
          ? token
          : encodeURIComponent(token[1].encode(data.params[token[0] as keyof Params]))
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

type InferRouteParserParameters<Parser> = Parser extends RouteParser<infer Tokens>
  ? ExtractRouteParams<Tokens>
  : never;

type FlattenRouteParameters<
  Values extends unknown[],
  Result extends unknown[] = []
> = Values extends []
  ? Result
  : Values extends [infer Head, ...infer Tail]
  ? Head extends RouteParser
    ? FlattenRouteParameters<Tail, [...Result, ...InferRouteParserParameters<Head>]>
    : FlattenRouteParameters<Tail, [...Result, Head]>
  : never;

type InterleaveRouteParams<
  Params extends unknown[],
  Result extends unknown[] = []
> = Params extends []
  ? [...Result, string]
  : Params extends [infer Head, ...infer Tail]
  ? InterleaveRouteParams<Tail, [...Result, string, Head]>
  : never;

export const route = <const Values extends (NamedRouteParameter | RouteParser)[]>(
  strings: TemplateStringsArray,
  ...values: Values
) => {
  const tokens = strings.flatMap((str, i) => {
    if (i >= values.length) return str;

    const value = values[i];
    return [str, ...(value instanceof RouteParser ? value.tokens : [value])];
  }) as InterleaveRouteParams<FlattenRouteParameters<Values>>;

  return new RouteParser(tokens);
};
