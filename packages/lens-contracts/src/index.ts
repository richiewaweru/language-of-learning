export * from './graph.js';
export * from './trace.js';
export * from './pattern.js';
export * from './scene.js';
export * from './motion.js';
export * from './selection.js';
export * from './lesson.js';
export * from './pathway.js';

export { z } from 'zod';

import { SemanticGraphSchema } from './graph.js';
import { TraceSchema } from './trace.js';
import { PatternHitSchema } from './pattern.js';
import { SceneSchema, SceneActionsFixtureSchema } from './scene.js';
import { MotionStateSchema } from './motion.js';
import { SelectionSchema } from './selection.js';
import { LessonRevisionSchema } from './lesson.js';
import { PathwaySchema } from './pathway.js';

export const ContractSchemas = {
  semanticGraph: SemanticGraphSchema,
  trace: TraceSchema,
  patternHit: PatternHitSchema,
  scene: SceneSchema,
  sceneActionsFixture: SceneActionsFixtureSchema,
  motionState: MotionStateSchema,
  selection: SelectionSchema,
  lessonRevision: LessonRevisionSchema,
  pathway: PathwaySchema,
} as const;
