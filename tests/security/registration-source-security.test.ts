import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("registration source security boundaries", () => {
  it("does not call legacy create_organization_with_owner from app code", () => {
    const root = join(process.cwd(), "src");
    const files = [
      "features/auth/actions/auth-actions.ts",
      "features/auth/server/complete-owner-provisioning.ts",
      "app/auth/callback/route.ts",
    ];

    for (const relative of files) {
      const source = readFileSync(join(root, relative), "utf8");
      expect(source).not.toContain('rpc("create_organization_with_owner"');
      expect(source).not.toContain("SERVICE_ROLE");
      expect(source).not.toContain("service_role");
    }
  });

  it("register schema rejects privilege fields via strict object", () => {
    const schema = readFileSync(
      join(process.cwd(), "src/features/auth/server/register-schema.ts"),
      "utf8",
    );
    expect(schema).toContain(".strict()");
    expect(schema).not.toMatch(/\brole\b.*z\./);
    expect(schema).not.toContain("organizationId");
  });

  it("signup metadata only includes non-privileged fields", () => {
    const actions = readFileSync(
      join(process.cwd(), "src/features/auth/actions/auth-actions.ts"),
      "utf8",
    );
    expect(actions).toContain("display_name:");
    expect(actions).toContain("company_name:");
    expect(actions).not.toMatch(/data:\s*\{[^}]*role/s);
    expect(actions).not.toMatch(/data:\s*\{[^}]*organization/s);
  });

  it("enforces PUBLIC_REGISTRATION_ENABLED server-side without a NEXT_PUBLIC flag", () => {
    const helper = readFileSync(
      join(process.cwd(), "src/features/auth/server/public-registration.ts"),
      "utf8",
    );
    const actions = readFileSync(
      join(process.cwd(), "src/features/auth/actions/auth-actions.ts"),
      "utf8",
    );
    const registerPage = readFileSync(
      join(process.cwd(), "src/app/register/page.tsx"),
      "utf8",
    );
    const loginForm = readFileSync(
      join(process.cwd(), "src/features/auth/ui/login-form.tsx"),
      "utf8",
    );
    const envExample = readFileSync(join(process.cwd(), ".env.example"), "utf8");

    expect(helper).toContain("PUBLIC_REGISTRATION_ENABLED");
    expect(helper).toContain('=== "true"');
    expect(helper).not.toContain("NEXT_PUBLIC_REGISTRATION_ENABLED");
    expect(actions).toContain("isPublicRegistrationEnabled");
    expect(actions).toContain("registration_disabled");
    expect(actions.indexOf("isPublicRegistrationEnabled()")).toBeLessThan(
      actions.indexOf("signUp"),
    );
    expect(registerPage).toContain("isPublicRegistrationEnabled");
    expect(loginForm).not.toContain("process.env");
    expect(loginForm).not.toContain("PUBLIC_REGISTRATION_ENABLED");
    expect(envExample).toContain("PUBLIC_REGISTRATION_ENABLED=false");
    expect(envExample).not.toContain("NEXT_PUBLIC_REGISTRATION_ENABLED");
  });

  it("keeps password/resend recovery ungated while owner completion requires public registration", () => {
    const actions = readFileSync(
      join(process.cwd(), "src/features/auth/actions/auth-actions.ts"),
      "utf8",
    );
    const resendStart = actions.indexOf("export async function resendVerificationAction");
    const completeStart = actions.indexOf("export async function completeRegistrationAction");
    const requestResetStart = actions.indexOf(
      "export async function requestPasswordResetAction",
    );
    const updatePasswordStart = actions.indexOf("export async function updatePasswordAction");
    expect(resendStart).toBeGreaterThan(-1);
    expect(completeStart).toBeGreaterThan(-1);
    expect(requestResetStart).toBeGreaterThan(-1);
    expect(updatePasswordStart).toBeGreaterThan(-1);
    expect(actions.slice(resendStart, completeStart)).not.toContain(
      "isPublicRegistrationEnabled",
    );
    // OD-APP-B6: explicit owner completion must enforce the public-registration gate.
    expect(actions.slice(completeStart, requestResetStart)).toContain(
      "isPublicRegistrationEnabled",
    );
    expect(actions.slice(requestResetStart)).not.toContain("isPublicRegistrationEnabled");
  });

  it("documents NEXT_PUBLIC_SITE_URL for Auth redirects without exposing secrets", () => {
    const envExample = readFileSync(join(process.cwd(), ".env.example"), "utf8");
    expect(envExample).toContain("NEXT_PUBLIC_SITE_URL=");
    expect(envExample).not.toMatch(/eyJ[A-Za-z0-9_-]{10,}/);
    expect(envExample).not.toMatch(/sb_secret_/i);
    expect(envExample).not.toMatch(/sk_live_/i);
  });
});
