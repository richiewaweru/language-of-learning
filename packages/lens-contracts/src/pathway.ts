import { z } from 'zod';
import { LessonRevisionSchema } from './lesson.js';

export const PathwaySchema = z.object({
  version: z.string(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  lessonSlugs: z.array(z.string()).min(1),
});

export type Pathway = z.infer<typeof PathwaySchema>;

export { LessonRevisionSchema };
