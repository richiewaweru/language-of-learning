import { z } from 'zod';

export const SceneActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('move_value'),
    repr: z.string(),
    fromNode: z.string(),
    toNode: z.string(),
    tokenId: z.string().optional(),
    viaEdge: z.string().optional(),
  }),
  z.object({
    type: z.literal('advance_item'),
    loop: z.string(),
    itemIndex: z.number().int().nonnegative(),
    collection: z.string().optional(),
    itemRepr: z.string().optional(),
    tokenId: z.string().optional(),
  }),
  z.object({
    type: z.literal('evaluate'),
    branch: z.string(),
    result: z.boolean(),
    activeEdge: z.string().optional(),
    inactiveEdge: z.string().optional(),
  }),
  z.object({
    type: z.literal('change_state'),
    cell: z.string(),
    oldRepr: z.string(),
    newRepr: z.string(),
    inputTokenId: z.string().optional(),
  }),
  z.object({
    type: z.literal('exit_return'),
    repr: z.string(),
    port: z.string(),
    tokenId: z.string().optional(),
    returnNode: z.string().optional(),
    functionNode: z.string().optional(),
  }),
  z.object({
    type: z.literal('pulse_effect'),
    node: z.string(),
    effectType: z.string().optional(),
    repr: z.string().optional(),
  }),
  // New PM0 motion variants
  z.object({
    type: z.literal('spawn_value'),
    tokenId: z.string(),
    repr: z.string(),
    atNode: z.string(),
  }),
  z.object({
    type: z.literal('bind_value'),
    tokenId: z.string(),
    bindingNode: z.string(),
    repr: z.string(),
  }),
  z.object({
    type: z.literal('append_value'),
    collection: z.string(),
    valueRepr: z.string(),
    tokenId: z.string(),
    newIndex: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal('focus_nodes'),
    primary: z.string(),
    secondary: z.array(z.string()).optional(),
  }),
  z.object({
    type: z.literal('fade_path'),
    edgeIds: z.array(z.string()).min(1),
  }),
  z.object({
    type: z.literal('restore_path'),
    edgeIds: z.array(z.string()).min(1),
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

export const LayoutEdgeKindSchema = z.enum([
  'data',
  'control',
  'repeat',
  'true_path',
  'false_path',
  'return',
]);

export const LayoutEdgeSchema = z.object({
  id: z.string(),
  fromNode: z.string(),
  toNode: z.string(),
  kind: LayoutEdgeKindSchema,
  path: z.union([
    z.object({ d: z.string() }),
    z.object({
      x1: z.number(),
      y1: z.number(),
      x2: z.number(),
      y2: z.number(),
    }),
  ]),
});

export const SceneSchema = z.object({
  id: z.string(),
  graphRef: z.string(),
  motionVersion: z.string().optional(),
  layout: z.array(LayoutNodeSchema),
  edges: z.array(LayoutEdgeSchema).default([]),
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
export type SceneStep = z.infer<typeof SceneStepSchema>;
export type LayoutNode = z.infer<typeof LayoutNodeSchema>;
export type LayoutEdge = z.infer<typeof LayoutEdgeSchema>;
export type LayoutEdgeKind = z.infer<typeof LayoutEdgeKindSchema>;
export type SceneActionsFixture = z.infer<typeof SceneActionsFixtureSchema>;
