import { A } from 'ts-toolbelt';

export type RouteParameter<Name extends string = string, Type = any> = {
  name: Name;
  decoder: (blob: string) => Type;
  encoder: (value: Type) => string;
};

// TODO
type RouteQuery = {};

type ExtractRouteParameterName<P> = P extends RouteParameter<infer Name> ? Name : never;

type ExtractRouteParameterType<P> = P extends RouteParameter<string, infer Type> ? Type : never;

type ExtractRouteData<Parameters extends RouteParameter[]> = {
  [Value in Parameters[keyof Parameters] as ExtractRouteParameterName<Value>]: ExtractRouteParameterType<Value>;
};

export type RouteMatcher<
  Parameters extends RouteParameter[] = RouteParameter[],
  Data = A.Compute<ExtractRouteData<Parameters>>
> = {
  match: (url: string) => Data | null;
  serialize: (data: Data) => string;
};

export const string = <Name extends string>(name: Name): RouteParameter<Name, string> => ({
  name,
  decoder: (blob) => blob,
  encoder: (data) => data.toString(),
});

export const boolean = <Name extends string>(name: Name): RouteParameter<Name, boolean> => ({
  name,
  decoder: (blob) => blob === 'true',
  encoder: (data) => data.toString(),
});

export const int = <Name extends string>(name: Name): RouteParameter<Name, number> => ({
  name,
  decoder: (blob) => parseInt(blob),
  encoder: (data) => data.toString(),
});

// TODO: figure out how to parse floats in the URL properly
export const float = <Name extends string>(name: Name): RouteParameter<Name, number> => ({
  name,
  decoder: (blob) => parseFloat(blob),
  encoder: (data) => data.toString(),
});

const escapeRegex = (str: string) => str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

const interleave = <A, B>(a: ReadonlyArray<A>, b: ReadonlyArray<B>): (A | B)[] =>
  a.reduce((acc, element, index) => {
    acc.push(element);
    acc.push(b[index]);
    return acc;
  }, [] as (A | B)[]);

const regexFromTokens = (tokens: (string | RouteParameter)[]) =>
  new RegExp(tokens.map((x) => (typeof x === 'string' ? escapeRegex(x) : '([^/]+)')).join(''));

export function route<Parameters extends RouteParameter[]>(
  strings: TemplateStringsArray,
  ...values: Parameters
): RouteMatcher<Parameters> {
  const tokens = interleave(strings, values).filter(
    (x) => x !== '' && x !== null && x !== undefined
  );

  const regex = regexFromTokens(tokens);

  return {
    match(url) {
      const results = regex.exec(url);

      if (!results) return null;

      // this type can not be derived in the
      const data = {} as A.Compute<ExtractRouteData<Parameters>>;

      for (let i = 0; i < values.length; i += 1) {
        const token = values[i];

        // Offset by one since the first value of results is the matched string
        const strParam = results[i + 1];

        if (!strParam) return null;

        try {
          const param = token.decoder(decodeURIComponent(strParam));
          data[token.name as keyof typeof data] = param;
        } catch {
          // If any decoders throw an error then the URL does not match
          return null;
        }
      }

      return data;
    },
    serialize(data) {
      return tokens
        .map((token) => {
          if (typeof token === 'string') return token;
          return encodeURIComponent(
            token.encoder(data[token.name as keyof A.Compute<ExtractRouteData<Parameters>>])
          );
        })
        .join('');
    },
  };
}

export type ExtractNameFromRouteDefinition<R> = R extends RouteDefinition<infer Name, any>
  ? Name
  : never;

export type ExtractDataFromRouteDefinition<R> = R extends RouteDefinition<infer Name, infer Matcher>
  ? Matcher
  : never;

type bar = ExtractDataFromRouteDefinition<{
  readonly name: 'todo';
  readonly path: RouteMatcher<
    [RouteParameter<'id', number>],
    {
      id: number;
    }
  >;
}>;

export type RouteDefinition<
  Name extends string = string,
  Matcher extends RouteMatcher = RouteMatcher
> = {
  /** Name associated with the route definition. */
  name: Name;
  /** A path generated from the `route` helper. */
  path: Matcher;
};

export type RouteLocation<Name extends string = string, Data = Record<string, any>> = {
  /** Name associated with the route definition. */
  name: Name;
  /** Data object of params and query extracted from the route. */
  data: Data;
  /** *(Optional)* hash to append to the url. */
  hash?: string;
};

export type Route<Name extends string = string, Data = Record<string, any>> = {
  name: Name;
  /** Path just including  */
  path: string;
  /** Full path including query and hash. */
  fullPath: string;
  data: Data;
  /** Empty string if it doesn't exist. */
  hash: string;
};

export function createMatcher<Routes extends ReadonlyArray<RouteDefinition>>(routes: Routes) {
  const routeMatchers = routes.reduce((acc, route) => {
    acc[route.name] = route.path;
    return acc;
  }, {} as Record<string, RouteMatcher>);

  function match(location: RouteLocation): Route {
    const { name, data = {}, hash = '' } = location;

    const matcher = routeMatchers[name];

    if (!matcher) {
      throw new Error(`[xrouter] Route not matched for 'name': '${name}'.`);
    }

    const path = matcher.serialize(data);
    const fullPath = path; /* + '#' + hash */

    return { name, path, data, hash, fullPath };
  }

  return {
    match,
    serialize: (rawLocation: RouteLocation) => match(rawLocation).path,
    deserialize(url: string): Route {
      for (const routeDefinition of routes) {
        const { name } = routeDefinition;
        const routeMatcher = routeMatchers[name];
        const data = routeMatcher.match(url);

        if (data) {
          return { name, path: url, data, hash: '', fullPath: url };
        }
      }

      throw new Error(`[xrouter] Route not matched for path '${url}'.`);
    },
  };
}
