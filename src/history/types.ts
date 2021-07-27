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
