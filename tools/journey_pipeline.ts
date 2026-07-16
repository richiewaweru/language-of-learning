import { readFileSync } from 'node:fs';
import { detectPattern } from '../packages/lens-patterns/src/index.ts';
import {
  buildScene,
  buildTransferCheck,
  gradeTransferCheck,
} from '../packages/lens-scenes/src/index.ts';

const path = process.argv[2];
if (!path) {
  console.error('usage: tsx tools/journey_pipeline.ts <analyze.json>');
  process.exit(1);
}

const { graph, trace } = JSON.parse(readFileSync(path, 'utf8'));
const pattern = detectPattern(graph);
const scene = buildScene(graph, trace);
const transfer = buildTransferCheck(graph);
const grade = transfer
  ? gradeTransferCheck(transfer, transfer.answerLine)
  : { correct: false };

const out = {
  pattern: pattern?.pattern ?? null,
  sceneSteps: scene.steps.length,
  transferLine: transfer?.answerLine ?? null,
  transferOk: grade.correct === true,
};
console.log(JSON.stringify(out));
