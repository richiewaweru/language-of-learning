import { z } from 'zod';

export const RuntimeTokenStatusSchema = z.enum([
  'idle',
  'moving',
  'bound',
  'consumed',
  'returned',
  'ghost',
]);

export const RuntimeTokenStateSchema = z.object({
  id: z.string(),
  repr: z.string(),
  nodeId: z.string().optional(),
  edgeId: z.string().optional(),
  visible: z.boolean(),
  status: RuntimeTokenStatusSchema,
});

export const MotionStateSchema = z.object({
  stepIndex: z.number().int().nonnegative(),
  tokens: z.record(z.string(), RuntimeTokenStateSchema),
  bindings: z.record(z.string(), z.string()),
  collections: z.record(z.string(), z.array(z.string())),
  branchResults: z.record(z.string(), z.boolean()),
  activePaths: z.array(z.string()),
  fadedPaths: z.array(z.string()),
  focusedNodes: z.array(z.string()),
  ghosts: z.array(z.string()),
  returnValue: z.string().optional(),
});

export type RuntimeTokenStatus = z.infer<typeof RuntimeTokenStatusSchema>;
export type RuntimeTokenState = z.infer<typeof RuntimeTokenStateSchema>;
export type MotionState = z.infer<typeof MotionStateSchema>;
