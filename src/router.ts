import { A } from 'ts-toolbelt';
import { InferRouteData, NamedRouteParameter, RouteParser } from './parser';

// Widen RouteParser for proper type inference
type RouteMap = Record<string, RouteParser<NamedRouteParameter[], any>>;

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

function createMatcher<Routes extends RouteMap>(routesMap: Routes) {
  const routes = Object.entries(routesMap).sort((a, b) => b[1].rank - a[1].rank);

  function match(location: RouteLocation): Route {
    const { name, data = {}, hash = '' } = location;

    const parser = routesMap[name];

    if (!parser) {
      throw new Error(`[xrouter] Route not matched for 'name': '${name}'.`);
    }

    const path = parser.encode(data);
    const fullPath = path; /* + '#' + hash */

    return { name, path, data, hash, fullPath };
  }

  return {
    match,
    encode: (rawLocation: RouteLocation) => match(rawLocation).path,
    decode(url: string): Route {
      for (const [name, route] of routes) {
        const data = route.decode(url);

        if (data) {
          return { name, path: url, data, hash: '', fullPath: url };
        }
      }

      throw new Error(`[xrouter] Route not matched for path '${url}'.`);
    },
  };
}

export type RouterHistoryListener = {
  push: (url: string) => void;
  pop: (url: string) => void;
};

export type RouteURL = {
  path: string;
  query: string;
  hash: string;
};

export type RouterHistory = {
  readonly path: string;
  go(delta?: number): void;
  forward(): void;
  back(): void;
  push(url: string): void;
  replace(url: string): void;
  listen({ pop, push }: RouterHistoryListener): void;
};

export function createWebHistory(base: string = ''): RouterHistory {
  // Normalize base
  base = '/' + (base || '').replace(/^\/|\/$/g, '');

  // Regex to check if href
  const rgx = base === '/' ? /^\/+/ : new RegExp('^\\' + base + '(?=\\/|$)\\/?', 'i');

  return {
    get path() {
      return location.pathname;
    },
    go: () => history.go(),
    forward: () => history.forward(),
    back: () => history.back(),
    push: (url) => history.pushState(null, '', url),
    replace: (url) => history.replaceState(null, '', url),
    listen({ pop, push }) {
      window.addEventListener('popstate', () => {
        pop(location.pathname);
      });

      window.addEventListener('click', (event) => {
        const anchor = (event.target as HTMLElement)?.closest('a');

        const href = anchor?.getAttribute('href');

        if (
          !anchor ||
          anchor.target ||
          anchor.host !== location.host ||
          !href ||
          href[0] == '#' ||
          event.ctrlKey ||
          event.metaKey ||
          event.altKey ||
          event.shiftKey ||
          event.button ||
          event.defaultPrevented
        ) {
          return;
        }

        if (href[0] != '/' || rgx.test(href)) {
          event.preventDefault();
          push(href);
        }
      });
    },
  };
}

export type RouteListener<R extends Route = Route> = (route: R) => void;

export type Subscription = {
  unsubscribe: () => void;
};

/** Map the `name` of the route to the data inferred from the route definition. */
type InferRouteDataMap<Routes extends RouteMap> = {
  [Key in keyof Routes]: InferRouteData<Routes[Key]>;
};

type InferRouteUnion<RouteData> = {
  [Key in keyof RouteData]: Route<Extract<Key, string>, RouteData[Key]>;
}[keyof RouteData];

export type Router<RouteData> = {
  readonly route: A.Compute<InferRouteUnion<RouteData>>;
  /** Go to an arbitrary number forward or backwards in history. */
  go(delta: number): void;
  /** Navigate forward in history. Equivalent to `router.go(1) */
  forward(): void;
  /** Navigate backwards in history. Equivalent to `router.go(-1) */
  back(): void;
  /** Navigate to a new route. */
  push<Name extends keyof RouteData>(
    location: RouteLocation<Extract<Name, string>, RouteData[Name]>
  ): void;
  /** Replace the current route with a new route. */
  replace<Name extends keyof RouteData>(
    location: RouteLocation<Extract<Name, string>, RouteData[Name]>
  ): void;
  /** Encode a route and its data into a URL. Useful for generating `href`s for type-safe */
  encode<Name extends keyof RouteData>(
    location: RouteLocation<Extract<Name, string>, RouteData[Name]>
  ): string;
  /** Decode a URL and its data. */
  decode<Name extends keyof RouteData>(url: string): Route<Extract<Name, string>, RouteData[Name]>;
  /** Given the name of a route, listen to when that route is matched. */
  subscribe(listener: RouteListener<A.Compute<InferRouteUnion<RouteData>>>): Subscription;
};

export function createRouter<Routes extends RouteMap>({
  history,
  routes,
}: {
  history: RouterHistory;
  routes: Readonly<Routes>;
}): Router<InferRouteDataMap<Routes>> {
  const matcher = createMatcher(routes);
  const { back, go, forward, push, replace } = history;
  const listeners = new Set<RouteListener>();
  let route: Route = matcher.decode(history.path);

  function navigate(
    locationOrUrl: RouteLocation | string,
    historyCallback?: (url: string) => void
  ) {
    const possibleRoute =
      typeof locationOrUrl === 'string'
        ? matcher.decode(locationOrUrl)
        : matcher.match(locationOrUrl);

    if (possibleRoute.fullPath === route.fullPath) {
      throw new Error(`[xrouter] Duplicate navigation detected for path '${route.fullPath}'.`);
    }

    route = Object.freeze(possibleRoute);
    historyCallback?.(route.fullPath);
    listeners.forEach((listener) => listener(route));
  }

  history.listen({
    push: (url) => navigate(url, push),
    pop: (url) => navigate(url),
  });

  return {
    get route() {
      return route as any;
    },
    back,
    forward,
    go,
    push: (location) => navigate(location, push),
    replace: (location) => navigate(location, replace),
    encode: (location) => matcher.encode(location),
    decode: (url) => matcher.decode(url) as any,
    subscribe(listener) {
      listeners.add(listener as RouteListener);
      (listener as RouteListener)(route);

      return {
        unsubscribe: () => listeners.delete(listener as RouteListener),
      };
    },
  };
}
