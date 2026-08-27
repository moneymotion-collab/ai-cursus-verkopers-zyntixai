import {
  DATA_INTAKE_STORAGE_BUCKET,
  DATA_INTAKE_SIGNED_READ_TTL_SECONDS,
} from "@/features/data-intake/domain/constants";
import {
  dataFail,
  dataOk,
  type DataIntakeResult,
} from "@/features/data-intake/domain/errors";
import { parseDataIntakeStoragePath } from "@/features/data-intake/domain/storage-path";
import type { DataIntakeObjectStore } from "@/features/data-intake/server/source-object-store";

export type MemoryStoredObject = {
  bucket: string;
  path: string;
  bytes: Uint8Array;
};

function objectKey(bucket: string, path: string): string {
  return `${bucket}::${path}`;
}

export function createMemoryDataIntakeObjectStore(
  records: Map<string, MemoryStoredObject> = new Map(),
): DataIntakeObjectStore & { records: Map<string, MemoryStoredObject> } {
  const store: DataIntakeObjectStore = {
    async putObject(input) {
      if (input.bucket !== DATA_INTAKE_STORAGE_BUCKET) {
        return dataFail("SOURCE_INVALID", "Unexpected storage bucket");
      }
      if (!parseDataIntakeStoragePath(input.path)) {
        return dataFail("SOURCE_INVALID", "Storage path is not a canonical DATA object key");
      }
      const key = objectKey(input.bucket, input.path);
      if (records.has(key)) {
        return dataOk({ created: false });
      }
      records.set(key, {
        bucket: input.bucket,
        path: input.path,
        bytes: new Uint8Array(input.bytes),
      });
      return dataOk({ created: true });
    },

    async getObject(input) {
      if (input.bucket !== DATA_INTAKE_STORAGE_BUCKET) {
        return dataFail("SOURCE_INVALID", "Unexpected storage bucket");
      }
      if (!parseDataIntakeStoragePath(input.path)) {
        return dataFail("SOURCE_INVALID", "Storage path is not a canonical DATA object key");
      }
      const stored = records.get(objectKey(input.bucket, input.path));
      if (!stored) {
        return dataFail("SOURCE_INVALID", "Stored object is missing");
      }
      return dataOk({ bytes: new Uint8Array(stored.bytes) });
    },

    async removeObject(input) {
      if (input.bucket !== DATA_INTAKE_STORAGE_BUCKET) {
        return dataFail("SOURCE_INVALID", "Unexpected storage bucket");
      }
      records.delete(objectKey(input.bucket, input.path));
      return dataOk(undefined);
    },

    async createSignedReadUrl(input) {
      if (input.bucket !== DATA_INTAKE_STORAGE_BUCKET) {
        return dataFail("SOURCE_INVALID", "Unexpected storage bucket");
      }
      if (!parseDataIntakeStoragePath(input.path)) {
        return dataFail("SOURCE_INVALID", "Storage path is not a canonical DATA object key");
      }
      if (!records.has(objectKey(input.bucket, input.path))) {
        return dataFail("SOURCE_INVALID", "Stored object is missing");
      }
      const expiresInSeconds =
        input.expiresInSeconds > 0 &&
        input.expiresInSeconds <= DATA_INTAKE_SIGNED_READ_TTL_SECONDS
          ? input.expiresInSeconds
          : DATA_INTAKE_SIGNED_READ_TTL_SECONDS;
      return dataOk({
        signedUrl: `memory-signed://${input.bucket}/${input.path}`,
        expiresInSeconds,
      });
    },
  };
  return Object.assign(store, { records });
}
