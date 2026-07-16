import { z } from 'zod';

export const PatternIdSchema = z.enum([
  'ACCUMULATE',
  'COUNT',
  'FILTER',
  'TRANSFORM',
  'SEARCH',
  'GUARD',
]);

export const PatternHitSchema = z.object({
  pattern: PatternIdSchema,
  confidence: z.enum(['deterministic', 'candidate']),
  memberNodes: z.array(z.string()),
  related: z.array(PatternIdSchema),
  ruleVersion: z.string().optional(),
});

export type PatternHit = z.infer<typeof PatternHitSchema>;
