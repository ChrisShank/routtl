import { createWebHistory, createRouter, intParser } from './index';

const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			name: 'foo',
			path: '/:baz&:bar',
			schema: { bar: intParser, baz: intParser },
		},
	] as const,
});

router.on('foo', (route) => {
	console.log(route.data);
});

const url = router.serialize('foo', { bar: 2, baz: 4 });

router.push('foo', { baz: 1, bar: 1 });