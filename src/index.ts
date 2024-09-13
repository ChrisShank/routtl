export interface Decoder<Data> {
  readonly matcher: string;
  /** Parse a string in data. */
  decode: (blob: string) => Data;
  /** Convert data into a string */
  encode: (data: Data) => string;
}

export const string: Decoder<string> = {
  matcher: '([^/]+)',
  decode: (blob) => blob,
  encode: (data) => data,
};

export const boolean: Decoder<boolean> = {
  matcher: '([^/]+)',
  decode: (blob) => blob === 'true',
  encode: (data) => data.toString(),
};

export const int: Decoder<number> = {
  matcher: '([^/]+)',
  decode: (blob) => +blob,
  encode: (data) => data.toString(),
};

export const date: Decoder<Date> = {
  matcher: '([^/]+)',
  decode: (blob) => new Date(blob),
  encode: (data) => data.toString(),
};

export function array<Data>(decoder: Decoder<Data>): Decoder<Data[]> {
  return {
    matcher: '([^/]+)',
    decode: (blob) => {
      const arr = JSON.parse(blob);
      if (!(arr instanceof Array)) {
        throw new Error('[routtl]: `array` decoder failed to parse array.');
      }
      return arr.map((value) => decoder.decode(value));
    },
    encode: (data) => JSON.stringify(data.map((value) => decoder.encode(value))),
  };
}

export type NamedRouteParameter<Name extends string = string, Data = any> = readonly [
  name: Name,
  decoder: Decoder<Data>
];

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
  ReadonlyArray<NamedRouteParameter>,
  infer Data
>
  ? Data
  : never;

export type RouteValue = NamedRouteParameter | RouteParser;

export type FlattenRouteParameters<
  Values extends ReadonlyArray<unknown>,
  Result extends ReadonlyArray<unknown> = []
> = Values extends readonly []
  ? Result
  : Values extends readonly [infer Head, ...infer Tail]
  ? Head extends RouteParser
    ? FlattenRouteParameters<Tail, readonly [...Result, ...InferRouteParserParameters<Head>]>
    : FlattenRouteParameters<Tail, readonly [...Result, Head]>
  : never;

type EmptyObject = Record<never, never>;

export type ExtractRouteData<Parameters extends ReadonlyArray<NamedRouteParameter>> =
  Parameters extends []
    ? EmptyObject
    : {
        [Value in Parameters[keyof Parameters] as InferRouteParameterName<Value>]: InferRouteParameterData<Value>;
      };

export interface EncodedRouteData<Params> {
  params: Params;
  search: {};
  hash: string;
}

export interface DecodedRouteData<Params> extends EncodedRouteData<Params> {
  matched: boolean;
}

const emptyRoute: DecodedRouteData<EmptyObject> = Object.freeze({
  matched: false,
  params: Object.freeze({}),
  search: Object.freeze({}),
  hash: '',
});

// Don't prettify if `T` is an empty object since it will return `{}`, which is not correct.
type Prettify<T> = T extends EmptyObject
  ? T
  : {
      [K in keyof T]: T[K];
    } & {};

const escapeRegex = /[-\/\\^$*+?.()|[\]{}]/g;

export class RouteParser<
  Values extends ReadonlyArray<RouteValue> = [],
  Data = Prettify<ExtractRouteData<FlattenRouteParameters<Values>>>
> {
  readonly #tokens: ReadonlyArray<string | NamedRouteParameter>;
  readonly #routeParameters: NamedRouteParameter[];
  readonly #regex: RegExp;

  constructor(strings: TemplateStringsArray, values: Values) {
    // We should probably interleave these in the TTL instead.
    this.#tokens = strings
      .flatMap((str, i) => {
        const value = values[i];
        return [str, ...(value instanceof RouteParser ? value.#tokens : [value])];
      })
      .filter((token) => !!token);

    this.#routeParameters = this.#tokens.filter(
      (token) => typeof token !== 'string'
    ) as NamedRouteParameter[];

    const { duplicates } = this.#routeParameters
      .map((param) => param[0])
      .reduce(
        (acc, name) => {
          if (acc.names.has(name)) {
            acc.duplicates.push(name);
          } else {
            acc.names.add(name);
          }
          return acc;
        },
        { duplicates: [] as string[], names: new Set<string>() }
      );

    if (duplicates.length > 0) {
      throw new Error(
        `Duplicate params detected: ${duplicates.map((name) => `'${name}'`).join(', ')}`
      );
    }

    this.#regex = new RegExp(
      '^' +
        this.#tokens
          .map((token) =>
            typeof token === 'string' ? token.replace(escapeRegex, '\\$&') : token[1].matcher
          )
          .join('') +
        '$'
    );
  }

  decode(path: string): DecodedRouteData<Data> | DecodedRouteData<EmptyObject> {
    const { pathname, searchParams, hash } = new URL(path, 'https://example.com');
    const results = this.#regex.exec(pathname);

    if (results == null) return emptyRoute;

    const params = {} as Data;

    for (let i = 0; i < this.#routeParameters.length; i += 1) {
      const [name, decoder] = this.#routeParameters[i];

      // Offset by one since the first value of results is the matched string
      const strParam = results[i + 1];

      if (strParam === undefined) return emptyRoute;

      // Catch decode errors?
      const param = decoder.decode(decodeURIComponent(strParam));
      params[name as keyof Data] = param;
    }

    return {
      matched: true,
      params,
      search: Object.fromEntries(searchParams),
      hash,
    };
  }

  encode(data: EncodedRouteData<Data>): string {
    const search = new URLSearchParams(data.search);
    const path = this.#tokens
      .map((token) =>
        typeof token === 'string'
          ? token
          : encodeURIComponent(token[1].encode(data.params[token[0] as keyof Data]))
      )
      .join('');

    return `${path}${search.size === 0 ? '' : '?'}${search}${data.hash === '' ? '' : '#'}${
      data.hash
    }`;
  }

  toString() {
    return this.#tokens
      .map((token) => (typeof token === 'string' ? token : `:${token[0]}`))
      .join('');
  }
}

export const route = <const Values extends ReadonlyArray<RouteValue>>(
  strings: TemplateStringsArray,
  ...values: Values
) => new RouteParser(strings, values);
