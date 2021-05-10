export type RouterHistory = {};

export type RouteDefinition<
	Name extends string | number | symbol = string,
	Path extends string = string
> = {
	/** Unique name that is used to reference the route. */
	name: Name;
	path: Path;
	// TODO
	// redirect: string;
	// alias: string;
};

export type Route = {
	path: string;
	fullPath: string;
	params: Record<string, string>;
	query: Record<string, string[]>;
	hash?: string;
};

export type RouteData = Record<string, any>;

export type RouterOptions<Routes extends RouteDefinition[]> = {
	history: RouterHistory;
	routes: Routes;
	on404?(): void;
};

type InferRouteData<Route extends RouteDefinition> = {};

type InferRouteDataMap<Routes extends readonly RouteDefinition[]> = {
	[Key in keyof Routes as Key extends number ? Routes[Key]['name'] : never]: InferRouteData<
		Routes[Key extends number ? Key : never]
	>;
};

const routes = [{ name: 'foo', path: '/foo' }] as const;

type RouteDataMap = InferRouteDataMap<typeof routes>;

type Foo = RouteDataMap['foo'];

export type Router<Routes extends RouteDefinition[], RouteData = InferRouteDataMap<Routes>> = {
	go(delta: number): void;
	forward(): void;
	backward(): void;
	push<Name extends keyof RouteData>(name: Name, data: RouteData[Name]): void;
	replace<Name extends keyof RouteData>(name: Name, data: RouteData[Name]): void;
	on<Name extends keyof RouteData>(name: Name, data: RouteData[Name]): void;
	/** Serialize a route and its data into a URL. Useful for generating `href`s for type-safe */
	serialize<Name extends keyof RouteData>(name: Name, data: RouteData[Name]): string;
};
