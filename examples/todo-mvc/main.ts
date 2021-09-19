import { createWebHistory, createRouter, route, int } from 'xrouter';

const router = createRouter({
  history: createWebHistory('examples/todo-mvc'),
  routes: [
    {
      name: 'todo',
      path: route`/todo/${int('id')}`,
    },
    {
      name: 'todos',
      path: route`/todo/${int('id')}`,
    },
  ],
});

console.log(router);

window.router = router;
