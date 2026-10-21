import { describe, expect, it } from "vitest";
import { resolveTerminology } from "@/features/context-resolver/domain/terminology-resolution";
import { localeCandidates, normalizeLocaleTag } from "@/features/context-resolver/domain";
import type { ContextChainEntry } from "@/features/context-resolver/domain/types";
import {
  KNOWLEDGE_PACK,
  KNOWLEDGE_V1,
  knowledgeTerms,
  OCB_PACK,
  OCB_V1,
  shuffle,
} from "./fixture";

const CHAIN: readonly ContextChainEntry[] = [
  { pack: KNOWLEDGE_PACK, version: KNOWLEDGE_V1 },
  { pack: OCB_PACK, version: OCB_V1 },
];

describe("locale candidates", () => {
  it("normalizes tags and builds exact → base → default without duplicates", () => {
    expect(normalizeLocaleTag("nl-nl")).toBe("nl-NL");
    expect(normalizeLocaleTag("EN_US")).toBe("en-US");
    expect(localeCandidates({ requestedLocale: "nl-NL", defaultLocale: "en" })).toEqual([
      "nl-NL",
      "nl",
      "en",
    ]);
    expect(localeCandidates({ requestedLocale: "en-US", defaultLocale: "en" })).toEqual([
      "en-US",
      "en",
    ]);
    expect(localeCandidates({ requestedLocale: "en", defaultLocale: "en" })).toEqual(["en"]);
    expect(localeCandidates({ requestedLocale: null, defaultLocale: "en" })).toEqual(["en"]);
  });
});

describe("terminology resolution", () => {
  it("inherits Knowledge en rows when Niche has none", () => {
    const result = resolveTerminology({
      chain: CHAIN,
      terminology: knowledgeTerms(),
      requestedLocale: "en",
      defaultLocale: "en",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.resolvedLocale).toBe("en");
    expect(result.value.fallbackUsed).toBe(false);
    expect(result.value.terms.map((term) => term.termKey)).toEqual([
      "customer",
      "enrollment",
      "program",
      "progress",
    ]);
    expect(result.value.terms[0]?.provenance.sourceContextPackKey).toBe("foundation.knowledge");
  });

  it("lets a child override the same locale termKey", () => {
    const result = resolveTerminology({
      chain: CHAIN,
      terminology: [
        ...knowledgeTerms(),
        {
          versionId: OCB_V1.id,
          locale: "en",
          termKey: "customer",
          singularLabel: "Learner",
          pluralLabel: "Learners",
          shortLabel: null,
          helpText: null,
        },
      ],
      requestedLocale: "en",
      defaultLocale: "en",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.terms.find((term) => term.termKey === "customer")).toMatchObject({
      singularLabel: "Learner",
      provenance: { sourceContextPackKey: "niche.online-course-business" },
    });
  });

  it("selects exact locale, then base language, then default with fallbackUsed", () => {
    const dutchExact = resolveTerminology({
      chain: CHAIN,
      terminology: [
        ...knowledgeTerms("en"),
        {
          versionId: KNOWLEDGE_V1.id,
          locale: "nl-NL",
          termKey: "customer",
          singularLabel: "Klant",
          pluralLabel: "Klanten",
          shortLabel: null,
          helpText: null,
        },
      ],
      requestedLocale: "nl-NL",
      defaultLocale: "en",
    });
    expect(dutchExact.ok).toBe(true);
    if (!dutchExact.ok) return;
    expect(dutchExact.value.resolvedLocale).toBe("nl-NL");
    expect(dutchExact.value.fallbackUsed).toBe(false);
    expect(dutchExact.value.terms).toHaveLength(1);

    const dutchBase = resolveTerminology({
      chain: CHAIN,
      terminology: [
        ...knowledgeTerms("en"),
        {
          versionId: KNOWLEDGE_V1.id,
          locale: "nl",
          termKey: "program",
          singularLabel: "Programma",
          pluralLabel: "Programma's",
          shortLabel: null,
          helpText: null,
        },
      ],
      requestedLocale: "nl-NL",
      defaultLocale: "en",
    });
    expect(dutchBase.ok).toBe(true);
    if (!dutchBase.ok) return;
    expect(dutchBase.value.resolvedLocale).toBe("nl");
    expect(dutchBase.value.fallbackUsed).toBe(true);
    expect(dutchBase.value.terms.map((term) => term.termKey)).toEqual(["program"]);

    const englishFallback = resolveTerminology({
      chain: CHAIN,
      terminology: knowledgeTerms("en"),
      requestedLocale: "nl-NL",
      defaultLocale: "en",
    });
    expect(englishFallback.ok).toBe(true);
    if (!englishFallback.ok) return;
    expect(englishFallback.value.resolvedLocale).toBe("en");
    expect(englishFallback.value.fallbackUsed).toBe(true);
    expect(englishFallback.value.terms).toHaveLength(4);
  });

  it("does not mix English terms into a selected partial Dutch locale", () => {
    const result = resolveTerminology({
      chain: CHAIN,
      terminology: [
        ...knowledgeTerms("en"),
        {
          versionId: KNOWLEDGE_V1.id,
          locale: "nl-NL",
          termKey: "customer",
          singularLabel: "Klant",
          pluralLabel: "Klanten",
          shortLabel: null,
          helpText: null,
        },
      ],
      requestedLocale: "nl-NL",
      defaultLocale: "en",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.resolvedLocale).toBe("nl-NL");
    expect(result.value.terms.map((term) => term.termKey)).toEqual(["customer"]);
    expect(result.value.terms.some((term) => term.singularLabel === "Program")).toBe(false);
  });

  it("returns deterministic empty terminology when no locale has terms", () => {
    const result = resolveTerminology({
      chain: CHAIN,
      terminology: [],
      requestedLocale: "nl-NL",
      defaultLocale: "en",
    });
    expect(result).toMatchObject({
      ok: true,
      value: { terms: [], resolvedLocale: "en", fallbackUsed: true },
    });
  });

  it("fails duplicate terminology and ignores input order", () => {
    expect(
      resolveTerminology({
        chain: CHAIN,
        terminology: [...knowledgeTerms(), knowledgeTerms()[0]!],
        requestedLocale: "en",
        defaultLocale: "en",
      }),
    ).toMatchObject({ ok: false, error: { code: "CATALOG_INTEGRITY_ERROR" } });

    const left = resolveTerminology({
      chain: CHAIN,
      terminology: shuffle(knowledgeTerms(), 3),
      requestedLocale: "en",
      defaultLocale: "en",
    });
    const right = resolveTerminology({
      chain: CHAIN,
      terminology: shuffle(knowledgeTerms(), 41),
      requestedLocale: "en",
      defaultLocale: "en",
    });
    expect(left.ok && right.ok).toBe(true);
    if (!left.ok || !right.ok) return;
    expect(left.value).toEqual(right.value);
  });
});
