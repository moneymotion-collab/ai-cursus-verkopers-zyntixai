/**
 * Deterministic terminology inheritance and locale selection.
 * Locale candidates are chosen first; Context inheritance second.
 * One Effective Context run uses exactly one terminology locale.
 */

import {
  contextResolverFail,
  contextResolverOk,
  type ContextResolverResult,
} from "@/features/context-resolver/domain/errors";
import type {
  ContextChainEntry,
  EffectiveTerminology,
  ResolverTerminologyRow,
} from "@/features/context-resolver/domain/types";

export function normalizeLocaleTag(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  const parts = trimmed.split(/[-_]/).filter((part) => part.length > 0);
  if (parts.length === 0) {
    return "";
  }
  const language = parts[0].toLowerCase();
  if (parts.length === 1) {
    return language;
  }
  return `${language}-${parts[1].toUpperCase()}`;
}

export function localeCandidates(input: {
  requestedLocale: string | null;
  defaultLocale: string;
}): readonly string[] {
  const defaultLocale = normalizeLocaleTag(input.defaultLocale);
  const requested = input.requestedLocale ? normalizeLocaleTag(input.requestedLocale) : "";
  const ordered: string[] = [];
  const push = (locale: string) => {
    if (locale && !ordered.includes(locale)) {
      ordered.push(locale);
    }
  };
  if (requested) {
    push(requested);
    const base = requested.split("-")[0];
    if (base && base !== requested) {
      push(base);
    }
  }
  push(defaultLocale);
  return ordered;
}

export function resolveTerminology(input: {
  chain: readonly ContextChainEntry[];
  terminology: readonly ResolverTerminologyRow[];
  requestedLocale: string | null;
  defaultLocale: string;
}): ContextResolverResult<{
  terms: readonly EffectiveTerminology[];
  resolvedLocale: string;
  fallbackUsed: boolean;
}> {
  const seen = new Set<string>();
  for (const row of input.terminology) {
    const identity = `${row.versionId}::${row.locale}::${row.termKey}`;
    if (seen.has(identity)) {
      return contextResolverFail(
        "CATALOG_INTEGRITY_ERROR",
        "Duplicate Context terminology row",
        { versionId: row.versionId, locale: row.locale, termKey: row.termKey },
      );
    }
    seen.add(identity);
  }

  const defaultLocale = normalizeLocaleTag(input.defaultLocale);
  if (!defaultLocale) {
    return contextResolverFail(
      "CATALOG_INTEGRITY_ERROR",
      "Context Pack default_locale is missing",
    );
  }
  const requestedNormalized = input.requestedLocale
    ? normalizeLocaleTag(input.requestedLocale)
    : "";
  const candidates = localeCandidates({
    requestedLocale: input.requestedLocale,
    defaultLocale,
  });

  for (const locale of candidates) {
    const merged = new Map<string, EffectiveTerminology>();
    for (const entry of input.chain) {
      const rows = input.terminology
        .filter(
          (row) =>
            row.versionId === entry.version.id &&
            normalizeLocaleTag(row.locale) === locale,
        )
        .slice()
        .sort((left, right) => left.termKey.localeCompare(right.termKey));
      for (const row of rows) {
        merged.set(row.termKey, {
          termKey: row.termKey,
          singularLabel: row.singularLabel,
          pluralLabel: row.pluralLabel,
          shortLabel: row.shortLabel,
          helpText: row.helpText,
          provenance: {
            requestedLocale: input.requestedLocale,
            resolvedLocale: locale,
            fallbackUsed: Boolean(requestedNormalized && requestedNormalized !== locale),
            sourceContextPackKey: entry.pack.packKey,
            sourceVersionNumber: entry.version.versionNumber,
          },
        });
      }
    }
    if (merged.size > 0) {
      return contextResolverOk({
        terms: [...merged.values()].sort((left, right) =>
          left.termKey.localeCompare(right.termKey),
        ),
        resolvedLocale: locale,
        fallbackUsed: Boolean(requestedNormalized && requestedNormalized !== locale),
      });
    }
  }

  return contextResolverOk({
    terms: [],
    resolvedLocale: defaultLocale,
    fallbackUsed: Boolean(requestedNormalized && requestedNormalized !== defaultLocale),
  });
}
