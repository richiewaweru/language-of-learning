import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { AttemptSummary, PilotExport } from '@lol/lens-contracts';
import { validateFiles } from './validate';

function csvCell(value: unknown) {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function csv(headers: string[], rows: Array<Record<string, unknown>>) {
  return [
    headers.map(csvCell).join(','),
    ...rows.map((row) => headers.map((header) => csvCell(row[header] ?? '')).join(',')),
  ].join('\n') + '\n';
}

export function buildAnalysis(exports: PilotExport[]) {
  const participantRows = exports.map((item) => ({
    participantCode: item.participantCode,
    studyVersion: item.study.studyVersion,
    conditionId: item.study.conditionId,
    attemptCount: item.summaries.length,
    completedAttempts: item.summaries.filter((summary) => summary.completedAt).length,
    preTransferCorrect: item.summaries.filter((summary) => summary.preTransferCorrect === true).length,
    postTransferCorrect: item.summaries.filter((summary) => summary.postTransferCorrect === true).length,
    successfulBuilds: item.summaries.filter((summary) => summary.buildSuccess).length,
    interventions: item.summaries.reduce((sum, summary) => sum + summary.interventionCount, 0),
  }));
  const attemptRows = exports.flatMap((item) => item.summaries.map((summary) => ({
    participantCode: item.participantCode,
    ...summary,
    viewsUsed: summary.viewsUsed.join('|'),
    failedCriteriaCounts: JSON.stringify(summary.failedCriteriaCounts),
  })));
  const criteria = new Map<string, number>();
  for (const row of attemptRows) {
    const counts = JSON.parse(String(row.failedCriteriaCounts)) as Record<string, number>;
    for (const [criterion, count] of Object.entries(counts)) {
      criteria.set(criterion, (criteria.get(criterion) ?? 0) + count);
    }
  }
  const criterionRows = [...criteria.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([criterion, count]) => ({ criterion, count }));
  return { participantRows, attemptRows, criterionRows };
}

const attemptHeaders: Array<keyof AttemptSummary | 'participantCode'> = [
  'participantCode',
  'attemptId',
  'lessonId',
  'lessonVersion',
  'startedAt',
  'completedAt',
  'firstPredictionCorrect',
  'finalPredictionCorrect',
  'buildSuccess',
  'buildSubmissionCount',
  'failedCriteriaCounts',
  'retryCount',
  'interventionCount',
  'framesVisited',
  'viewsUsed',
  'variationCount',
  'wallClockDurationMs',
  'activeDurationMs',
  'timeToFirstPredictionMs',
  'predictionToRevealMs',
  'guidedDurationMs',
  'timeToBuildSuccessMs',
  'preTransferCorrect',
  'postTransferCorrect',
];

async function main() {
  const args = process.argv.slice(2);
  const outIndex = args.indexOf('--out');
  const outDir = outIndex >= 0 ? args[outIndex + 1] : null;
  const targets = outIndex >= 0 ? args.slice(0, outIndex) : args;
  if (!targets.length || !outDir) {
    console.error('Usage: pnpm pilot:analyze -- <input-directory> --out <output-directory>');
    process.exitCode = 2;
    return;
  }
  const results = await validateFiles(targets);
  const invalid = results.filter((result) => !result.valid);
  if (invalid.length) {
    for (const result of invalid) {
      console.error(`Invalid export ${result.file}: ${result.errors.join('; ')}`);
    }
    process.exitCode = 1;
    return;
  }
  const exports = results.flatMap((result) => result.data ? [result.data] : []);
  const analysis = buildAnalysis(exports);
  const resolvedOut = path.resolve(outDir);
  await mkdir(resolvedOut, { recursive: true });
  await Promise.all([
    writeFile(path.join(resolvedOut, 'participants.csv'), csv(
      ['participantCode', 'studyVersion', 'conditionId', 'attemptCount', 'completedAttempts',
        'preTransferCorrect', 'postTransferCorrect', 'successfulBuilds', 'interventions'],
      analysis.participantRows,
    )),
    writeFile(path.join(resolvedOut, 'attempts.csv'), csv(
      attemptHeaders,
      analysis.attemptRows,
    )),
    writeFile(path.join(resolvedOut, 'failed-criteria.csv'), csv(
      ['criterion', 'count'],
      analysis.criterionRows,
    )),
    writeFile(path.join(resolvedOut, 'findings.md'), `# Phase 6 Pilot Findings

Generated from ${exports.length} validated participant export(s).

## Evidence summary

- Report participant-level counts and changes only; do not make significance or effectiveness claims.
- Review \`participants.csv\`, \`attempts.csv\`, and \`failed-criteria.csv\`.

## Lesson-by-lesson findings

| Lesson | Event evidence | Observation/interview evidence | Diagnosis | Revision decision |
| --- | --- | --- | --- | --- |
| Values and Variables | TODO | TODO | TODO | TODO |
| Functions and Return Values | TODO | TODO | TODO | TODO |
| Conditions and Branches | TODO | TODO | TODO | TODO |
| Loops over Lists | TODO | TODO | TODO | TODO |

## Triangulation

Record findings only when at least two sources align: events, transfer, Build, observation notes, or interview response.

## Limitations

- Small controlled pilot; counts are descriptive.
- Browser-local evidence may be incomplete when a session reports storage degradation.
- Facilitator intervention can affect independent-completion interpretation.

## Exit decision

Choose one: revise and rerun / proceed cautiously / stop expansion.
`),
  ]);
  console.log(`Wrote Phase 6 analysis artifacts to ${resolvedOut}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  void main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
