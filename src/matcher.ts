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
  encode: (data) => data.toString(),
});

export const boolean = <Name extends string>(name: Name): RouteParameter<Name, boolean> => ({
  name,
  decode: (blob) => blob === 'true',
  encode: (data) => data.toString(),
});

export const int = <Name extends string>(name: Name): RouteParameter<Name, number> => ({
  name,
  decode: (blob) => parseInt(blob),
  encode: (data) => data.toString(),
});

export const float = <Name extends string>(name: Name): RouteParameter<Name, number> => ({
  name,
  decode: (blob) => parseFloat(blob),
  encode: (data) => data.toString(),
});

// The `Parameters` generic is not used, but necessary for proper inference in other types
export type RouteParser<Parameters extends ReadonlyArray<RouteParameter> = [], Data = any> = {
  readonly tokens: (string | RouteParameter)[];
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

const isRouteParser = (value: RouteValue): value is RouteParser =>
  (value as any).tokens instanceof Array;

const interleave = <A, B>(a: ReadonlyArray<A>, b: ReadonlyArray<B>): (A | B)[] =>
  a.reduce((acc, element, index) => {
    acc.push(element);
    acc.push(b[index]);
    return acc;
  }, [] as (A | B)[]);

const escapeRegex = (str: string) => str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

const regexFromTokens = (tokens: (string | RouteParameter)[]) =>
  new RegExp(
    tokens.map((token) => (typeof token === 'string' ? escapeRegex(token) : '([^/]+)')).join('')
  );

export function route<
  Values extends ReadonlyArray<RouteValue>,
  Data = A.Compute<ExtractRouteData<FlattenRouteParameters<Values>>>
>(
  strings: TemplateStringsArray,
  ...values: Values
): RouteParser<FlattenRouteParameters<Values>, Data> {
  const parameters = values.flatMap((value) =>
    isRouteParser(value) ? value.tokens.filter((token) => typeof token !== 'string') : value
  ) as RouteParameter[];
  const tokens = interleave(strings, parameters).filter(
    (x) => x !== '' && x !== null && x !== undefined
  );

  const regex = regexFromTokens(tokens);

  return {
    get tokens() {
      return tokens;
    },
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
