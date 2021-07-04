import { RouterConfig } from './router-config';

export type Route<Data = any> = {
  path: string;
  fullPath: string;
  data: Data;
  hash?: string;
};
export type RouteLocationRaw =
  | string
  | {
      name: string;
      data: any;
      hash?: string;
    };
export type Subscription = {
  unsubscribe: () => void;
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
  subscribe(listener: (route: Route) => void): Subscription;
};

export function createRouter(config: RouterConfig): Router {
  return {} as any;
}
