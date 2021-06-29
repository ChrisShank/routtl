import { A } from 'ts-toolbelt';

type Prop<T, K> = K extends keyof T ? T[K] : never;

type RouterHistory = {};

export type InferParam<T, M extends [string, string]> = T extends `:${infer O}?`
	? [M[0], M[1] | O]
	: T extends `:${infer O}*`
	? [M[0], M[1] | O]
	: T extends `:${infer O}+`
	? [M[0] | O, M[1]]
	: T extends `:${infer O}`
	? [M[0] | O, M[1]]
	: M;

export type InferParamGroups<P> = P extends `${infer A}/${infer B}`
	? InferParam<A, InferParamGroups<B>>
	: P extends `${infer A}&${infer B}`
	? InferParam<A, InferParamGroups<B>>
	: InferParam<P, [never, never]>;

type MergeParamGroups<G extends [string, string]> = G[0] | G[1];

type RequiredParamNames<G extends [string, string]> = G[0];

type OptionalParamNames<G extends [string, string]> = G[1];

export interface Parser<T> {
	parse: (s: string) => T;
	serialize: (x: T) => string;
}

type RouteSchema<Key extends string> = Record<Key, Parser<any>>;

type RouteDefinition<Self> = {
	/** Unique name that is used to reference the route. */
	name: Prop<Self, 'name'>;
	/** Path according to the path-to-regex syntax. Should start with `/`. */
	path: Prop<Self, 'path'>;
	// TODO: conditionally make this optional
	/** The schema of data parsed from the URL. */
	schema: RouteSchema<MergeParamGroups<InferParamGroups<Prop<Self, 'path'>>>>;
};

export type RouterRoutes<Self> = {
	[I in keyof Self]: RouteDefinition<Prop<Self, I>>;
};

export type RouterConfig<Routes> = {
	history: RouterHistory;
	routes: Routes;
	on404?: () => void;
};

/** Extract the `name` of the route by checking if the `name` is a key in the route. */
type ExtractRouteName<Route> = 'name' extends keyof Route ? Route['name'] : never;

type ExtractDataFromSchema<Schema> = {
	[Key in keyof Schema]: Schema[Key] extends Parser<infer Type> ? Type : never;
};

/** Extract the data of the route from the schema of the route. */
type ExtraRouteData<Route> = 'schema' extends keyof Route
	? ExtractDataFromSchema<Route['schema']>
	: never;

/** Map the `name` of the route to the data inferred from the `schema`. */
type ExtractRouteDataMap<Routes> = {
	[I in keyof Routes as ExtractRouteName<Prop<Routes, I>> extends string
		? ExtractRouteName<Prop<Routes, I>>
		: never]: ExtraRouteData<Prop<Routes, I>>;
};

type Route<Data> = {
	path: string;
	fullPath: string;
	data: Data;
	hash?: string;
};

type RouteLocationRaw<Name extends keyof RouteData, RouteData> = Name | {
  name: Name;
  data: A.Compute<RouteData[Name]>;
  hash?: string;
}

type Subscription = {
  unsubscribe: () => void
};

export type Router<Routes, RouteData = ExtractRouteDataMap<Routes>> = {
  /** Go to an arbitrary number forward or backwards in history. */
	go(delta: number): void;
  /** Navigate forward in history. Equivalent to `router.go(1) */
	forward(): void;
  /** Navigate backwards in history. Equivalent to `router.go(-1) */
	backward(): void;
  /** Navigate to a new route. */
	push<Name extends keyof RouteData>(location: RouteLocationRaw<Name, RouteData>): void;
  /** Replace the current route with a new route. */
	replace<Name extends keyof RouteData>(location: RouteLocationRaw<Name, RouteData>): void;
	/** Serialize a route and its data into a URL. Useful for generating `href`s for type-safe */
	serialize<Name extends keyof RouteData>(location: RouteLocationRaw<Name, RouteData>): string;
	/** Given the name of a route, listen to when that route is matched. */
	on<Name extends keyof RouteData>(listener: {
		name: Name,
		listener: (route: Route<A.Compute<RouteData[Name]>>) => void
  }
	): Subscription;
};
