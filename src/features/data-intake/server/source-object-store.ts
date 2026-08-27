import "server-only";

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

export type DataIntakeObjectStore = {
  putObject(input: {
    bucket: string;
    path: string;
    bytes: Uint8Array;
    contentType: string;
  }): Promise<DataIntakeResult<{ created: boolean }>>;
  getObject(input: {
    bucket: string;
    path: string;
  }): Promise<DataIntakeResult<{ bytes: Uint8Array }>>;
  removeObject(input: {
    bucket: string;
    path: string;
  }): Promise<DataIntakeResult<void>>;
  createSignedReadUrl(input: {
    bucket: string;
    path: string;
    expiresInSeconds: number;
  }): Promise<DataIntakeResult<{ signedUrl: string; expiresInSeconds: number }>>;
};

export type DataIntakeStoragePort = {
  from(bucket: string): {
    upload(
      path: string,
      data: Uint8Array,
      options: { contentType: string; upsert: boolean },
    ): PromiseLike<{ error: { message: string } | null }>;
    download(
      path: string,
    ): PromiseLike<{ data: Blob | null; error: { message: string } | null }>;
    remove(
      paths: string[],
    ): PromiseLike<{ error: { message: string } | null }>;
    createSignedUrl(
      path: string,
      expiresIn: number,
    ): PromiseLike<{
      data: { signedUrl: string } | null;
      error: { message: string } | null;
    }>;
  };
};

function assertCanonicalObjectTarget(input: { bucket: string; path: string }) {
  if (input.bucket !== DATA_INTAKE_STORAGE_BUCKET) {
    return dataFail("SOURCE_INVALID", "Unexpected storage bucket");
  }
  if (!parseDataIntakeStoragePath(input.path)) {
    return dataFail("SOURCE_INVALID", "Storage path is not a canonical DATA object key");
  }
  return dataOk(true);
}

export function createSupabaseDataIntakeObjectStore(
  storage: DataIntakeStoragePort,
): DataIntakeObjectStore {
  return {
    async putObject(input) {
      const allowed = assertCanonicalObjectTarget(input);
      if (!allowed.ok) {
        return allowed;
      }
      const uploaded = await storage.from(input.bucket).upload(input.path, input.bytes, {
        contentType: input.contentType,
        upsert: false,
      });
      if (uploaded.error) {
        const message = uploaded.error.message.toLowerCase();
        if (
          message.includes("already exists") ||
          message.includes("duplicate") ||
          message.includes("resource already exists")
        ) {
          return dataOk({ created: false });
        }
        return dataFail("DATABASE_WRITE_ERROR", "Private object upload failed");
      }
      return dataOk({ created: true });
    },

    async getObject(input) {
      const allowed = assertCanonicalObjectTarget(input);
      if (!allowed.ok) {
        return allowed;
      }
      const downloaded = await storage.from(input.bucket).download(input.path);
      if (downloaded.error || !downloaded.data) {
        return dataFail("SOURCE_INVALID", "Stored object is missing");
      }
      const bytes = new Uint8Array(await downloaded.data.arrayBuffer());
      return dataOk({ bytes });
    },

    async removeObject(input) {
      const allowed = assertCanonicalObjectTarget(input);
      if (!allowed.ok) {
        return allowed;
      }
      const removed = await storage.from(input.bucket).remove([input.path]);
      if (removed.error) {
        return dataFail("DATABASE_WRITE_ERROR", "Private object cleanup failed");
      }
      return dataOk(undefined);
    },

    async createSignedReadUrl(input) {
      const allowed = assertCanonicalObjectTarget(input);
      if (!allowed.ok) {
        return allowed;
      }
      const expiresInSeconds =
        input.expiresInSeconds > 0 &&
        input.expiresInSeconds <= DATA_INTAKE_SIGNED_READ_TTL_SECONDS
          ? input.expiresInSeconds
          : DATA_INTAKE_SIGNED_READ_TTL_SECONDS;
      const signed = await storage.from(input.bucket).createSignedUrl(
        input.path,
        expiresInSeconds,
      );
      if (signed.error || !signed.data?.signedUrl) {
        return dataFail("DATABASE_READ_ERROR", "Signed read URL could not be created");
      }
      return dataOk({
        signedUrl: signed.data.signedUrl,
        expiresInSeconds,
      });
    },
  };
}
