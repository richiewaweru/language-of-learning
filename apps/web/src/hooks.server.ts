import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';

const REDIRECTS: Record<string, string> = {
  '/learn/how-loops-build-results': '/learn/python-foundations',
  '/learn/how-loops-build-results/accumulate': '/learn/python-foundations/loops-over-lists',
  '/learn/how-loops-build-results/count': '/learn/python-foundations/loops-over-lists',
  '/learn/how-loops-build-results/filter': '/learn/python-foundations/loops-over-lists',
  '/learn/how-loops-build-results/transform': '/learn/python-foundations/loops-over-lists',
  '/learn/python-foundations/accumulate': '/learn/python-foundations/loops-over-lists',
  '/learn/python-foundations/count': '/learn/python-foundations/loops-over-lists',
  '/learn/python-foundations/filter': '/learn/python-foundations/loops-over-lists',
  '/learn/python-foundations/transform': '/learn/python-foundations/loops-over-lists',
  '/learn/python-foundations/loops/accumulate': '/learn/python-foundations/loops-over-lists',
  '/learn/python-foundations/loops/count': '/learn/python-foundations/loops-over-lists',
  '/learn/python-foundations/loops/filter': '/learn/python-foundations/loops-over-lists',
  '/learn/python-foundations/loops/transform': '/learn/python-foundations/loops-over-lists',
  '/learn/python-foundations/loops/search': '/learn/python-foundations/loops-over-lists',
  '/learn/python-foundations/loops/array-update': '/learn/python-foundations/loops-over-lists',
  '/demo': '/learn/python-foundations/loops-over-lists',
};

export const handle: Handle = async ({ event, resolve }) => {
  const path = event.url.pathname.replace(/\/$/, '') || '/';
  const target = REDIRECTS[path];
  if (target) {
    throw redirect(301, target);
  }
  return resolve(event);
};
