import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ContractSchemas } from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemasDir = join(__dirname, '..', 'schemas');

const exports = [
  ['semantic-graph', ContractSchemas.semanticGraph],
  ['trace', ContractSchemas.trace],
  ['pattern-hit', ContractSchemas.patternHit],
  ['scene', ContractSchemas.scene],
  ['scene-actions-fixture', ContractSchemas.sceneActionsFixture],
  ['motion-state', ContractSchemas.motionState],
  ['selection', ContractSchemas.selection],
  ['lesson-revision', ContractSchemas.lessonRevision],
  ['pathway', ContractSchemas.pathway],
] as const;

mkdirSync(schemasDir, { recursive: true });

for (const [name, schema] of exports) {
  const jsonSchema = zodToJsonSchema(schema, { name, $refStrategy: 'none' });
  writeFileSync(join(schemasDir, `${name}.json`), `${JSON.stringify(jsonSchema, null, 2)}\n`);
}

console.log(`Exported ${exports.length} JSON Schema files to ${schemasDir}`);

// Sanity: round-trip read
for (const [name] of exports) {
  JSON.parse(readFileSync(join(schemasDir, `${name}.json`), 'utf8'));
}
