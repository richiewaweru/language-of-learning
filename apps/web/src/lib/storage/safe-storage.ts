export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type SafeStorageFailure = {
  ok: false;
  kind: 'unavailable' | 'malformed';
  message: string;
};

export type SafeStorageResult<T> =
  | { ok: true; value: T }
  | SafeStorageFailure;

export type SafeStorage = {
  readText(key: string): SafeStorageResult<string | null>;
  readJson<T>(key: string, parse: (value: unknown) => T): SafeStorageResult<T | null>;
  writeText(key: string, value: string): SafeStorageResult<void>;
  writeJson(key: string, value: unknown): SafeStorageResult<void>;
  remove(key: string): SafeStorageResult<void>;
};

function message(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function createSafeStorage(storage: StorageLike | null): SafeStorage {
  return {
    readText(key) {
      if (!storage) {
        return { ok: false, kind: 'unavailable', message: 'Browser storage is unavailable.' };
      }
      try {
        return { ok: true, value: storage.getItem(key) };
      } catch (error) {
        return {
          ok: false,
          kind: 'unavailable',
          message: `Browser storage could not be read: ${message(error)}`,
        };
      }
    },
    readJson(key, parse) {
      const stored = this.readText(key);
      if (!stored.ok || stored.value === null) return stored;
      try {
        return { ok: true, value: parse(JSON.parse(stored.value)) };
      } catch (error) {
        return {
          ok: false,
          kind: 'malformed',
          message: `Saved data is malformed or incompatible: ${message(error)}`,
        };
      }
    },
    writeText(key, value) {
      if (!storage) {
        return { ok: false, kind: 'unavailable', message: 'Browser storage is unavailable.' };
      }
      try {
        storage.setItem(key, value);
        return { ok: true, value: undefined };
      } catch (error) {
        return {
          ok: false,
          kind: 'unavailable',
          message: `Browser storage could not be written: ${message(error)}`,
        };
      }
    },
    writeJson(key, value) {
      try {
        return this.writeText(key, JSON.stringify(value));
      } catch (error) {
        return {
          ok: false,
          kind: 'unavailable',
          message: `Saved data could not be serialized: ${message(error)}`,
        };
      }
    },
    remove(key) {
      if (!storage) {
        return { ok: false, kind: 'unavailable', message: 'Browser storage is unavailable.' };
      }
      try {
        storage.removeItem(key);
        return { ok: true, value: undefined };
      } catch (error) {
        return {
          ok: false,
          kind: 'unavailable',
          message: `Saved data could not be removed: ${message(error)}`,
        };
      }
    },
  };
}

export function browserSafeStorage(target: Window): SafeStorage {
  try {
    return createSafeStorage(target.localStorage);
  } catch {
    return createSafeStorage(null);
  }
}
