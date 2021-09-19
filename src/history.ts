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
