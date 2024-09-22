# Routtl (pronounced rout·le)

> Lightweight routing primitives.

**WIP, don't use in production. Expect occasional breaking changes until we hit stable in 1.0.0.**

## Usage

```ts
import { route, string } from 'routtl';

const helloRoute = route`/hello/${string('world')}`;

const url = helloRoute.encode({ params: { world: 'world' } });
//     ^ '/hello/world'

const data = helloRoute.decode('/hello/world');
//     ^ { params: { world: 'world' } }
```

## Overview

`Routtl` is a small set of primitives for defining routes and encoding/decoding data to/from that route. It is small (less than 500kb of JS), has no dependencies, and provides type-safe decoding. It uses JavaScript's [tagged template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) to provide a declarative, composable API for defining routes.

## Decoders

Default decoders are provided for primitive JS types (e.g. string, number, boolean, date). A simple `Decoder` interface is provided to extend or build your own decoding. Additionally, a decoder factory is provided for arrays of arbitrary types.

Built-in decoders include:

- `string`
- `int`
- `float`
- `date`
- `datetime`
- `array`, allows you to define an array of a certain decoder

## Decoding Search Params

At the end of a route definition you can define a way to decode a routes search params. It must be the last interpolated value and be proceeded by a `?`.

```ts
import { route, search, date } from 'routtl';

const searchRoute = route`/?${search({ filter: date })}`;

const url = searchRoute.encode({ search: { filter: new Date('2000-01-01') } });
//     ^ '/?filter=2000-01-01'
```

## Templating HTML

When templating HTML, you can use `route.encode()` to generate the `href` for an `<a>` tag. Here is an example using [`lit-html`](https://lit.dev/docs/templates/overview/) as a template engine:

```ts
import { route, string } from 'routtl';
import { render, html } from 'lit-html';

const helloRoute = route`/hello/${['world', string]}`;

render(document.body, html`<a href="${helloRoute.encode({ world: 'world' })}">Link</a>`);
```

## Composing

`RouteParser`s can be composed together as shown here:

```ts
import { route, string } from 'routtl';

const helloRoute = route`/hello`;

const worldRoute = route`${helloRoute}/world/${string('id')}`;

const url = helloRoute.encode({ params: { id: 'foo' } });
//     ^ '/hello/world/foo'
```

## Roadmap

- [x] Built-in decoders
- [x] Decoder type safely
- [x] Nest Route Parsers
- [x] Decode query parameters
- [ ] Ignore case and other options

## Contributing

See the [guide](https://github.com/ChrisShank/routtl/blob/main/CONTRIBUTING.md).

## Inspiration

Lots of inspiration for this project! [@ncthbrt](https://github.com/ncthbrt) was crucial to the early prototypes. `vue-router`, `navaid`, `typesafe-routes` have been influential in the design of these primitives.

There is also an API called [URLPattern](https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API) that has recently emerged from the WHATWG standards body that addresses _some_ of the problems `routtl` is solving. At the time of this writing its only supported by Chromium browsers. A 3rd party a [polyfill](https://github.com/kenchris/urlpattern-polyfill) is available as well.
