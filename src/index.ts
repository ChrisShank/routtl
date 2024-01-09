export interface Decoder<Data> {
  decode: (blob: string) => Data;
  encode: (data: Data) => string;
}

export const string: Decoder<string> = {
  decode: (str) => str,
  encode: (data) => data,
};

export const boolean: Decoder<boolean> = {
  decode: (str) => str === 'true',
  encode: (data) => data.toString(),
};

export const num: Decoder<number> = {
  decode: (str) => +str,
  encode: (data) => data.toString(),
};

export const date: Decoder<Date> = {
  decode: (str) => new Date(str),
  encode: (data) => data.toString(),
};

export function array<Data>(decoder: Decoder<Data>): Decoder<Data[]> {
  return {
    decode: (str) => {
      const arr = JSON.parse(str);
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

type Prettify<T> = T extends EmptyObject
  ? T
  : {
      [K in keyof T]: T[K];
    } & {};

const escapeRegex = /[-\/\\^$*+?.()|[\]{}]/g;

class RouteParser<
  Values extends ReadonlyArray<RouteValue> = ReadonlyArray<RouteValue>,
  Data = Prettify<ExtractRouteData<FlattenRouteParameters<Values>>>
> {
  readonly tokens: ReadonlyArray<string | NamedRouteParameter>;
  readonly routeParameters: NamedRouteParameter[];
  readonly regex: RegExp;

  constructor(strings: TemplateStringsArray, values: Values) {
    // We should probably interleave these in the TTL instead.
    const tokens: Array<string | NamedRouteParameter> = [];

    strings.forEach((str, i) => {
      const value = values[i];
      tokens.push(str, ...(value instanceof RouteParser ? value.tokens : [value]));
    });

    // Do we need to filter empty strings?
    this.tokens = tokens.filter((token) => !!token);

    this.routeParameters = this.tokens.filter(
      (token) => typeof token !== 'string'
    ) as NamedRouteParameter[];

    this.regex = new RegExp(
      '^' +
        this.tokens
          .map((token) =>
            typeof token === 'string' ? token.replace(escapeRegex, '\\$&') : '([^/]+)'
          )
          .join('') +
        '$'
    );
  }

  decode(url: string): Data | null {
    const results = this.regex.exec(url);

    if (results == null) return null;

    const data = {} as Data;

    for (let i = 0; i < this.routeParameters.length; i += 1) {
      const [name, decoder] = this.routeParameters[i];

      // Offset by one since the first value of results is the matched string
      const strParam = results[i + 1];

      if (strParam === undefined) return null;

      // Catch decode errors?
      const param = decoder.decode(decodeURIComponent(strParam));
      data[name as keyof Data] = param;
    }

    return data;
  }
  encode(data: Data): string {
    return this.tokens
      .map((token) =>
        typeof token === 'string'
          ? token
          : encodeURIComponent(token[1].encode(data[token[0] as keyof Data]))
      )
      .join('');
  }
}

export const route = <const Values extends ReadonlyArray<RouteValue>>(
  strings: TemplateStringsArray,
  ...values: Values
) => new RouteParser(strings, values);
