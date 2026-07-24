export * from './graph.js';
export * from './trace.js';
export * from './pattern.js';
export * from './scene.js';
export * from './motion.js';
export * from './selection.js';
export * from './lesson.js';
export * from './pathway.js';
export * from './semantic.js';
export * from './workspace.js';

export { z } from 'zod';

import { SemanticGraphSchema } from './graph.js';
import { TraceSchema } from './trace.js';
import { PatternHitSchema } from './pattern.js';
import { SceneSchema, SceneActionsFixtureSchema } from './scene.js';
import { MotionStateSchema } from './motion.js';
import { SelectionSchema } from './selection.js';
import { LessonDefinitionV1Schema, LessonDefinitionV2Schema, LessonRevisionSchema } from './lesson.js';
import { PathwaySchema } from './pathway.js';
import { SemanticSceneSchema, SymbolManifestSchema } from './semantic.js';

export const ContractSchemas = {
  semanticGraph: SemanticGraphSchema,
  trace: TraceSchema,
  patternHit: PatternHitSchema,
  scene: SceneSchema,
  sceneActionsFixture: SceneActionsFixtureSchema,
  motionState: MotionStateSchema,
  selection: SelectionSchema,
  lessonRevision: LessonRevisionSchema,
  lessonDefinitionV1: LessonDefinitionV1Schema,
  lessonDefinitionV2: LessonDefinitionV2Schema,
  pathway: PathwaySchema,
  semanticScene: SemanticSceneSchema,
  symbolManifest: SymbolManifestSchema,
} as const;
