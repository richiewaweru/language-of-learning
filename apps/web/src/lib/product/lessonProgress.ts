const STORAGE_KEY = 'lol-lesson-progress';

export type LessonProgress = {
  completedSections: string[];
  predictions: Record<string, boolean>;
  transfers: Record<string, boolean>;
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
