import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';

const REDIRECTS: Record<string, string> = {
  '/learn/how-loops-build-results': '/learn/python-foundations',
  '/learn/how-loops-build-results/accumulate': '/learn/python-foundations/loops/accumulate',
  '/learn/how-loops-build-results/count': '/learn/python-foundations/loops/count',
  '/learn/how-loops-build-results/filter': '/learn/python-foundations/loops/filter',
  '/learn/how-loops-build-results/transform': '/learn/python-foundations/loops/transform',
  '/learn/python-foundations/accumulate': '/learn/python-foundations/loops/accumulate',
  '/learn/python-foundations/count': '/learn/python-foundations/loops/count',
  '/learn/python-foundations/filter': '/learn/python-foundations/loops/filter',
  '/learn/python-foundations/transform': '/learn/python-foundations/loops/transform',
  '/demo': '/learn/python-foundations/loops/accumulate',
};

export const handle: Handle = async ({ event, resolve }) => {
  const path = event.url.pathname.replace(/\/$/, '') || '/';
  const target = REDIRECTS[path];
  if (target) {
    throw redirect(301, target);
  }
  return resolve(event);
};
