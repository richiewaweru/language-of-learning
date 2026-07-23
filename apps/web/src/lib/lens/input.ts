export function parseLensArgs(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const args: string[] = [];
  let start = 0;
  let depth = 0;
  let quote = '';
  let escaped = false;

  for (let index = 0; index < trimmed.length; index += 1) {
    const character = trimmed[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = '';
      continue;
    }
    if (character === '"' || character === "'") quote = character;
    else if ('([{'.includes(character)) depth += 1;
    else if (')]}'.includes(character)) depth = Math.max(0, depth - 1);
    else if (character === ',' && depth === 0) {
      args.push(trimmed.slice(start, index).trim());
      start = index + 1;
    }
  }
  args.push(trimmed.slice(start).trim());
  return args.filter(Boolean);
}

export function sourceHasModuleEntry(source: string): boolean {
  const topLevel = source
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() && !line.trimStart().startsWith('#'))
    .filter((line) => !/^\s/.test(line));

  if (topLevel.length === 0) return true;
  return topLevel.some(
    (line) =>
      !line.startsWith('def ') &&
      !line.startsWith('async def ') &&
      !line.startsWith('@'),
  );
}
