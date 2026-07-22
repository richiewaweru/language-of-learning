import { z } from 'zod';

export const SourceRangeSchema = z.object({
  startLine: z.number().int().nonnegative(),
  startCol: z.number().int().nonnegative(),
  endLine: z.number().int().nonnegative(),
  endCol: z.number().int().nonnegative(),
});

export type SourceRange = z.infer<typeof SourceRangeSchema>;

export const NodeKindSchema = z.enum([
  'value',
  'binding',
  'collection',
  'function',
  'call',
  'operation',
  'sequence',
  'branch',
  'loop',
  'return',
  'mutation',
  'effect',
]);

export const BindingRoleSchema = z.enum([
  'constant',
  'parameter',
  'local',
  'iterator',
  'state',
]);

export const RelationTypeSchema = z.enum([
  'contains',
  'reads',
  'writes',
  'feeds',
  'returns',
  'iterates',
  'mutates',
]);

export const NodeBaseSchema = z.object({
  id: z.string().min(1),
  kind: NodeKindSchema,
  sourceRange: SourceRangeSchema,
});

export const ValueNodeSchema = NodeBaseSchema.extend({
  kind: z.literal('value'),
  repr: z.string(),
  pyType: z.string(),
});

export const BindingNodeSchema = NodeBaseSchema.extend({
  kind: z.literal('binding'),
  name: z.string(),
  role: BindingRoleSchema,
  mutable: z.boolean(),
  initialRepr: z.string().optional(),
});

export const CollectionNodeSchema = NodeBaseSchema.extend({
  kind: z.literal('collection'),
  name: z.string().optional(),
  items: z.array(z.string()),
});

export const FunctionNodeSchema = NodeBaseSchema.extend({
  kind: z.literal('function'),
  name: z.string(),
  params: z.array(z.string()),
});

export const CallNodeSchema = NodeBaseSchema.extend({
  kind: z.literal('call'),
  callee: z.string(),
  args: z.array(z.string()),
});

export const OperationNodeSchema = NodeBaseSchema.extend({
  kind: z.literal('operation'),
  expr: z.string(),
});

export const SequenceNodeSchema = NodeBaseSchema.extend({
  kind: z.literal('sequence'),
  children: z.array(z.string()),
});

export const BranchNodeSchema = NodeBaseSchema.extend({
  kind: z.literal('branch'),
  conditionExpr: z.string(),
  trueBody: z.string(),
  falseBody: z.string().optional(),
});

export const LoopNodeSchema = NodeBaseSchema.extend({
  kind: z.literal('loop'),
  iteratorName: z.string(),
  collectionRef: z.string(),
  body: z.string(),
});

export const ReturnNodeSchema = NodeBaseSchema.extend({
  kind: z.literal('return'),
  valueRef: z.string(),
});

export const MutationNodeSchema = NodeBaseSchema.extend({
  kind: z.literal('mutation'),
  targetRef: z.string(),
  mutationType: z.string(),
});

export const EffectNodeSchema = NodeBaseSchema.extend({
  kind: z.literal('effect'),
  effectType: z.string(),
});

export const SemanticNodeSchema = z.discriminatedUnion('kind', [
  ValueNodeSchema,
  BindingNodeSchema,
  CollectionNodeSchema,
  FunctionNodeSchema,
  CallNodeSchema,
  OperationNodeSchema,
  SequenceNodeSchema,
  BranchNodeSchema,
  LoopNodeSchema,
  ReturnNodeSchema,
  MutationNodeSchema,
  EffectNodeSchema,
]);

export const RelationSchema = z.object({
  from: z.string(),
  type: RelationTypeSchema,
  to: z.string(),
});

export const UnsupportedRegionSchema = z.object({
  sourceRange: SourceRangeSchema,
  code: z.string(),
  construct: z.string(),
  message: z.string(),
  diagnostic: z.string(),
});

export const SemanticGraphSchema = z.object({
  version: z.string(),
  source: z.string(),
  nodes: z.array(SemanticNodeSchema),
  relations: z.array(RelationSchema),
  unsupported: z.array(UnsupportedRegionSchema).default([]),
});

export type SemanticGraph = z.infer<typeof SemanticGraphSchema>;
