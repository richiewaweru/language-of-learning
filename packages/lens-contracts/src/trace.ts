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
  z.object({ type: z.literal('effect_fire'), effect: z.string(), repr: z.string() }),
  z.object({ type: z.literal('return_exit'), repr: z.string() }),
]);

export const TraceStepSchema = z.object({
  index: z.number().int().nonnegative(),
  line: z.number().int().positive(),
  focus: z.array(z.string()),
  bindings: z.record(z.string(), z.string()),
  event: TraceEventSchema,
});

export const TraceSchema = z.object({
  call: z.object({
    functionId: z.string(),
    argsRepr: z.array(z.string()),
  }),
  steps: z.array(TraceStepSchema),
  result: z.object({ repr: z.string() }).optional(),
  truncated: z.boolean().default(false),
});

export type Trace = z.infer<typeof TraceSchema>;
