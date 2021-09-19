import { A } from 'ts-toolbelt';
import { RouteMatcher, RouteParameter } from 'xrouter';
import { RouterHistory } from './history';
import {
  createMatcher,
  ExtractDataFromRouteDefinition,
  ExtractNameFromRouteDefinition,
  Route,
  RouteDefinition,
  RouteLocation,
} from './matcher';

export type RouteListener<Name extends string = string, Data = Record<string, any>> = (
  route: Route<Name, Data>
) => void;

export type Subscription = {
  unsubscribe: () => void;
};

// Override default inference to widen type
type DefaultRouteDefinition = RouteDefinition<string, RouteMatcher<RouteParameter[], any>>;

/** Map the `name` of the route to the data inferred from the route definition. */
type ExtractRouteDataMap<Routes extends ReadonlyArray<DefaultRouteDefinition>> = {
  [Key in keyof Routes as ExtractNameFromRouteDefinition<
    Routes[Key]
  >]: ExtractDataFromRouteDefinition<Routes[Key]>;
};

export type Router<
  Routes extends ReadonlyArray<DefaultRouteDefinition>,
  RouteData = A.Compute<ExtractRouteDataMap<Routes>>
> = {
  readonly route: Readonly<Route<Extract<keyof RouteData, string>, RouteData[keyof RouteData]>>;
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
  /** Serialize a route and its data into a URL. Useful for generating `href`s for type-safe */
  serialize<Name extends keyof RouteData>(
    location: RouteLocation<Extract<Name, string>, RouteData[Name]>
  ): string;
  /** Given the name of a route, listen to when that route is matched. */
  subscribe(
    listener: RouteListener<Extract<keyof RouteData, string>, RouteData[keyof RouteData]>
  ): Subscription;
};

export function createRouter<Routes extends ReadonlyArray<DefaultRouteDefinition>>({
  history,
  routes,
}: {
  history: RouterHistory;
  routes: Routes;
}): Router<Routes> {
  const matcher = createMatcher(routes);
  const { back, go, forward, push, replace } = history;
  const listeners = new Set<RouteListener>();
  let route: Route = matcher.deserialize(history.path);

  function navigate(
    locationOrUrl: RouteLocation | string,
    historyCallback?: (url: string) => void
  ) {
    const possibleRoute =
      typeof locationOrUrl === 'string'
        ? matcher.deserialize(locationOrUrl)
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
      return route;
    },
    back,
    forward,
    go,
    push: (location) => navigate(location, push),
    replace: (location) => navigate(location, replace),
    serialize: matcher.serialize,
    subscribe(listener) {
      listeners.add(listener as RouteListener);
      (listener as RouteListener)(route);

      return {
        unsubscribe: () => listeners.delete(listener as RouteListener),
      };
    },
  };
}

type foo = ExtractRouteDataMap<
  readonly [
    {
      readonly name: 'todo';
      readonly path: RouteMatcher<
        [RouteParameter<'id', number>],
        {
          id: number;
        }
      >;
    },
    {
      readonly name: 'todos';
      readonly path: RouteMatcher<[], {}>;
    }
  ]
>;
