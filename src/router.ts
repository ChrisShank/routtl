import { RouterHistory } from './history/types';
import { createMatcher, Route, RouteDefinition, RouteLocationRaw } from './matcher';

export type RouteListener = (route: Route) => void;

export type Subscription = {
  unsubscribe: () => void;
};

export type RouterConfig = {
  history: RouterHistory;
  routes: RouteDefinition[];
};

export type Router = {
  /** Go to an arbitrary number forward or backwards in history. */
  go(delta: number): void;
  /** Navigate forward in history. Equivalent to `router.go(1) */
  forward(): void;
  /** Navigate backwards in history. Equivalent to `router.go(-1) */
  back(): void;
  /** Navigate to a new route. */
  push(location: RouteLocationRaw): void;
  /** Replace the current route with a new route. */
  replace(location: RouteLocationRaw): void;
  /** Serialize a route and its data into a URL. Useful for generating `href`s for type-safe */
  serialize(location: RouteLocationRaw): string;
  /** Given the name of a route, listen to when that route is matched. */
  subscribe(listener: RouteListener): Subscription;
};

export function createRouter({ history, routes }: RouterConfig): Router {
  const matcher = createMatcher(routes);
  const { back, go, forward, push, replace } = history;
  const listeners = new Set<RouteListener>();
  let route: Route = matcher.deserialize(history.path);

  function navigate(
    locationOrUrl: RouteLocationRaw | string,
    historyCallback?: (url: string) => void
  ) {
    const possibleRoute =
      typeof locationOrUrl === 'string'
        ? matcher.deserialize(locationOrUrl)
        : matcher.match(locationOrUrl);

    if (possibleRoute.fullPath !== route.fullPath) {
      throw new Error(`[xrouter] Duplicate navigation detected for path ${route.fullPath}.`);
    }

    route = possibleRoute;
    historyCallback?.(route.fullPath);
    listeners.forEach((listener) => listener(route));
  }

  history.listen({
    push: (url) => navigate(url, push),
    pop: (url) => navigate(url),
  });

  return {
    back,
    forward,
    go,
    push: (location) => navigate(location, push),
    replace: (location) => navigate(location, replace),
    serialize: matcher.serialize,
    subscribe(listener) {
      listeners.add(listener);
      listener(route);

      return {
        unsubscribe: () => listeners.delete(listener),
      };
    },
  };
}
