import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { assertRepoRoot, repoRoot } from '$lib/repoRoot';

export type PathwayModule = {
  title: string;
  summary: string;
  lessonSlugs: string[];
};

export type PathwayModules = {
  pathwaySlug: string;
  modules: Record<string, PathwayModule>;
};

export async function loadPathwayModules(pathwaySlug: string): Promise<PathwayModules | null> {
  const file = path.join(
    assertRepoRoot(repoRoot),
    'content',
    'pathway-modules',
    `${pathwaySlug}.json`,
  );
  try {
    const raw = await readFile(file, 'utf8');
    return JSON.parse(raw) as PathwayModules;
  } catch {
    return null;
  }
}

export function lessonPath(
  pathwaySlug: string,
  lessonSlug: string,
  moduleSlug?: string,
): string {
  if (moduleSlug) {
    return `/learn/${pathwaySlug}/${moduleSlug}/${lessonSlug}`;
  }
  return `/learn/${pathwaySlug}/${lessonSlug}`;
}
