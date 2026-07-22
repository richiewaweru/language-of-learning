import {
  SymbolManifestSchema,
  type SymbolManifest,
  type SymbolManifestEntry,
} from '@lol/lens-contracts';
import manifestJson from '../../../docs/structural-code-lens/v1/04_SYMBOL_MANIFEST.json';

export type SymbolRendererName =
  | 'ValueToken'
  | 'BindingTag'
  | 'CollectionFrame'
  | 'StateCell'
  | 'CursorSymbol'
  | 'RangeSymbol'
  | 'LoopFrame'
  | 'ComparisonSymbol'
  | 'BranchFork'
  | 'MutationSymbol'
  | 'FunctionBoundary'
  | 'ReferenceSymbol'
  | 'ReturnPort'
  | 'EffectPulse'
  | 'GenericOperationSymbol'
  | 'UnsupportedRegion';

export type SymbolDefinition = {
  metadata: SymbolManifestEntry;
  renderers: Partial<Record<'flow' | 'state' | 'trace', SymbolRendererName>>;
};

export const symbolManifest: SymbolManifest = SymbolManifestSchema.parse(manifestJson);

const rendererRegistrations: Record<string, SymbolDefinition['renderers']> = {
  value: { flow: 'ValueToken', state: 'ValueToken' },
  binding: { flow: 'BindingTag', state: 'BindingTag', trace: 'BindingTag' },
  collection: { flow: 'CollectionFrame', state: 'CollectionFrame' },
  state: { flow: 'StateCell', state: 'StateCell', trace: 'StateCell' },
  cursor: { flow: 'CursorSymbol', state: 'CursorSymbol', trace: 'CursorSymbol' },
  range: { flow: 'RangeSymbol', state: 'RangeSymbol', trace: 'RangeSymbol' },
  loop: { flow: 'LoopFrame', trace: 'LoopFrame' },
  comparison: { flow: 'ComparisonSymbol', trace: 'ComparisonSymbol' },
  branch: { flow: 'BranchFork', trace: 'BranchFork' },
  mutation: { flow: 'MutationSymbol', state: 'MutationSymbol', trace: 'MutationSymbol' },
  'call-frame': { flow: 'FunctionBoundary', state: 'FunctionBoundary', trace: 'FunctionBoundary' },
  reference: { flow: 'ReferenceSymbol', state: 'ReferenceSymbol', trace: 'ReferenceSymbol' },
  return: { flow: 'ReturnPort', state: 'ReturnPort', trace: 'ReturnPort' },
  effect: { flow: 'EffectPulse', trace: 'EffectPulse' },
  'generic-operation': { flow: 'GenericOperationSymbol', trace: 'GenericOperationSymbol' },
  unsupported: { flow: 'UnsupportedRegion', state: 'UnsupportedRegion', trace: 'UnsupportedRegion' },
};

export const symbolRegistry = new Map<string, SymbolDefinition>(
  symbolManifest.symbols.map((metadata) => [
    metadata.id,
    { metadata, renderers: rendererRegistrations[metadata.id] ?? {} },
  ]),
);

export type SymbolResolution = {
  requestedId: string;
  resolvedId: string;
  kind: 'exact' | 'composition' | 'generic' | 'unsupported';
  definition: SymbolDefinition;
};

export function resolveSymbol(
  requestedId: string,
  options: { compatible?: string[]; behaviorVerified?: boolean } = {},
): SymbolResolution {
  const exact = symbolRegistry.get(requestedId);
  if (exact) return { requestedId, resolvedId: requestedId, kind: 'exact', definition: exact };

  for (const compatibleId of options.compatible ?? []) {
    const compatible = symbolRegistry.get(compatibleId);
    if (compatible) {
      return {
        requestedId,
        resolvedId: compatibleId,
        kind: 'composition',
        definition: compatible,
      };
    }
  }

  const fallbackId = options.behaviorVerified === false ? 'unsupported' : 'generic-operation';
  const fallback = symbolRegistry.get(fallbackId);
  if (!fallback) throw new Error('Missing required symbol fallback: ' + fallbackId);
  return {
    requestedId,
    resolvedId: fallbackId,
    kind: fallbackId === 'unsupported' ? 'unsupported' : 'generic',
    definition: fallback,
  };
}

export function symbolIdForSemantic(
  roleOrEvent: string,
): string {
  const aliases: Record<string, string> = {
    'call-frame': 'call-frame',
    result: 'return',
    generic: 'generic-operation',
    select: 'cursor',
    compare: 'comparison',
    update: 'mutation',
    insert: 'mutation',
    swap: 'mutation',
    calculate: 'generic-operation',
    call: 'call-frame',
    exit: 'loop',
    skip: 'loop',
  };
  return aliases[roleOrEvent] ?? roleOrEvent;
}
