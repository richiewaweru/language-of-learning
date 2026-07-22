import { z } from 'zod';

export const SEMANTIC_MODEL_VERSION = '1.0.0' as const;
export const SYMBOL_GRAMMAR_VERSION = '1.0.0' as const;

export const NormalizedSourceRangeSchema = z.object({
  startLine: z.number().int().positive(),
  startColumn: z.number().int().nonnegative(),
  endLine: z.number().int().positive(),
  endColumn: z.number().int().nonnegative(),
});

export const SemanticRoleSchema = z.enum([
  'value',
  'binding',
  'collection',
  'state',
  'cursor',
  'range',
  'call-frame',
  'reference',
  'result',
  'generic',
  'unsupported',
]);

export const SemanticEventTypeSchema = z.enum([
  'bind',
  'read',
  'select',
  'move',
  'calculate',
  'compare',
  'branch',
  'repeat',
  'exit',
  'skip',
  'update',
  'insert',
  'remove',
  'swap',
  'call',
  'return',
  'effect',
  'generic',
  'unsupported',
]);

export const EvidenceConfidenceSchema = z.enum([
  'verified',
  'inferred',
  'generic',
  'unsupported',
]);

export const EntityStatusSchema = z.enum([
  'idle',
  'active',
  'selected',
  'changing',
  'completed',
  'unsupported',
]);

export const SemanticEntitySchema = z.object({
  id: z.string().min(1),
  role: SemanticRoleSchema,
  label: z.string().optional(),
  sourceNodeId: z.string().optional(),
  sourceRange: NormalizedSourceRangeSchema.optional(),
  objectId: z.string().optional(),
  confidence: EvidenceConfidenceSchema,
  properties: z.record(z.string(), z.unknown()),
});

export const SemanticEventSchema = z.object({
  id: z.string().min(1),
  type: SemanticEventTypeSchema,
  entityIds: z.array(z.string()),
  sourceRange: NormalizedSourceRangeSchema.optional(),
  stepIndex: z.number().int().nonnegative(),
  confidence: EvidenceConfidenceSchema,
  payload: z.record(z.string(), z.unknown()),
});

export const EntitySnapshotSchema = z.object({
  entityId: z.string().min(1),
  value: z.unknown().optional(),
  previousValue: z.unknown().optional(),
  status: EntityStatusSchema,
  properties: z.record(z.string(), z.unknown()).optional(),
});

export const NormalizedCaptionSchema = z.object({
  key: z.string().min(1),
  variables: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
});

export const NormalizedSceneStepSchema = z.object({
  index: z.number().int().nonnegative(),
  activeSourceRange: NormalizedSourceRangeSchema.optional(),
  activeEntityIds: z.array(z.string()),
  activeEvent: SemanticEventSchema,
  snapshots: z.array(EntitySnapshotSchema),
  caption: NormalizedCaptionSchema,
});

export const SemanticSceneSchema = z
  .object({
    id: z.string().min(1),
    graphRef: z.string().min(1),
    semanticModelVersion: z.literal(SEMANTIC_MODEL_VERSION),
    grammarVersion: z.literal(SYMBOL_GRAMMAR_VERSION),
    entities: z.array(SemanticEntitySchema),
    steps: z.array(NormalizedSceneStepSchema),
  })
  .superRefine((scene, ctx) => {
    const entityIds = new Set<string>();
    scene.entities.forEach((entity, index) => {
      if (entityIds.has(entity.id)) {
        ctx.addIssue({ code: 'custom', path: ['entities', index, 'id'], message: 'Duplicate entity id' });
      }
      entityIds.add(entity.id);
    });
    scene.steps.forEach((step, index) => {
      if (step.index !== index) {
        ctx.addIssue({ code: 'custom', path: ['steps', index, 'index'], message: 'Steps must be contiguous' });
      }
      const referenced = [
        ...step.activeEntityIds,
        ...step.activeEvent.entityIds,
        ...step.snapshots.map((snapshot) => snapshot.entityId),
      ];
      for (const entityId of referenced) {
        if (!entityIds.has(entityId)) {
          ctx.addIssue({ code: 'custom', path: ['steps', index], message: 'Unknown entity id: ' + entityId });
        }
      }
      if (step.activeEvent.stepIndex !== step.index) {
        ctx.addIssue({ code: 'custom', path: ['steps', index, 'activeEvent', 'stepIndex'], message: 'Event step index must match its scene step' });
      }
    });
  });

export const SymbolViewSchema = z.enum(['flow', 'state', 'trace']);
export const SymbolFamilySchema = z.enum(['data', 'state', 'flow', 'decision', 'work', 'exit', 'effect', 'limit']);
export const SymbolKindSchema = z.enum(['entity', 'event', 'control', 'fallback']);
export const SymbolStatusSchema = z.enum(['existing', 'next', 'later', 'needs-wiring', 'required']);
export const SymbolManifestEntrySchema = z.object({
  id: z.string().min(1),
  type: SymbolKindSchema,
  family: SymbolFamilySchema,
  views: z.array(SymbolViewSchema),
  status: SymbolStatusSchema,
});
export const SymbolManifestSchema = z.object({
  grammarVersion: z.literal(SYMBOL_GRAMMAR_VERSION),
  semanticModelVersion: z.literal(SEMANTIC_MODEL_VERSION),
  defaultConcreteness: z.literal('semi-abstract'),
  symbols: z.array(SymbolManifestEntrySchema),
});

export type NormalizedSourceRange = z.infer<typeof NormalizedSourceRangeSchema>;
export type SemanticRole = z.infer<typeof SemanticRoleSchema>;
export type SemanticEventType = z.infer<typeof SemanticEventTypeSchema>;
export type EvidenceConfidence = z.infer<typeof EvidenceConfidenceSchema>;
export type EntityStatus = z.infer<typeof EntityStatusSchema>;
export type SemanticEntity = z.infer<typeof SemanticEntitySchema>;
export type SemanticEvent = z.infer<typeof SemanticEventSchema>;
export type EntitySnapshot = z.infer<typeof EntitySnapshotSchema>;
export type NormalizedSceneStep = z.infer<typeof NormalizedSceneStepSchema>;
export type SemanticScene = z.infer<typeof SemanticSceneSchema>;
export type SymbolManifest = z.infer<typeof SymbolManifestSchema>;
export type SymbolManifestEntry = z.infer<typeof SymbolManifestEntrySchema>;
