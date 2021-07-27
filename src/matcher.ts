import {
  match as matchPath,
  compile as compilePath,
  MatchFunction,
  PathFunction,
} from 'path-to-regexp';
import { Parser } from './parsers';

export type RouteDefinition = {
  /** Unique name that is used to reference the route. */
  name: string;
  /** Path according to the path-to-regex syntax. Should start with `/`. */
  path: string;
  /** Define how to parse parameters directly to/from the URL. */
  params?: Record<string, Parser<any>>;
  /** Define how to parse data to/from the query parameters. */
  query?: Record<string, Parser<any>>;
};

type Data = Record<string, any>;

export type Route = {
  name: string;
  /** Path just including  */
  path: string;
  /** Full path including query and hash. */
  fullPath: string;
  data: Data;
  /** Empty string if it doesn't exist. */
  hash: string;
};

export type RouteLocationRaw = {
  name: string;
  data?: Data;
  hash?: string;
};

type RouteMatcher = {
  index: number;
  match: MatchFunction<Record<string, any>>;
  compile: PathFunction<Record<string, any>>;
};

export function createMatcher(routes: RouteDefinition[]) {
  const routeMatchers = routes.reduce((acc, route, index) => {
    acc[route.name] = {
      index,
      match: matchPath(route.path),
      compile: compilePath(route.path),
    };
    return acc;
  }, {} as Record<string, RouteMatcher>);

  function match(rawLocation: RouteLocationRaw): Route {
    const { name, data = {}, hash = '' } = rawLocation;

    const matcher = routeMatchers[rawLocation.name];

    if (!matcher) {
      throw new Error(`[xrouter] Route not matched for name '${rawLocation.name}'.`);
    }

    const routeDefinition = routes[matcher.index];

    const params: Record<string, any> = {};
    for (const key in routeDefinition.params) {
      const parser = routeDefinition.params[key];
      params[key] = parser.serialize(data[key]);
    }

    let path = matcher.compile(params);
    let fullPath = path;

    if (routeDefinition.query) {
      const query: Record<string, any> = {};
      for (const key in routeDefinition.query) {
        const parser = routeDefinition.query[key];
        query[key] = parser.parse(data[key]);
      }

      const urlParams = new URLSearchParams(query);
      fullPath += urlParams + hash;
    }

    return { name, path, data, hash, fullPath };
  }

  return {
    match,
    serialize(rawLocation: RouteLocationRaw): string {
      const route = match(rawLocation);
      return route.path;
    },
    deserialize(url: string): Route {
      for (const routeDefinition of routes) {
        const { name } = routeDefinition;
        const routeMatcher = routeMatchers[name];
        const match = routeMatcher.match(url);

        if (match) {
          const { params, path } = match;
          const data: Data = {};

          for (const key in routeDefinition.params) {
            const parser = routeDefinition.params[key];
            data[key] = parser.parse(params[key]);
          }

          for (const key in routeDefinition.query) {
            const parser = routeDefinition.query[key];
            data[key] = parser.parse(params[key]);
          }

          return { name, path, data, hash: '', fullPath: url };
        }
      }

      throw new Error(`[xrouter] Route not matched for path '${url}'.`);
    },
  };
}
