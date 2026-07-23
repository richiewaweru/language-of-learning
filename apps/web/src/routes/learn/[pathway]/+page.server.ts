import { error } from '@sveltejs/kit';
import { course, lessons } from '$lib/pilot/course';
import '$lib/pilot/validation';

export function load({ params }: { params: { pathway: string } }) {
  if (params.pathway !== course.id) error(404, 'Pathway not found');
  return { pathway: course, lessons };
}
