import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  PilotExportSchema,
  stableStringify,
  type PilotExport,
} from '@lol/lens-contracts';

export type ValidationResult = {
  file?: string;
  valid: boolean;
  errors: string[];
  data?: PilotExport;
};

function stableContent(data: PilotExport) {
  return {
    schemaVersion: data.schemaVersion,
    study: data.study,
    participantCode: data.participantCode,
    lessonVersions: data.lessonVersions,
    attempts: data.attempts,
    events: data.events,
    summaries: data.summaries,
    integrity: data.integrity,
  };
}

export function pilotContentHash(data: PilotExport): string {
  return createHash('sha256')
    .update(stableStringify(stableContent(data)))
    .digest('hex');
}

function findForbiddenKeys(value: unknown, prefix = ''): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findForbiddenKeys(item, `${prefix}[${index}]`));
  }
  if (!value || typeof value !== 'object') return [];
  const found: string[] = [];
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    const location = prefix ? `${prefix}.${key}` : key;
    if (['source', 'sourceText', 'sourceCode', 'code'].includes(key)) found.push(location);
    found.push(...findForbiddenKeys(item, location));
  }
  return found;
}

export function validatePilotExport(value: unknown): ValidationResult {
  const parsed = PilotExportSchema.safeParse(value);
  if (!parsed.success) {
    return {
      valid: false,
      errors: parsed.error.issues.map((issue) =>
        `${issue.path.join('.') || 'export'}: ${issue.message}`),
    };
  }
  const data = parsed.data;
  const errors: string[] = [];
  if (data.participantCode !== data.study.participantCode) {
    errors.push('Export participant does not match study participant.');
  }
  if (data.integrity.storageDegraded) {
    errors.push('Export reports degraded storage.');
  }
  if (data.integrity.eventCount !== data.events.length) {
    errors.push('Integrity event count does not match events.');
  }
  if ((data.events[0]?.timestamp ?? null) !== data.integrity.firstEventAt) {
    errors.push('First-event timestamp does not match event bounds.');
  }
  if ((data.events.at(-1)?.timestamp ?? null) !== data.integrity.lastEventAt) {
    errors.push('Last-event timestamp does not match event bounds.');
  }
  if (pilotContentHash(data) !== data.contentHash) {
    errors.push('Content hash does not match canonical export content.');
  }
  const consentTime = Date.parse(data.study.consentAcknowledgedAt);
  const byAttempt = new Map<string, number[]>();
  const versions: Record<string, string[]> = {};
  for (const event of data.events) {
    if (
      event.participantCode !== data.study.participantCode
      || event.studyId !== data.study.studyId
      || event.studyVersion !== data.study.studyVersion
      || event.conditionId !== data.study.conditionId
      || event.releaseId !== data.study.releaseId
      || event.facilitatorSessionId !== data.study.facilitatorSessionId
      || event.consentAcknowledgedAt !== data.study.consentAcknowledgedAt
    ) {
      errors.push(`Event ${event.eventId} has mismatched study identity.`);
    }
    if (Date.parse(event.timestamp) < consentTime) {
      errors.push(`Event ${event.eventId} predates consent.`);
    }
    byAttempt.set(event.attemptId, [...(byAttempt.get(event.attemptId) ?? []), event.sequence]);
    versions[event.lessonId] = [
      ...new Set([...(versions[event.lessonId] ?? []), event.lessonVersion]),
    ].sort();
  }
  for (const [attemptId, sequences] of byAttempt) {
    const expected = Array.from({ length: sequences.length }, (_, index) => index + 1);
    if (sequences.some((sequence, index) => sequence !== expected[index])) {
      errors.push(`Attempt ${attemptId} does not have contiguous ordered sequences.`);
    }
  }
  if (stableStringify(versions) !== stableStringify(data.lessonVersions)) {
    errors.push('Lesson-version metadata is incomplete or inconsistent.');
  }
  const attempts = new Set(data.attempts.map((attempt) => attempt.attemptId));
  if (attempts.size !== byAttempt.size || [...byAttempt.keys()].some((id) => !attempts.has(id))) {
    errors.push('Attempt metadata does not match event attempts.');
  }
  const forbidden = findForbiddenKeys(data.events);
  if (forbidden.length) {
    errors.push(`Source-like fields are forbidden in events: ${forbidden.join(', ')}.`);
  }
  return { valid: errors.length === 0, errors, data };
}

export async function collectJsonFiles(targets: string[]): Promise<string[]> {
  const files: string[] = [];
  for (const target of targets) {
    const resolved = path.resolve(target);
    const info = await stat(resolved);
    if (info.isDirectory()) {
      const names = await readdir(resolved);
      files.push(...names.filter((name) => name.endsWith('.json'))
        .map((name) => path.join(resolved, name)));
    } else {
      files.push(resolved);
    }
  }
  return files.sort();
}

export async function validateFiles(targets: string[]): Promise<ValidationResult[]> {
  const files = await collectJsonFiles(targets);
  return Promise.all(files.map(async (file) => {
    try {
      const result = validatePilotExport(JSON.parse(await readFile(file, 'utf8')));
      return { ...result, file };
    } catch (error) {
      return {
        file,
        valid: false,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }));
}

async function main() {
  const targets = process.argv.slice(2);
  if (!targets.length) {
    console.error('Usage: pnpm pilot:validate -- <export.json|directory> [...]');
    process.exitCode = 2;
    return;
  }
  const results = await validateFiles(targets);
  if (!results.length) {
    console.error('No JSON exports found.');
    process.exitCode = 2;
    return;
  }
  for (const result of results) {
    console.log(`${result.valid ? 'PASS' : 'FAIL'} ${result.file}`);
    for (const error of result.errors) console.error(`  - ${error}`);
  }
  if (results.some((result) => !result.valid)) process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  void main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
