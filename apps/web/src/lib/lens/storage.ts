import type { LensSessionKind, LensSessionPersistence } from '@lol/lens-contracts';
import {
  createSafeStorage,
  type SafeStorage,
  type StorageLike,
} from '../storage/safe-storage';

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
  input: StorageLike | SafeStorage,
): LensSessionPersistence {
  const storage = 'readJson' in input ? input : createSafeStorage(input);
  return {
    async load(key) {
      const result = storage.readJson(key, (value) => value);
      if (result.ok) return result.value;
      if (result.kind === 'malformed') return { malformed: true };
      throw new Error(result.message);
    },
    async save(key, session) {
      const result = storage.writeJson(key, session);
      if (!result.ok) throw new Error(result.message);
    },
    async remove(key) {
      const result = storage.remove(key);
      if (!result.ok) throw new Error(result.message);
    },
  };
}
