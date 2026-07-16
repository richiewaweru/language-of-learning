import { z } from 'zod';

export const SceneActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('move_value'),
    repr: z.string(),
    fromNode: z.string(),
    toNode: z.string(),
  }),
  z.object({
    type: z.literal('advance_item'),
    loop: z.string(),
    itemIndex: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal('evaluate'),
    branch: z.string(),
    result: z.boolean(),
  }),
  z.object({
    type: z.literal('change_state'),
    cell: z.string(),
    oldRepr: z.string(),
    newRepr: z.string(),
  }),
  z.object({
    type: z.literal('exit_return'),
    repr: z.string(),
    port: z.string(),
  }),
  z.object({
    type: z.literal('pulse_effect'),
    node: z.string(),
  }),
]);

export const SceneStepSchema = z.object({
  index: z.number().int().nonnegative(),
  focus: z.array(z.string()),
  line: z.number().int().positive(),
  actions: z.array(SceneActionSchema),
  caption: z.object({
    key: z.string(),
    params: z.record(z.string(), z.string()),
  }),
});

export const LayoutNodeSchema = z.object({
  id: z.string(),
  kind: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

export const SceneSchema = z.object({
  id: z.string(),
  graphRef: z.string(),
  layout: z.array(LayoutNodeSchema),
  steps: z.array(SceneStepSchema),
});

/** Fixture file: expected scene actions per trace step (shape-only in P0). */
export const SceneActionsFixtureSchema = z.object({
  steps: z.array(
    z.object({
      index: z.number().int().nonnegative(),
      actions: z.array(SceneActionSchema),
    }),
  ),
});

export type Scene = z.infer<typeof SceneSchema>;
export type SceneAction = z.infer<typeof SceneActionSchema>;
