import { A } from 'ts-toolbelt';

export type Decoder<Data> = readonly [
  decode: (blob: string) => Data,
  encode: (data: Data) => string
];

export type NamedRouteParameter<Name extends string = string, Data = any> = readonly [
  ...decoder: Decoder<Data>,
  name: Name
];

export type RouteParameter<Data = any> = Decoder<Data> & {
  <Name extends string>(name: Name): NamedRouteParameter<Name, Data>;
};

export type InferRouteParameterName<P> = P extends NamedRouteParameter<infer Name> ? Name : never;

export type InferRouteParameterData<P> = P extends NamedRouteParameter<string, infer Data>
  ? Data
  : never;

export const param = <Data>(
  decode: Decoder<Data>[0],
  encode: Decoder<Data>[1] = String
): RouteParameter<Data> =>
  Object.assign(<Name extends string>(name: Name) => [decode, encode, name] as const, [
    decode,
    encode,
  ] as const);

export const string = param((b) => b);

export const boolean = param((b) => b === 'true');

export const int = param(parseInt);

export const float = param(parseFloat);

// The `Parameters` generic is not used, but necessary for proper inference in other types
export type RouteParser<
  Parameters extends ReadonlyArray<NamedRouteParameter> = ReadonlyArray<NamedRouteParameter>,
  Data = {}
> = {
  readonly rank: number;
  readonly tokens: ReadonlyArray<string | NamedRouteParameter>;
  decode: (url: string) => Data | null;
  encode: (data: Data) => string;
};

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

export type ExtractRouteData<Parameters extends ReadonlyArray<NamedRouteParameter>> = {
  [Value in Parameters[keyof Parameters] as InferRouteParameterName<Value>]: InferRouteParameterData<Value>;
};

const isRouteParser = (value: unknown): value is RouteParser =>
  typeof value === 'object' && value != null && (value as any).tokens instanceof Array;

const interleave = <A, B>(a: ReadonlyArray<A>, b: ReadonlyArray<B>): (A | B)[] =>
  a.reduce((acc, element, index) => {
    acc.push(element);
    acc.push(b[index]);
    return acc;
  }, [] as (A | B)[]);

const escapeRegex = /[-\/\\^$*+?.()|[\]{}]/g;

const regexFromTokens = (tokens: (string | NamedRouteParameter)[]) =>
  new RegExp(
    '^' +
      tokens
        .map((token) =>
          typeof token === 'string' ? token.replace(escapeRegex, '\\$&') : '([^/]+)'
        )
        .join('') +
      '$'
  );

const paramRe = /^:\w+$/;

function rankRoute(tokens: (string | NamedRouteParameter)[]): number {
  let segments = tokens
    .map((token) => (typeof token === 'string' ? token : `:${token[2]}`))
    .join('')
    .replace(/(^\/+|\/+$)/g, '')
    .split('/');

  // SEGMENT = 4, STATIC = 3, DYNAMIC = 2, SPLAT_PENALTY = 1, ROOT = 1
  return segments.reduce((score, segment) => {
    score += 4;
    // root segment
    if (segment === '') score += 1;
    // dynamic segment
    else if (paramRe.test(segment)) score += 2;
    // splat
    else if (segment[0] === '*') score -= 4 + 1;
    else score += 3;
    return score;
  }, 0);
}

export function route<
  Values extends ReadonlyArray<RouteValue>,
  Data = A.Compute<ExtractRouteData<FlattenRouteParameters<Values>>>
>(
  strings: TemplateStringsArray,
  ...values: Values
): RouteParser<FlattenRouteParameters<Values>, Data> {
  const tokens = interleave(strings, values)
    .flatMap((value) =>
      isRouteParser(value)
        ? (value.tokens.filter(
            (token) => typeof token !== 'string'
          ) as ReadonlyArray<NamedRouteParameter>)
        : value
    )
    .filter((token) => !!token);
  const parameters = tokens.filter((token) => typeof token !== 'string') as NamedRouteParameter[];
  const regex = regexFromTokens(tokens);

  return {
    rank: rankRoute(tokens),
    tokens,
    decode(url) {
      const results = regex.exec(url);

      if (!results) return null;

      const data = {} as Data;

      for (let i = 0; i < parameters.length; i += 1) {
        const token = parameters[i];

        // Offset by one since the first value of results is the matched string
        const strParam = results[i + 1];

        if (!strParam) return null;

        try {
          const param = token[0](decodeURIComponent(strParam));
          data[token[2] as keyof Data] = param;
        } catch {
          // If any decoders throw an error then the URL does not match
          return null;
        }
      }

      return data;
    },
    encode(data) {
      return tokens
        .map((token) => {
          if (typeof token === 'string') return token;
          return encodeURIComponent(token[1](data[token[2] as keyof Data]));
        })
        .join('');
    },
  };
}
