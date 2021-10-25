import { A } from 'ts-toolbelt';

export type RouteParameter<Name extends string = string, Data = any> = {
  name: Name;
  decode: (blob: string) => Data;
  encode: (data: Data) => string;
};

type InferRouteParameterName<P> = P extends RouteParameter<infer Name> ? Name : never;

type InferRouteParameterType<P> = P extends RouteParameter<string, infer Type> ? Type : never;

export const string = <Name extends string>(name: Name): RouteParameter<Name, string> => ({
  name,
  decode: (blob) => blob,
  encode: (data) => data,
});

export const boolean = <Name extends string>(name: Name): RouteParameter<Name, boolean> => ({
  name,
  decode: (blob) => blob === 'true',
  encode: (data) => String(data),
});

export const int = <Name extends string>(name: Name): RouteParameter<Name, number> => ({
  name,
  decode: (blob) => parseInt(blob),
  encode: (data) => String(data),
});

export const float = <Name extends string>(name: Name): RouteParameter<Name, number> => ({
  name,
  decode: (blob) => parseFloat(blob),
  encode: (data) => String(data),
});

// The `Parameters` generic is not used, but necessary for proper inference in other types
export type RouteParser<Parameters extends ReadonlyArray<RouteParameter> = [], Data = any> = {
  readonly rank: number;
  readonly tokens: ReadonlyArray<string | RouteParameter>;
  decode: (url: string) => Data | null;
  encode: (data: Data) => string;
};

type InferRouteParameters<P> = P extends RouteParser<infer Parameters> ? Parameters : never;

type RouteValue = RouteParameter | RouteParser;

type FlattenRouteParameters<
  Values extends ReadonlyArray<unknown>,
  Result extends ReadonlyArray<unknown> = []
> = Values extends readonly []
  ? Result
  : Values extends readonly [infer Head, ...infer Tail]
  ? Head extends RouteParser
    ? FlattenRouteParameters<Tail, readonly [...Result, ...InferRouteParameters<Head>]>
    : FlattenRouteParameters<Tail, readonly [...Result, Head]>
  : never;

type ExtractRouteData<Parameters extends ReadonlyArray<RouteParameter>> = {
  [Value in Parameters[keyof Parameters] as InferRouteParameterName<Value>]: InferRouteParameterType<Value>;
};

const isRouteParser = (value: unknown): value is RouteParser =>
  typeof value === 'object' && value != null && (value as any).tokens instanceof Array;

const interleave = <A, B>(a: ReadonlyArray<A>, b: ReadonlyArray<B>): (A | B)[] =>
  a.reduce((acc, element, index) => {
    acc.push(element);
    if (index <= b.length - 1) acc.push(b[index]);
    return acc;
  }, [] as (A | B)[]);

const escapeRegex = (str: string) => str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

const regexFromTokens = (tokens: (string | RouteParameter)[]) =>
  new RegExp(
    '^' +
      tokens.map((token) => (typeof token === 'string' ? escapeRegex(token) : '([^/]+)')).join('') +
      '$'
  );

let SEGMENT_POINTS = 4;
let STATIC_POINTS = 3;
let DYNAMIC_POINTS = 2;
let SPLAT_PENALTY = 1;
let ROOT_POINTS = 1;

const paramRe = /^:\w+$/;
let isRootSegment = (segment: string) => segment === '';
let isDynamic = (segment: string) => paramRe.test(segment);
let isSplat = (segment: string) => segment && segment[0] === '*';

function rankRoute(tokens: (string | RouteParameter)[]): number {
  let segments = tokens
    .map((token) => (typeof token === 'string' ? token : `:${token.name}`))
    .join('')
    .replace(/(^\/+|\/+$)/g, '')
    .split('/');

  return segments.reduce((score, segment) => {
    score += SEGMENT_POINTS;
    if (isRootSegment(segment)) score += ROOT_POINTS;
    else if (isDynamic(segment)) score += DYNAMIC_POINTS;
    else if (isSplat(segment)) score -= SEGMENT_POINTS + SPLAT_PENALTY;
    else score += STATIC_POINTS;
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
      isRouteParser(value) ? value.tokens.filter((token) => typeof token !== 'string') : value
    )
    .filter((token) => !!token);
  const parameters = tokens.filter((token) => typeof token !== 'string') as RouteParameter[];
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
          const param = token.decode(decodeURIComponent(strParam));
          data[token.name as keyof Data] = param;
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
          return encodeURIComponent(token.encode(data[token.name as keyof Data]));
        })
        .join('');
    },
  };
}
