# XRouter
> Framework-agnostic, isomorphic router. It is lightweight (hopefully less than 2kb) and 100% type-safe.
## Usage
```ts
import {createRouter} from 'xrouter'

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
  ]
})

// Listen to specific route changes
router.on({
	name: 'todo',
	handler: (route) => console.log(route)
})

// Change the current route
router.push({ 
  name: 'todo', 
  data: { id: 1 } 
})

// Serialize a URL to be bound to an anchor
const url = router.serialize({ 
  name: 'todo', 
  data: { id: 1 } 
});
```

## Framework agnostic
`xrouter`  has been designed to decouple routing from the view layer, meaning it can be used with just about any component framework and state management library. That said its API is designed to integrate seamlessly with the Stately ecosystem like `xstate` and `xactor`. 

## Small scope
Client-side routers have taken on quite a large scope and in a sense most have become their own specialized state management libraries. This is partly because routing intersects *all* layers of a web application. They tend to handle deserializing/serializing the URL, mapping components to URL, and routing behavior (e.g. navigation guards, redirects, ect.).  This results in an large API surface and larger bundle size. `xrouter` is trying to minimize its scope by only handling serializing/deserializing application state to/from the URL and wrapping around the History API. The goal is for routing behavior to be handled by a library like `xstate` .

## Declarative schema
The main point of  `xrouter` is to help serialize/deserialize application state from/to the URL. So you declaratively define the pieces of data you want to extract from the URL and the way to parse that data and `xrouter` will make sure data from the URL is serialized to the correct types. 
## Type-safe
`xrouter` is designed to be 100% type-safe. We use some newer TypeScript features to like tagged template types and a declarative route schema to help extract the proper data typings from the URL.

## Routing Behavior
It is intentionally out of the scope of `xrouter` to handle routing behavior such as redirecting and navigation guards. A library like `xstate` can handle your application’s routing behavior more robustly than any API I can come up with. Because of that `xrouter` is designed from the ground up to integrate easily into a library like `xstate` by embracing the actor model. Your application will just end up sending events to the router and listening for events sent from the router. We will provide helpers to easily invoke/spawn actors in `xstate` . Something like this: `invoke: fromRouter(router)`. Each of the methods of the router (e.g `push`, `replace`, ect.) are translated to events like `send(context => ({ type: 'push', name: 'todo', data: { id: context.id } }, { to: 'router' })`

## Eventual Consistency
Embracing the actor model brings up an interesting thought. Who owns the URL? I would argue that the mental model of most client-side routers convince you that you own the URL since they consider the URL as a source of truth for what can be rendered. This thinking is faulty though, for any non-trivial web app the URL is not always the source of truth and this mental model starts breaking down through the defensive programming of navigation guards. You must prevent and invalid URL from ever being reached otherwise the component mapped to that URL will be rendered. This mismatch highlights an interesting thought about routing: the URL is actually owned by the browser tab and your app’s state should determine what it should be, not the other way around. Your app is an actor who is communicating with another actor, the browser tab, through the History API! The URL should become eventually consistent with the state of your application. 

## Isomorphic
Nowadays routers don’t just run on the browser. They can run on the server during SSR/pre-rendering or support different types of history modes (e.g. hash mode). To account for this you must specify what history mode you want to use, the built-in modes include `createWebHistory`, `createHashHistory`, and `createMemoryHistory` They are tree-shaken if not used.

## Parsers
Default parsers are implemented for primitive JS types, but you are free to define your own parser for serializing/deserializing custom data types to the URL.

## Background (WIP)
Background in client-side routing…'

## Potential Ideas
- [ ] Define route schema with template tagged literal 
```ts
path: path`/todo/${parameter('id', intParser)}?${query('someparam', { type: stringParser, optional: true })}``
```
- [ ] Auto-generate `xstate` actor (mentioned above)
## Inspiration
Lots of inspiration for this project. `vue-router`, `navaid`, and `typesafe-routes` have been the most influential libraries.