import { createWebHistory, createRouter, intParser } from './index';
import { stringParser } from './parsers';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      name: 'todo',
      path: '/todo/:id',
      params: { id: intParser },
    },
    {
      name: 'todos',
      path: '/todos/:filters',
      params: { filters: stringParser() },
    },
  ],
});
