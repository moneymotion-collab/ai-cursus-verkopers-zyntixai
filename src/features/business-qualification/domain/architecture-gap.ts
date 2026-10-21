/**
 * Frozen TAX targets whose confirmed classification is an architecture gap.
 * Missing Context Pack is not itself unsupported. Do not assign parent Context.
 */

export const ARCHITECTURE_GAP_TAXONOMY_KEYS = [
  "manufacturing-and-production",
] as const;

export function isArchitectureGapTaxonomyKey(key: string | null | undefined): boolean {
  return (
    typeof key === "string" &&
    (ARCHITECTURE_GAP_TAXONOMY_KEYS as readonly string[]).includes(key)
  );
}
