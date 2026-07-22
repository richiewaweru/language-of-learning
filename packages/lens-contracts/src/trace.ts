import { z } from 'zod';

export const TraceEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('call_enter'), functionId: z.string() }),
  z.object({ type: z.literal('bind_param'), name: z.string(), repr: z.string() }),
  z.object({ type: z.literal('state_init'), binding: z.string(), repr: z.string() }),
  z.object({
    type: z.literal('loop_advance'),
    loop: z.string(),
    itemIndex: z.number().int().nonnegative(),
    itemRepr: z.string(),
  }),
  z.object({
    type: z.literal('condition_eval'),
    branch: z.string(),
    result: z.boolean(),
  }),
  z.object({
    type: z.literal('state_change'),
    binding: z.string(),
    oldRepr: z.string(),
    newRepr: z.string(),
  }),
  z.object({
    type: z.literal('collection_append'),
    collection: z.string(),
    valueRepr: z.string(),
  }),
  z.object({
    type: z.literal('indexed_selection'),
    collection: z.string(),
    indexRepr: z.string(),
    valueRepr: z.string(),
  }),
  z.object({
    type: z.literal('indexed_mutation'),
    collection: z.string(),
    indexRepr: z.string(),
    oldRepr: z.string(),
    newRepr: z.string(),
  }),
  z.object({
    type: z.literal('supported_call'),
    callee: z.enum(['len', 'range']),
    argsRepr: z.array(z.string()),
    resultRepr: z.string(),
  }),
  z.object({
    type: z.literal('loop_test'),
    loop: z.string(),
    iteration: z.number().int().nonnegative(),
    result: z.boolean(),
  }),
  z.object({
    type: z.literal('loop-exit'),
    loopId: z.string(),
    reason: z.literal('break'),
    iteration: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal('loop-skip'),
    loopId: z.string(),
    reason: z.literal('continue'),
    iteration: z.number().int().nonnegative(),
  }),
  z.object({ type: z.literal('effect_fire'), effect: z.string(), repr: z.string() }),
  z.object({
    type: z.literal('unsupported'),
    construct: z.string(),
    message: z.string(),
  }),
  z.object({ type: z.literal('return_exit'), repr: z.string() }),
]);

export const TraceStepSchema = z.object({
  index: z.number().int().nonnegative(),
  line: z.number().int().positive(),
  focus: z.array(z.string()),
  bindings: z.record(z.string(), z.string()),
  objectIds: z.record(z.string(), z.string()).optional(),
  frameId: z.string().optional(),
  event: TraceEventSchema,
});

export const TraceSchema = z.object({
  call: z.object({
    functionId: z.string(),
    argsRepr: z.array(z.string()),
  }),
  steps: z.array(TraceStepSchema),
  result: z.object({ repr: z.string() }).optional(),
  violation: z.object({ construct: z.string(), message: z.string() }).optional(),
  truncated: z.boolean().default(false),
});

export type Trace = z.infer<typeof TraceSchema>;
