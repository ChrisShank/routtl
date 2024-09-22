export type NamedRouteParameter<Name extends string = string, Data = any> = [
  name: Name,
  decoder: Decoder<Data>
];

export interface Decoder<Data = any> {
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

export const int: Decoder<number> = <Name extends string>(name: Name) => [name, int];
int.decode = (blob) => parseInt(blob, 10);
int.encode = (data) => data.toString();

export const float: Decoder<number> = <Name extends string>(name: Name) => [name, float];
float.decode = (blob) => parseFloat(blob);
float.encode = (data) => data.toString();

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

export interface SearchDecoder<Data = any> extends Decoder<Data> {
  type: 'search';
}

export type ExtractDecoderData<D> = D extends Decoder<infer Data> ? Data : never;

export type ExtractSearchData<Decoders extends Record<string, Decoder>> = {
  [Key in keyof Decoders]: ExtractDecoderData<Decoders[Key]>;
} & {};

export function search<Decoders extends Record<string, Decoder>>(decoders: Decoders) {
  const searchDecoder: SearchDecoder<Prettify<ExtractSearchData<Decoders>>> = <Name extends string>(
    name: Name
  ) => [name, searchDecoder];

  searchDecoder.type = 'search';

  searchDecoder.decode = (blob) => {
    const searchParams = new URLSearchParams(blob);
    const data = {} as any;

    for (const name of Object.keys(decoders)) {
      const decoder = decoders[name];
      const searchParam = searchParams.get(name);
      if (searchParam) {
        data[name as keyof any] = decoder.decode(searchParam);
      }
    }

    return data;
  };

  searchDecoder.encode = (data) => {
    const decodedData: Record<string, string> = {};

    for (const name of Object.keys(decoders)) {
      const decoder = decoders[name];
      decodedData[name] = decoder.encode(data[name as any]);
    }

    return new URLSearchParams(decodedData).toString();
  };

  return searchDecoder;
}

function isSearchDecoder(value: unknown): value is SearchDecoder {
  return typeof value === 'function' && (value as any).type === 'search';
}

export type InferRouteParameterName<P> = P extends NamedRouteParameter<infer Name> ? Name : never;

export type InferRouteParameterData<P> = P extends NamedRouteParameter<string, infer Data>
  ? Data
  : never;

export type EmptyObject = Record<never, never>;

export type ExtractParamData<Parameters extends NamedRouteParameter[]> = Parameters extends []
  ? EmptyObject
  : {
      [Value in Parameters[keyof Parameters] as InferRouteParameterName<Value>]: InferRouteParameterData<Value>;
    };

export type RouteData<Params, Search> = Prettify<{
  params: Params;
  search: Search;
  hash?: string;
}>;

type ExtractRouteParams<Params extends unknown[], Result extends unknown[] = []> = Params extends []
  ? Result
  : Params extends [infer Head, ...infer Tail]
  ? Head extends NamedRouteParameter
    ? ExtractRouteParams<Tail, [...Result, Head]>
    : ExtractRouteParams<Tail, Result>
  : never;

type ExtractSearchDecoder<Params extends unknown[]> = Params extends [
  ...any[],
  infer Search,
  string
]
  ? Search extends SearchDecoder
    ? Search
    : never
  : never;

// Don't prettify if `T` is an empty object since it will return `{}`, which is not correct.
type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type RouteToken = string | NamedRouteParameter;

const escapeRegex = /[-\/\\^$*+?.()|[\]{}]/g;

export class RouteParser<
  Tokens extends RouteToken[] | [...RouteToken[], SearchDecoder, string],
  Params = Prettify<ExtractParamData<ExtractRouteParams<Tokens>>>,
  Search = Prettify<ExtractDecoderData<ExtractSearchDecoder<Tokens>>>
> {
  readonly #tokens: RouteToken[];
  readonly #routeParameters: NamedRouteParameter[] = [];
  readonly #regex: RegExp;
  readonly #searchDecoder: SearchDecoder | null = null;

  get tokens() {
    return this.#tokens;
  }

  constructor(tokens: Tokens) {
    const possibleSearch = tokens.at(-2);
    if (isSearchDecoder(possibleSearch)) {
      this.#searchDecoder = possibleSearch;
      tokens.pop(); // should be an empty string
      tokens.pop(); // remove decoder;
      // remove question mark if it exists
      const lastString = tokens.at(-1);
      if (typeof lastString === 'string' && lastString.endsWith('?')) {
        tokens[tokens.length - 1] = lastString.replace('?', '');
      }
    }
    // We should probably interleave these in the TTL instead.
    this.#tokens = tokens as RouteToken[];

    const firstToken = this.#tokens[0];
    if (typeof firstToken === 'string' && !firstToken.startsWith('/')) {
      this.tokens[0] = '/' + firstToken;
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

  decode(path: string): RouteData<Params, Search> | null {
    // In the future we can use `URL.parse()`.
    if (!URL.canParse(path, 'https://a.com')) return null;

    const { pathname, search, hash } = new URL(path, 'https://a.com');
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
      search: this.#searchDecoder?.decode(search) || {},
      hash: hash.slice(1),
    } as RouteData<Params, Search>;
  }

  encode({ params, search, hash }: RouteData<Params, Search>): string {
    const url = new URL('https://a.com');

    url.pathname = this.#tokens
      .map((token) =>
        typeof token === 'string'
          ? token
          : encodeURIComponent(token[1].encode(params![token[0] as keyof Params]))
      )
      .join('');

    url.search = this.#searchDecoder?.encode(search || {}) || '';

    if (hash) {
      url.hash = hash;
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
  ? Head extends RouteParser<RouteToken[], any>
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

export const route = <
  Values extends (NamedRouteParameter | RouteParser<RouteToken[], any> | SearchDecoder)[]
>(
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
