# XRouter

> Lightweight routing primitives.

**Still WIP, dont use in production**

## Usage

```ts
import { route, str } from 'routtl';

const todoRoute = route`/hello/${['world', str]}`;

const url = todoRoute.encode({ world: 'world' });
//     ^ '/hello/world'

const data = todoRoute.decode('/hello/world');
//     ^ { world: 'world' }
```

## Overview

`Routtl` is a small set of primitives for defining routes and encoding/decoding data to/from that route. It is small (less than 500kb of JS), has no dependencies, and provides type-safe decoding. It uses type

## Decoders

Default decoders are provided for primitive JS types (e.g. string, number, boolean, date). A simple `Decoder` interface is provided to extend or build your own decoding. Additionally, a decoder factory is provided for arrays.

## Roadmap

- [x] Built-in decoders
- [x] Decoder type safely
- [x] Nest Route Parsers
- [ ] Decode query parameters

## Inspiration

Lots of inspiration for this project! `vue-router`, `navaid`, `typesafe-routes` have been influential in the design of these primitives.
