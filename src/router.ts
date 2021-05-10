import { RouteDefinition, Router, RouterOptions } from './types';

export function createRouter<Routes extends RouteDefinition[]>(
	options: RouterOptions<Routes>
): Router<Routes> {
	return {} as any;
}
