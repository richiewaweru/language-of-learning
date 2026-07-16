import { loadPathway, loadLesson, loadScene, loadExample } from '$lib/content';
import { error } from '@sveltejs/kit';
import { renderCaption } from '@lol/lens-scenes';

export async function load({ params }: { params: { pathway: string; lesson: string } }) {
  try {
    const pathway = await loadPathway(params.pathway);
    if (!pathway.lessonSlugs.includes(params.lesson)) {
      error(404, 'Lesson not in pathway');
    }
    const lesson = await loadLesson(params.lesson);
    const idx = pathway.lessonSlugs.indexOf(params.lesson);
    const prevSlug = idx > 0 ? pathway.lessonSlugs[idx - 1] : null;
    const nextSlug = idx < pathway.lessonSlugs.length - 1 ? pathway.lessonSlugs[idx + 1] : null;

    const sceneBlocks = [];
    for (const block of lesson.blocks) {
      if (block.type !== 'scene') continue;
      const scene = await loadScene(block.sceneId);
      const example = await loadExample(block.sceneId);
      const initialCaption = scene.steps[0]
        ? renderCaption(scene.steps[0].caption)
        : '';
      sceneBlocks.push({
        sceneId: block.sceneId,
        scene,
        example,
        initialCaption,
      });
    }

    return {
      pathway,
      lesson,
      sceneBlocks,
      prevSlug,
      nextSlug,
      lessonIndex: idx + 1,
      lessonCount: pathway.lessonSlugs.length,
    };
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) throw err;
    error(404, 'Lesson not found');
  }
}
