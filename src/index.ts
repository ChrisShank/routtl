export { createWebHistory } from './history/html5';
export { createRouter } from './router';
export * from './types';

import { createWebHistory } from './history/html5';
import { createRouter } from './router';

const router = createRouter({
	history: createWebHistory(),
	routes: [],
});
