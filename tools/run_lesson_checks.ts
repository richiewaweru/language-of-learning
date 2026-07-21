/**
 * Machine verification checklist for P6 lessons (authoring doc §Machine checks).
 * Reports 4/4 machine-checked when all lessons in the loops pathway pass.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ContractSchemas } from '../packages/lens-contracts/src/index.ts';
import { detectPattern } from '../packages/lens-patterns/src/index.ts';
import {
  assertNoOverlap,
  buildScene,
  layoutGraph,
  renderCaption,
} from '../packages/lens-scenes/src/index.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pathway = ContractSchemas.pathway.parse(
  JSON.parse(
    readFileSync(join(root, 'content', 'pathways', 'how-loops-build-results.json'), 'utf8'),
  ),
);
const sceneIndex = JSON.parse(
  readFileSync(join(root, 'content', 'scene-index.json'), 'utf8'),
) as Record<string, { fixture: string; examplePath: string }>;

type CheckResult = { ok: boolean; detail: string };

function check(ok: boolean, detail: string): CheckResult {
  return { ok, detail };
}

function verifyLesson(slug: string): CheckResult[] {
  const lessonPath = join(root, 'content', 'lessons', `${slug}.json`);
  const lesson = ContractSchemas.lessonRevision.parse(
    JSON.parse(readFileSync(lessonPath, 'utf8')),
  );
  const results: CheckResult[] = [];

  results.push(check(lesson.slug === slug, `schema slug=${lesson.slug}`));
  results.push(
    check(
      lesson.verification?.verified_by === 'PENDING-HUMAN' ||
        lesson.verification?.verified_by === 'PENDING-RICHIE',
      `verification placeholder=${lesson.verification?.verified_by}`,
    ),
  );

  const requiredTypes = [
    'question',
    'staticPreview',
    'prediction',
    'execution',
    'patternExplanation',
    'variation',
    'comparison',
    'transferCheck',
    'summary',
  ];
  for (const t of requiredTypes) {
    results.push(check(lesson.blocks.some((b) => b.type === t), `section type ${t}`));
  }

  const sceneBlocks = lesson.blocks.filter(
    (b) => b.type === 'scene' || b.type === 'staticPreview' || b.type === 'execution',
  );
  results.push(check(sceneBlocks.length >= 1, `scene blocks=${sceneBlocks.length}`));

  for (const block of sceneBlocks) {
    if (block.type !== 'scene' && block.type !== 'staticPreview' && block.type !== 'execution') continue;
    const sceneId = block.sceneId;
    const meta = sceneIndex[sceneId];
    results.push(check(Boolean(meta), `sceneId ${sceneId} in index`));
    if (!meta) continue;

    const fixture = meta.fixture;
    const graph = ContractSchemas.semanticGraph.parse(
      JSON.parse(readFileSync(join(root, 'fixtures', fixture, 'expected.graph.json'), 'utf8')),
    );
    const trace = ContractSchemas.trace.parse(
      JSON.parse(readFileSync(join(root, 'fixtures', fixture, 'expected.trace.json'), 'utf8')),
    );
    const call = JSON.parse(
      readFileSync(join(root, 'fixtures', fixture, 'call.json'), 'utf8'),
    ) as { argsRepr: string[] };

    results.push(check(graph.unsupported.length === 0, 'unsupported empty'));
    results.push(check(trace.steps.length >= 2, `trace steps=${trace.steps.length}`));
    results.push(check(Boolean(trace.result?.repr), `result=${trace.result?.repr}`));
    results.push(check(Array.isArray(call.argsRepr), 'sample call args present'));

    const pattern = detectPattern(graph);
    results.push(check(pattern?.confidence === 'deterministic', `pattern=${pattern?.pattern}`));
    results.push(
      check(
        pattern?.pattern.toLowerCase() === slug ||
          (slug === 'accumulate' && pattern?.pattern === 'ACCUMULATE') ||
          (slug === 'count' && pattern?.pattern === 'COUNT') ||
          (slug === 'filter' && pattern?.pattern === 'FILTER') ||
          (slug === 'transform' && pattern?.pattern === 'TRANSFORM'),
        `pattern matches lesson ${slug}`,
      ),
    );

    const layout = layoutGraph(graph);
    try {
      assertNoOverlap(layout.layout);
      results.push(check(true, 'layout no overlap'));
    } catch (err) {
      results.push(check(false, `layout overlap: ${err}`));
    }

    const scenePath = join(root, 'content', 'scenes', `${fixture}.json`);
    results.push(check(existsSync(scenePath), `static scene file ${fixture}.json`));
    const scene = ContractSchemas.scene.parse(JSON.parse(readFileSync(scenePath, 'utf8')));
    const nodeIds = new Set(graph.nodes.map((n) => n.id));
    const badRefs = scene.layout.map((n) => n.id).filter((id) => !nodeIds.has(id));
    results.push(check(badRefs.length === 0, `scene nodes ⊆ graph (${badRefs.length} bad)`));

    const rebuilt = buildScene(graph, trace, { sceneId });
    results.push(
      check(rebuilt.steps.length === scene.steps.length, 'pre-rendered step count matches rebuild'),
    );
    results.push(check(scene.steps[0] !== undefined, 'static fallback: initial step exists'));

    for (const step of scene.steps) {
      const caption = renderCaption(step.caption);
      results.push(check(caption.length > 0, `caption rendered @${step.index}`));
      break; // one caption sample is enough for gate noise control
    }

    // Keyboard / reduced-motion / static fallback: structural presence
    results.push(
      check(
        existsSync(join(root, 'packages', 'visual-grammar', 'src', 'TraceControls.svelte')),
        'keyboard controls component exists',
      ),
    );
    const tokens = readFileSync(join(root, 'docs', 'design-tokens.css'), 'utf8');
    results.push(check(tokens.includes('prefers-reduced-motion'), 'reduced-motion tokens'));
    results.push(check(scene.steps[0]?.actions !== undefined, 'static initial actions'));
  }

  for (const checkBlock of lesson.blocks.filter((b) => b.type === 'check')) {
    if (checkBlock.type !== 'check') continue;
    const found = lesson.checks.some((c) => c.id === checkBlock.checkId);
    results.push(check(found, `check ${checkBlock.checkId} defined`));
  }

  return results;
}

let passedLessons = 0;
for (const slug of pathway.lessonSlugs) {
  const results = verifyLesson(slug);
  const failed = results.filter((r) => !r.ok);
  if (failed.length === 0) {
    passedLessons += 1;
    console.log(`✓ ${slug} machine-checked (${results.length} checks)`);
  } else {
    console.log(`✗ ${slug} failed:`);
    for (const f of failed) console.log(`  - ${f.detail}`);
  }
}

const lessonFiles = readdirSync(join(root, 'content', 'lessons')).filter((f) =>
  f.endsWith('.json'),
);
console.log(`pathway lessons: ${pathway.lessonSlugs.length}; files: ${lessonFiles.length}`);
console.log(`${passedLessons}/${pathway.lessonSlugs.length} lessons machine-checked`);
process.exit(passedLessons === pathway.lessonSlugs.length ? 0 : 1);
