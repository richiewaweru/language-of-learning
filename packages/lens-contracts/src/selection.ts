import { z } from 'zod';
import { SourceRangeSchema } from './graph.js';

export const SelectionSchema = z.object({
  nodeId: z.string().optional(),
  line: z.number().int().positive().optional(),
  sourceRange: SourceRangeSchema.optional(),
  stepIndex: z.number().int().nonnegative().optional(),
});

export type Selection = z.infer<typeof SelectionSchema>;
