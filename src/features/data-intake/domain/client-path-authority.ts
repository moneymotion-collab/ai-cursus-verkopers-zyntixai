export function clientAttemptedStorageAuthority(
  input: Readonly<Record<string, unknown>>,
): boolean {
  return (
    "storagePath" in input ||
    "storage_path" in input ||
    "bucket" in input ||
    "storageBucket" in input ||
    "generatedObjectId" in input ||
    "generated_object_id" in input ||
    "path" in input
  );
}
