import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPyodide } from 'pyodide';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const fixtures = ['accumulate', 'count', 'filter', 'transform', 'search', 'guard'];

const pyodide = await loadPyodide();

async function mountPackage(relativeParts, moduleName) {
  const base = path.join(root, ...relativeParts);
  const files = await fs.readdir(base, { withFileTypes: true });
  pyodide.FS.mkdirTree(`/app/${moduleName}`);
  for (const file of files) {
    if (file.isFile() && file.name.endsWith('.py')) {
      const content = await fs.readFile(path.join(base, file.name), 'utf8');
      pyodide.FS.writeFile(`/app/${moduleName}/${file.name}`, content);
    }
  }
}

await mountPackage(['packages', 'analyzer-python', 'src', 'lol_analyzer'], 'lol_analyzer');
await mountPackage(['packages', 'trace-runtime', 'src', 'lol_trace'], 'lol_trace');

await pyodide.runPythonAsync(`
import sys
sys.path.insert(0, "/app")
from lol_analyzer import analyze_source
from lol_trace import run_trace, canonical_json
`);

let matched = 0;

for (const fixture of fixtures) {
  const source = await fs.readFile(path.join(root, 'fixtures', fixture, 'source.py'), 'utf8');
  const expected = JSON.parse(await fs.readFile(
    path.join(root, 'fixtures', fixture, 'expected.trace.json'),
    'utf8',
  ));
  const call = JSON.parse(await fs.readFile(path.join(root, 'fixtures', fixture, 'call.json'), 'utf8'));
  const escapedSource = JSON.stringify(source.trimEnd());
  const escapedArgs = JSON.stringify(call.argsRepr);
  const actual = await pyodide.runPythonAsync(`
graph = analyze_source(${escapedSource})
canonical_json(run_trace(${escapedSource}, graph, ${escapedArgs}))
`);
  if (JSON.stringify(JSON.parse(actual)) !== JSON.stringify(expected)) {
    throw new Error(`Pyodide trace mismatch for ${fixture}`);
  }
  matched += 1;
}

globalThis.console.log(`${matched}/6 fixture traces byte-identical`);
