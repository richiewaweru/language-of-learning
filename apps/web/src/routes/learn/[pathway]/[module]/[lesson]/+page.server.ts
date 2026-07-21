import { loadPathway, loadLesson } from '$lib/content';
import { loadPathwayModules } from '$lib/pathwayModules';
import { loadVariationPack } from '$lib/product/loadVariationPack';
import { error } from '@sveltejs/kit';
import { renderCaption } from '@lol/lens-scenes';
import type { DemoPack } from '$lib/product/loadDemoPack';
import type { VariationPack } from '$lib/product/loadVariationPack';
import { loadScene, loadExample } from '$lib/content';

export async function load({
  params,
}: {
  params: { pathway: string; module: string; lesson: string };
}) {
  try {
    const modules = await loadPathwayModules(params.pathway);
    const moduleDef = modules?.modules[params.module];
    if (!moduleDef || !moduleDef.lessonSlugs.includes(params.lesson)) {
      error(404, 'Lesson not in module');
    }

    const pathway = await loadPathway(params.pathway);
    if (!pathway.lessonSlugs.includes(params.lesson)) {
      error(404, 'Lesson not in pathway');
    }

    const lesson = await loadLesson(params.lesson);
    const idx = moduleDef.lessonSlugs.indexOf(params.lesson);
    const prevSlug = idx > 0 ? moduleDef.lessonSlugs[idx - 1] : null;
    const nextSlug =
      idx < moduleDef.lessonSlugs.length - 1 ? moduleDef.lessonSlugs[idx + 1] : null;

    const sceneBlocks: Array<{
      sceneId: string;
      scene: Awaited<ReturnType<typeof loadScene>>;
      example: Awaited<ReturnType<typeof loadExample>>;
      initialCaption: string;
    }> = [];

    const executionPacks: Record<string, DemoPack> = {};
    const variationPacks: Record<string, VariationPack> = {};

    for (const block of lesson.blocks) {
      if (
        block.type === 'scene' ||
        block.type === 'staticPreview' ||
        block.type === 'execution'
      ) {
        const sceneId = block.sceneId;
        if (sceneId && !sceneBlocks.some((s) => s.sceneId === sceneId)) {
          const scene = await loadScene(sceneId);
          const example = await loadExample(sceneId);
          const initialCaption = scene.steps[0] ? renderCaption(scene.steps[0].caption) : '';
          sceneBlocks.push({ sceneId, scene, example, initialCaption });
        }
      }
      if (block.type === 'execution') {
        const example = await loadExample(block.sceneId);
        executionPacks[block.sceneId] = {
          id: block.sceneId,
          title: lesson.title,
          source: example.source,
          argsRepr: example.argsRepr,
          graph: example.graph,
          trace: example.trace,
          scene: await loadScene(block.sceneId),
        };
      }
      if (block.type === 'variation' || block.type === 'transferCheck') {
        const vid = block.variationId;
        if (!variationPacks[vid]) {
          variationPacks[vid] = loadVariationPack(vid);
        }
      }
    }

  const patternBlock = lesson.blocks.find((b) => b.type === 'patternExplanation');
  const predictionBlock = lesson.blocks.find((b) => b.type === 'prediction');
  const summaryBlock = lesson.blocks.find((b) => b.type === 'summary');

    return {
      pathway,
      module: moduleDef,
      moduleSlug: params.module,
      lesson,
      sceneBlocks,
      executionPacks,
      variationPacks,
      prevSlug,
      nextSlug,
      lessonIndex: idx + 1,
      lessonCount: moduleDef.lessonSlugs.length,
      patternSteps: patternBlock?.type === 'patternExplanation' ? patternBlock.steps : [],
      predictionBlock: predictionBlock?.type === 'prediction' ? predictionBlock : null,
      summaryBlock: summaryBlock?.type === 'summary' ? summaryBlock : null,
      flagshipPack: executionPacks['scene-accumulate'] ?? Object.values(executionPacks)[0],
    };
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) throw err;
    error(404, 'Lesson not found');
  }
}
