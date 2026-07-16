import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPyodide } from 'pyodide';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const fixtures = ['accumulate', 'count', 'filter', 'transform', 'search', 'guard'];

const pyodide = await loadPyodide();

const analyzerSource = await fs.readFile(
  path.join(root, 'packages', 'analyzer-python', 'src', 'lol_analyzer', 'analyzer.py'),
  'utf8',
);
const initSource = await fs.readFile(
  path.join(root, 'packages', 'analyzer-python', 'src', 'lol_analyzer', '__init__.py'),
  'utf8',
);

pyodide.FS.mkdirTree('/app/lol_analyzer');
pyodide.FS.writeFile('/app/lol_analyzer/analyzer.py', analyzerSource);
pyodide.FS.writeFile('/app/lol_analyzer/__init__.py', initSource);
await pyodide.runPythonAsync(`
import sys
sys.path.insert(0, "/app")
`);

let matched = 0;

for (const fixture of fixtures) {
  const source = await fs.readFile(path.join(root, 'fixtures', fixture, 'source.py'), 'utf8');
  const expected = JSON.parse(await fs.readFile(
    path.join(root, 'fixtures', fixture, 'expected.graph.json'),
    'utf8',
  ));
  const escaped = JSON.stringify(source.trimEnd());
  const actual = await pyodide.runPythonAsync(`
from lol_analyzer import analyze_source, canonical_json
canonical_json(analyze_source(${escaped}))
`);
  if (JSON.stringify(JSON.parse(actual)) !== JSON.stringify(expected)) {
    throw new Error(`Pyodide mismatch for ${fixture}`);
  }
  matched += 1;
}

globalThis.console.log(`${matched}/6 fixtures byte-identical`);
