import { RouterHistory } from './history/types';
import { Parser } from './parsers';

type RouteQuery = Record<
  string,
  {
    parser: Parser<any>;
    default: any;
    optional?: boolean;
  }
>;

type RouteDefinition = {
  /** Unique name that is used to reference the route. */
  name: string;
  /** Path according to the path-to-regex syntax. Should start with `/`. */
  path: string;
  params?: Record<string, Parser<any>>;
  query?: RouteQuery;
};

export type RouterConfig = {
  history: RouterHistory;
  routes: RouteDefinition[];
  onNotFound?: () => void;
};
