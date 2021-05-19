import { RouterConfig, Router, RouterRoutes } from './types';

export function createRouter<Routes extends RouterRoutes<Routes>>(
	config: RouterConfig<Routes>
): Router<Routes> {
	return {} as any;
}
