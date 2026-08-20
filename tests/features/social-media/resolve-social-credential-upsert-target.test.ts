import { describe, expect, it, vi } from "vitest";
import { resolveSocialCredentialUpsertTarget } from "@/features/social-media/server/credential-repository";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const connectionId = "55555555-5555-4555-8555-555555555555";
const credentialId = "88888888-8888-4888-8888-888888888888";

describe("resolveSocialCredentialUpsertTarget", () => {
  it("uses first-insert version 0 for connect and does not load an envelope", async () => {
    const rpc = vi.fn();
    const supabase = { rpc } as unknown as SupabaseClient<Database>;
    const result = await resolveSocialCredentialUpsertTarget(supabase, {
      intentKind: "connect",
      connectionId,
    });
    expect(result).toEqual({ ok: true, expectedCredentialVersion: 0 });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("loads the existing credential id and version for reauthorize", async () => {
    const rpc = vi.fn(async () => ({
      data: [
        {
          result_code: "success",
          credential_id: credentialId,
          organization_id: "11111111-1111-4111-8111-111111111111",
          connection_id: connectionId,
          provider: "instagram",
          encryption_version: 1,
          key_purpose: "zyntixai.smm.credential.aes-v1",
          key_version: 1,
          ciphertext: "Y2lwaGVydGV4dA==",
          iv: "AAAAAAAAAAAAAAAA",
          auth_tag: "BBBBBBBBBBBBBBBBBBBBBB==",
          credential_version: 4,
        },
      ],
      error: null,
    }));
    const supabase = { rpc } as unknown as SupabaseClient<Database>;
    const result = await resolveSocialCredentialUpsertTarget(supabase, {
      intentKind: "reauthorize",
      connectionId,
    });
    expect(result).toEqual({
      ok: true,
      credentialId,
      expectedCredentialVersion: 4,
    });
    expect(rpc).toHaveBeenCalledWith(
      "load_social_provider_credential_envelope",
      { p_connection_id: connectionId },
    );
    expect(JSON.stringify(result)).not.toContain("Y2lwaGVydGV4dA==");
  });

  it("fail-closes when the existing envelope cannot be loaded", async () => {
    const rpc = vi.fn(async () => ({
      data: [{ result_code: "not_found" }],
      error: null,
    }));
    const supabase = { rpc } as unknown as SupabaseClient<Database>;
    const result = await resolveSocialCredentialUpsertTarget(supabase, {
      intentKind: "reauthorize",
      connectionId,
    });
    expect(result).toEqual({ ok: false, reason: "not_found" });
  });
});
