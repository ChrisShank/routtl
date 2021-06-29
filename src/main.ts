import { createWebHistory, createRouter, intParser } from './index';

const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			name: 'foo',
			path: '/:baz&:bar',
			schema: { bar: intParser, baz: intParser },
		},
	] as const, // we should be able to narrow this
});

router.on({
  name: 'foo',
  listener: ({data}) => {
    console.log(data)
  }
});

const url = router.serialize({ name: 'foo', data: { bar: 2, baz: 4 } });

router.push({ name: 'foo', data: { bar: 1, baz: 4 } });