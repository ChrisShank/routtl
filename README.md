# Routtl (pronounced rout·le)

> Lightweight routing primitives.

**WIP, don't use in production. Expect occasional breaking changes until we hit stable in 1.0.0.**

## Usage

```ts
import { route, string } from 'routtl';

const helloRoute = route`/hello/${['world', string]}`;

const url = helloRoute.encode({ world: 'world' });
//     ^ '/hello/world'

const data = helloRoute.decode('/hello/world');
//     ^ { world: 'world' }
```

## Overview

`Routtl` is a small set of primitives for defining routes and encoding/decoding data to/from that route. It is small (less than 500kb of JS), has no dependencies, and provides type-safe decoding. It uses JavaScript's [tagged template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) to provide a declarative, composable API for defining routes.

## Decoders

Default decoders are provided for primitive JS types (e.g. string, number, boolean, date). A simple `Decoder` interface is provided to extend or build your own decoding. Additionally, a decoder factory is provided for arrays of arbitrary types.

## Templating HTML

When template HTML, you have use `route.encode()` to generate a `href` for an `<a>`. Here is an example using [`lit-html`](https://lit.dev/docs/templates/overview/) to template HTML:

```ts
import { route, string } from 'routtl';
import { render, html } from 'lit-html';

const helloRoute = route`/hello/${['world', string]}`;

const url = helloRoute.encode({ world: 'world' });

render(document.body, html`<a href="${url}">Link</a>`);
```

## Roadmap

- [x] Built-in decoders
- [x] Decoder type safely
- [x] Nest Route Parsers
- [ ] Decode query parameters

## Contributing

See the [guide](https://github.com/ChrisShank/routtl/blob/main/CONTRIBUTING.md).

## Inspiration

Lots of inspiration for this project! [@ncthbrt](https://github.com/ncthbrt) was crucial to the early prototypes. `vue-router`, `navaid`, `typesafe-routes` have been influential in the design of these primitives.

There is allow an API called [URLPattern](https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API) that has recently emerged from the WHATWG standards body that addresses _some_ of the problems `routtle` is solving. At the time of this writing most browsers besides Firefox and Safari support it and a [polyfill](https://github.com/kenchris/urlpattern-polyfill) is available.
