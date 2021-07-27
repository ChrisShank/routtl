import { createWebHistory, createRouter, intParser, stringParser, floatParser } from './src/index';

window.router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      name: 'todo',
      path: '/todo/:id',
      params: { id: floatParser },
    },
    {
      name: 'todos',
      path: '/todos',
      query: {
        filters: stringParser(),
      },
    },
  ],
});
