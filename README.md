# XRouter

> Framework-agnostic, isomorphic router. Lightweight and 100% type-safe.

**Still WIP, dont use in production**

## Usage

```ts
import { createRouter } from 'xrouter';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      name: 'todos',
      path: '/todos',
    },
    {
      name: 'new-todo',
      path: '/todo/new',
    },
    {
      name: 'todo',
      path: '/todo/:id',
      schema: { id: intParser },
    },
  ],
});

// Listen to specific route changes
router.on({
  name: 'todo',
  handler: (route) => console.log(route),
});

// Change the current route
router.push({
  name: 'todo',
  data: { id: 1 },
});

// Serialize a URL to be bound to an anchor
const url = router.serialize({
  name: 'todo',
  data: { id: 1 },
});
```

## Framework-agnostic

`xrouter` has been designed to decouple routing from the view layer, meaning it can be used with just about any component framework and state management library. That said its API is designed to integrate seamlessly with the Stately ecosystem like `xstate` and `xactor`. Will your app still work the same if you remove the router you are currebtly using? Can you router seamlessly integrate with an library or compojent framework? These are the questions we are exploring!

## Small scope

Client-side routers have taken on quite a large scope and in a sense most have become their own specialized state management libraries. This is partly because routing intersects _all_ layers of a web application. They tend to handle deserializing/serializing the URL, mapping components to URL, and routing behavior (e.g. navigation guards, redirects, ect.). This results in an large API surface and larger bundle size. `xrouter` is trying to minimize its scope by only handling serializing/deserializing application state to/from the URL and wrapping around the History API. The goal is for routing behavior to be handled by a library like `xstate` .

## Declarative schema

The main point of `xrouter` is to help serialize/deserialize application state from/to the URL. So you declaratively define the pieces of data you want to extract from the URL and the way to parse that data and `xrouter` will make sure data from the URL is serialized to the correct types.

## Type-safe

`xrouter` is designed to be 100% type-safe. We use some newer TypeScript features to like tagged template types and a declarative route schema to help extract the proper data typings from the URL.

## Routing Behavior

It is intentionally out of the scope of `xrouter` to handle routing behavior such as redirecting and navigation guards. A library like `xstate` can handle your application’s routing behavior more robustly than any API I can come up with. Because of that `xrouter` is designed from the ground up to integrate easily into a library like `xstate` by embracing the actor model. Your application will just end up sending events to the router and listening for events sent from the router. We will provide helpers to easily invoke/spawn actors in `xstate` . Something like this: `invoke: fromRouter(router)`. Each of the methods of the router (e.g `push`, `replace`, ect.) are translated to events like `send(context => ({ type: 'push', name: 'todo', data: { id: context.id } }, { to: 'router' })`

### Xstate integration

If we treat the router as an actor who our app communicates with as opposed to the source of truth for what our app renders, then the router pairs very nicely with xstate (and other state management tools). Usually the router can be a root-level `invoke`, sends and receives events!

```ts
import { createRouter } from 'xrouter'
import { createMachine } from 'xstate'

const router = createRouter(...)

const machine = createMachine({
  invoke: {
    id: 'router',
    src: () => (sendBack, receive) => {
      const subscription = router.subscribe((route) => {
        sendBack({ type: 'navigate', route })
      })

      receive((event) => {
        // Given an event, call `router.push`, `router.back`, ect.
      })

      return () => subscription.unsubscribe()
    },
  },
  initial: 'idle',
  states: {
    idle: {
      on: {
        back: { actions: send('back', { to: 'router' }) }
      }
    },
    // ...
  },
})
```

This invoked callback is sort of inherent boilerplate. So we provide a helper function called `fromRouter` so you can easily invoke the router and the events to communicate with the router are predetermined and more or less the same as the functional API. Here is what it looks like:

```ts
import { createRouter, fromRouter } from 'xrouter'
import { createMachine } from 'xstate'

const router = createRouter(...)

const machine = createMachine({
  invoke: { id: 'router', src: fromRouter(router) },
  initial: 'idle',
  states: {
    idle: {
      on: {
        back: { actions: send('back', { to: 'router' }) }
      }
    },
  }
})
```

## Eventual Consistency

Embracing the actor model brings up an interesting thought. Who owns the URL? I would argue that the mental model of most client-side routers convince you that you own the URL since they consider the URL as a source of truth for what can be rendered. This thinking is faulty though, for any non-trivial web app the URL is not always the source of truth and this mental model starts breaking down through the defensive programming of navigation guards. You must prevent and invalid URL from ever being reached otherwise the component mapped to that URL will be rendered. This mismatch highlights an interesting thought about routing: the URL is actually owned by the browser tab and your app’s state should determine what it should be, not the other way around. Your app is an actor who is communicating with another actor, the browser tab, through the History API! The URL should become eventually consistent with the state of your application.

## Isomorphic

Nowadays routers don’t just run on the browser. They can run on the server during SSR/pre-rendering or support different types of history modes (e.g. hash mode). To account for this you must specify what history mode you want to use, the built-in modes include `createWebHistory`, `createHashHistory`, and `createMemoryHistory` They are tree-shaken if not used.

## Parsers

Default parsers are implemented for primitive JS types, but you are free to define your own parser for serializing/deserializing custom data types to the URL. They will only parse your data to/from the correct type, they do not handle any further validation, that should be handled by your application's behavior. For example if you have a route like `/todo/:id` where `id` is an `int` and the user tries to access `/todo/1234`, you behavior is responsible for making sure that `id` is valid otherwise show an error page. This helps co-locates your apps behavior and eliminates the need for `xrouter` to implement something like `path-to-regex`.

## Todo/Ideas

- [ ] Nested routes

## Inspiration

Lots of inspiration for this project! `vue-router`, `navaid`, `typesafe-routes`, `txstate` have been the really influential. Thanks to those apart of the `xstate` discord for chatting with me about these ideas when I was first thinking through them!
