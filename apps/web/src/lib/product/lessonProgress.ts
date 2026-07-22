const STORAGE_KEY = 'lol-lesson-progress';

export type LessonProgress = {
  completedSections: string[];
  predictions: Record<string, boolean>;
  transfers: Record<string, boolean>;
};

type TrackableBlock = {
  type: string;
  questions?: Array<{ id: string }>;
};

export type ProgressLesson = {
  slug: string;
  blocks: TrackableBlock[];
};

export type PathwayProgressSummary = {
  completedSlugs: string[];
  completedLessons: number;
  totalLessons: number;
  percent: number;
  currentSlug?: string;
};

export function loadProgress(lessonSlug: string): LessonProgress {
  if (typeof localStorage === 'undefined') {
    return { completedSections: [], predictions: {}, transfers: {} };
  }
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}:${lessonSlug}`);
    if (!raw) return { completedSections: [], predictions: {}, transfers: {} };
    return JSON.parse(raw) as LessonProgress;
  } catch {
    return { completedSections: [], predictions: {}, transfers: {} };
  }
}

export function saveProgress(lessonSlug: string, progress: LessonProgress): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(`${STORAGE_KEY}:${lessonSlug}`, JSON.stringify(progress));
}

export function markSectionComplete(lessonSlug: string, sectionId: string): LessonProgress {
  const progress = loadProgress(lessonSlug);
  if (!progress.completedSections.includes(sectionId)) {
    progress.completedSections.push(sectionId);
  }
  saveProgress(lessonSlug, progress);
  return progress;
}

export function requiredSectionIds(blocks: TrackableBlock[]): string[] {
  return blocks.flatMap((block, index) => {
    if (block.type === 'prediction') return [`prediction-${index}`];
    if (block.type === 'transferCheck') {
      return (block.questions ?? []).map((question) => `transfer-${question.id}`);
    }
    return [];
  });
}

export function isLessonComplete(blocks: TrackableBlock[], progress: LessonProgress): boolean {
  const required = requiredSectionIds(blocks);
  if (required.length === 0) return false;
  return required.every(
    (sectionId) =>
      progress.completedSections.includes(sectionId) ||
      (sectionId.startsWith('prediction-') && progress.completedSections.includes('prediction')),
  );
}

export function summarizePathwayProgress(
  lessons: ProgressLesson[],
  progressFor: (slug: string) => LessonProgress = loadProgress,
): PathwayProgressSummary {
  const completedSlugs = lessons
    .filter((lesson) => isLessonComplete(lesson.blocks, progressFor(lesson.slug)))
    .map((lesson) => lesson.slug);
  const completed = new Set(completedSlugs);
  const totalLessons = lessons.length;
  return {
    completedSlugs,
    completedLessons: completedSlugs.length,
    totalLessons,
    percent: totalLessons === 0 ? 0 : Math.round((completedSlugs.length / totalLessons) * 100),
    currentSlug: lessons.find((lesson) => !completed.has(lesson.slug))?.slug,
  };
}
