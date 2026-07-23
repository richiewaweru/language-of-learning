import type {
  LensSessionKind,
  LensSessionPersistence,
  LensSessionSnapshot,
} from '@lol/lens-contracts';

const STORAGE_SCHEMA_VERSION = 'v1';

function safeSegment(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed || !/^[a-zA-Z0-9._-]+$/.test(trimmed)) {
    throw new Error(`Invalid ${label} storage-key segment: ${value}`);
  }
  return trimmed;
}

export function lensSessionStorageKey(input: {
  kind: LensSessionKind;
  ownerId: string;
  sessionId?: string;
}): string {
  const ownerId = safeSegment(input.ownerId, 'ownerId');
  const sessionId = input.sessionId
    ? `:${safeSegment(input.sessionId, 'sessionId')}`
    : '';
  return `lens:${STORAGE_SCHEMA_VERSION}:${input.kind}:${ownerId}${sessionId}`;
}

export const noOpLensPersistence: LensSessionPersistence = {
  async load() {
    return null;
  },
  async save() {},
  async remove() {},
};

export function createBrowserLensPersistence(
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>,
): LensSessionPersistence {
  return {
    async load(key) {
      const raw = storage.getItem(key);
      if (!raw) return null;
      try {
        const value = JSON.parse(raw) as Partial<LensSessionSnapshot>;
        if (
          value.schemaVersion !== 1 ||
          typeof value.id !== 'string' ||
          typeof value.source !== 'string' ||
          typeof value.argsText !== 'string' ||
          typeof value.activeView !== 'string' ||
          !value.selection ||
          typeof value.updatedAt !== 'string'
        ) {
          return null;
        }
        return value as LensSessionSnapshot;
      } catch {
        return null;
      }
    },
    async save(key, session) {
      storage.setItem(key, JSON.stringify(session));
    },
    async remove(key) {
      storage.removeItem(key);
    },
  };
}
