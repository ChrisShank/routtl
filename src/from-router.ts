import { InvokeCallback } from 'xstate';
import { Route, RouteLocationRaw, Router } from './router';

type RouterReceiveEvent =
  | { type: 'go'; delta: number }
  | { type: 'forward' }
  | { type: 'back' }
  | { type: 'push'; location: RouteLocationRaw }
  | { type: 'replace'; location: RouteLocationRaw };

type RouterSendEvent = { type: 'navigate'; route: Route };

export function fromRouter(router: Router) {
  const callback: InvokeCallback<RouterReceiveEvent, RouterSendEvent> = (sendBack, onReceive) => {
    const subscription = router.subscribe((route) => {
      sendBack({ type: 'navigate', route });
    });

    onReceive((event) => {
      switch (event.type) {
        case 'go': {
          router.go(event.delta);
          return;
        }
        case 'back': {
          router.back();
          return;
        }
        case 'forward': {
          router.forward();
          return;
        }
        case 'push': {
          router.push(event.location);
          return;
        }
        case 'replace': {
          router.replace(event.location);
          return;
        }
        default: {
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  };
  return () => callback;
}
