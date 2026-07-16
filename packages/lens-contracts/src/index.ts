export * from './graph.js';
export * from './trace.js';
export * from './pattern.js';
export * from './scene.js';
export * from './selection.js';
export * from './lesson.js';

export { z } from 'zod';

import { SemanticGraphSchema } from './graph.js';
import { TraceSchema } from './trace.js';
import { PatternHitSchema } from './pattern.js';
import { SceneSchema, SceneActionsFixtureSchema } from './scene.js';
import { SelectionSchema } from './selection.js';
import { LessonRevisionSchema } from './lesson.js';

export const ContractSchemas = {
  semanticGraph: SemanticGraphSchema,
  trace: TraceSchema,
  patternHit: PatternHitSchema,
  scene: SceneSchema,
  sceneActionsFixture: SceneActionsFixtureSchema,
  selection: SelectionSchema,
  lessonRevision: LessonRevisionSchema,
} as const;
