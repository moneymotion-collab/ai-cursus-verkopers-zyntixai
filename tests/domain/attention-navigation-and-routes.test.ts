import { describe, expect, it } from "vitest";
import {
  ATTENTION_NAV_LABEL,
  ATTENTION_NAV_ORDER_AFTER,
  ATTENTION_NAV_VISIBLE,
  ATTENTION_ROUTE,
  buildAttentionDetailHref,
  buildAttentionListHref,
  isAttentionPathname,
} from "@/features/attention/domain/attention-navigation";
import {
  DEFAULT_ATTENTION_PAGE_SIZE,
  MAX_ATTENTION_PAGE_SIZE,
} from "@/features/attention/domain/read-types";
import type {
  AttentionApplicationError,
  AttentionReadQueryResult,
  AttentionRpcAdapterResult,
} from "@/features/attention/domain/types";
import {
  isProtectedApplicationPath,
  resolveSafeReturnPath,
} from "@/features/auth/server/safe-return-path";

describe("attention navigation (B1.7.5-E)", () => {
  it("activates Attention nav after B1.7.5-E readiness", () => {
    expect(ATTENTION_NAV_VISIBLE).toBe(true);
    expect(ATTENTION_ROUTE).toBe("/attention");
    expect(ATTENTION_NAV_LABEL).toBe("Attention");
    expect(ATTENTION_NAV_ORDER_AFTER).toBe("progress");
  });

  it("builds list/detail hrefs with optional org and filter prefills", () => {
    expect(buildAttentionListHref()).toBe("/attention");
    expect(buildAttentionListHref("11111111-1111-4111-8111-111111111111")).toBe(
      "/attention?org=11111111-1111-4111-8111-111111111111",
    );
    expect(
      buildAttentionListHref({
        organizationId: "11111111-1111-4111-8111-111111111111",
        enrollmentId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        status: "open",
        severity: "high",
      }),
    ).toBe(
      "/attention?org=11111111-1111-4111-8111-111111111111&enrollmentId=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa&status=open&severity=high",
    );
    expect(
      buildAttentionDetailHref("55555555-5555-4555-8555-555555555555"),
    ).toBe("/attention/55555555-5555-4555-8555-555555555555");
    expect(
      buildAttentionDetailHref(
        "55555555-5555-4555-8555-555555555555",
        "11111111-1111-4111-8111-111111111111",
      ),
    ).toBe(
      "/attention/55555555-5555-4555-8555-555555555555?org=11111111-1111-4111-8111-111111111111",
    );
    expect(isAttentionPathname("/attention")).toBe(true);
    expect(isAttentionPathname("/attention/abc")).toBe(true);
    expect(isAttentionPathname("/attention-evil")).toBe(false);
    expect(isAttentionPathname("/attentions")).toBe(false);
    expect(isAttentionPathname("/progress")).toBe(false);
  });
});

describe("attention application wiring (B1.7.4-D)", () => {
  it("allowlists and protects /attention paths for safe return without prefix overmatch", () => {
    expect(resolveSafeReturnPath("/attention")).toBe("/attention");
    expect(resolveSafeReturnPath("/attention/")).toBe("/attention/");
    expect(
      resolveSafeReturnPath("/attention/55555555-5555-4555-8555-555555555555"),
    ).toBe("/attention/55555555-5555-4555-8555-555555555555");
    expect(
      resolveSafeReturnPath(
        "/attention?org=11111111-1111-4111-8111-111111111111",
      ),
    ).toBe("/attention?org=11111111-1111-4111-8111-111111111111");
    expect(isProtectedApplicationPath("/attention")).toBe(true);
    expect(isProtectedApplicationPath("/attention/abc")).toBe(true);
    expect(resolveSafeReturnPath("/attention-evil")).toBe("/");
    expect(isProtectedApplicationPath("/attention-evil")).toBe(false);
    expect(resolveSafeReturnPath("//evil.example/attention")).toBe("/");
    expect(resolveSafeReturnPath("https://evil.example/attention")).toBe("/");
  });
});

describe("attention application result contracts (B1.7.4-A)", () => {
  it("exposes Progress-shaped result unions and bounded pagination defaults", () => {
    const ok: AttentionReadQueryResult<{ id: string }> = {
      ok: true,
      data: { id: "x" },
    };
    const unavailable: AttentionApplicationError = {
      code: "ATTENTION_ITEM_UNAVAILABLE",
      message: "Attention item not found or access denied.",
      retryable: false,
      category: "not_found",
    };
    const fail: AttentionReadQueryResult<{ id: string }> = {
      ok: false,
      error: unavailable,
    };
    const rpcOk: AttentionRpcAdapterResult<{ attentionItemId: string }> = {
      ok: true,
      data: { attentionItemId: "y" },
    };

    expect(ok.ok).toBe(true);
    expect(fail.ok).toBe(false);
    if (!fail.ok) {
      expect(fail.error.code).toBe("ATTENTION_ITEM_UNAVAILABLE");
    }
    expect(rpcOk.ok).toBe(true);
    expect(DEFAULT_ATTENTION_PAGE_SIZE).toBe(25);
    expect(MAX_ATTENTION_PAGE_SIZE).toBe(100);
  });
});
