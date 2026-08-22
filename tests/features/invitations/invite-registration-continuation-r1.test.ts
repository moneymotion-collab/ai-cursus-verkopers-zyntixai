import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  INVITE_CONTINUATION_SECRET_MIN_LENGTH,
  sealInvitationContinuation,
} from "@/features/invitations/server/continuation";
import { shouldResumeInvitationAdmissionBeforeOwnerCompletion } from "@/features/invitations/server/invitations-feature";
import { resolvePostAuthDestination } from "@/features/auth/server/resolve-registration-destination";
import {
  resolveAuthenticatedLanding,
  resolvePostLoginDestination,
} from "@/features/auth/server/resolve-authenticated-landing";

const TEST_SECRET = "r".repeat(INVITE_CONTINUATION_SECRET_MIN_LENGTH);
const USER_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ORG_A = "2fc07699-ece5-44b9-bbb3-abbc23e9fffb";
const ORG_FOREIGN = "99999999-9999-4999-8999-999999999999";
const VALID_TOKEN = "ab".repeat(32);

const listMembershipsMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/organizations/server/resolve-organization-context", () => ({
  listActiveOrganizationMemberships: listMembershipsMock,
}));

function fakeSupabase() {
  return {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                maybeSingle: async () => ({
                  data: { onboarding_completed_at: "2026-07-01T00:00:00.000Z" },
                  error: null,
                }),
              };
            },
          };
        },
      };
    },
  } as never;
}

describe("BETA1-LR-1-R1 invite registration continuation", () => {
  const previousInvitations = process.env.INVITATIONS_ENABLED;
  const previousRegistration = process.env.PUBLIC_REGISTRATION_ENABLED;
  const previousSecret = process.env.INVITE_CONTINUATION_SECRET;

  beforeEach(() => {
    process.env.INVITATIONS_ENABLED = "true";
    process.env.PUBLIC_REGISTRATION_ENABLED = "false";
    process.env.INVITE_CONTINUATION_SECRET = TEST_SECRET;
    listMembershipsMock.mockReset();
    listMembershipsMock.mockResolvedValue({ ok: true, memberships: [] });
  });

  afterEach(() => {
    if (previousInvitations === undefined) {
      delete process.env.INVITATIONS_ENABLED;
    } else {
      process.env.INVITATIONS_ENABLED = previousInvitations;
    }
    if (previousRegistration === undefined) {
      delete process.env.PUBLIC_REGISTRATION_ENABLED;
    } else {
      process.env.PUBLIC_REGISTRATION_ENABLED = previousRegistration;
    }
    if (previousSecret === undefined) {
      delete process.env.INVITE_CONTINUATION_SECRET;
    } else {
      process.env.INVITE_CONTINUATION_SECRET = previousSecret;
    }
  });

  it("resumes invite admission when PATH B is on and public registration is off", () => {
    expect(shouldResumeInvitationAdmissionBeforeOwnerCompletion()).toBe(true);
  });

  it("A: new invited user without continuation still resumes /invite/accept, not workspace creation", async () => {
    const destination = await resolvePostAuthDestination(
      {} as never,
      { id: USER_A, email_confirmed_at: "2026-08-22T11:30:23Z" } as never,
      { invitationCookies: {} },
    );

    expect(destination.kind).toBe("invite_accept");
    expect(destination.path).toBe("/invite/accept");
    expect(destination.path).not.toBe("/register/complete");
  });

  it("A: login next=/home?org=foreign cannot hijack zero-membership PATH B resume", async () => {
    const path = await resolvePostLoginDestination(
      {} as never,
      `/home?org=${ORG_FOREIGN}`,
      { invitationCookies: {}, authenticatedUserId: USER_A },
    );

    expect(path).toBe("/invite/accept");
    expect(path).not.toContain(ORG_FOREIGN);
    expect(path).not.toBe("/register/complete");
  });

  it("B: generic workspace creation remains unavailable when invitations are OFF", async () => {
    process.env.INVITATIONS_ENABLED = "false";
    expect(shouldResumeInvitationAdmissionBeforeOwnerCompletion()).toBe(false);

    const destination = await resolvePostAuthDestination(
      {} as never,
      { id: USER_A, email_confirmed_at: "2026-08-22T11:30:23Z" } as never,
      { invitationCookies: {} },
    );

    expect(destination.kind).toBe("complete_registration");
    expect(destination.path).toBe("/register/complete");
  });

  it("C: expired/invalid continuation still resumes invite surface on PATH B, not owner completion", async () => {
    const destination = await resolvePostAuthDestination(
      fakeSupabase(),
      { id: USER_A, email_confirmed_at: "2026-08-22T11:30:23Z" } as never,
      { invitationCookies: { continuation: "v1.not-a-valid-seal" } },
    );

    expect(destination.kind).toBe("invite_accept");
    expect(destination.path).toBe("/invite/accept");
  });

  it("E: already-member replay lands in the verified membership org, not a new workspace", async () => {
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [{ organizationId: ORG_A, role: "staff" }],
    });

    const destination = await resolvePostAuthDestination(
      fakeSupabase(),
      { id: USER_A, email_confirmed_at: "2026-08-22T11:30:23Z" } as never,
      { invitationCookies: {} },
    );

    expect(destination.kind).toBe("product");
    expect(destination.path).toBe(`/home?org=${ORG_A}`);
    expect(destination.path).not.toBe("/register/complete");
  });

  it("F: default landing after membership uses the verified org, not a foreign org id", async () => {
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [{ organizationId: ORG_A, role: "staff" }],
    });

    const landing = await resolveAuthenticatedLanding(fakeSupabase());
    expect(landing).toBe(`/home?org=${ORG_A}`);
    expect(landing).not.toContain(ORG_FOREIGN);
  });

  it("trusted continuation still wins over owner completion", async () => {
    const sealed = sealInvitationContinuation(VALID_TOKEN, {
      secret: TEST_SECRET,
    });
    expect(sealed.ok).toBe(true);
    if (!sealed.ok) {
      return;
    }

    const destination = await resolvePostAuthDestination(
      {} as never,
      { id: USER_A, email_confirmed_at: "2026-08-22T11:30:23Z" } as never,
      { invitationCookies: { continuation: sealed.cookieValue } },
    );

    expect(destination.kind).toBe("invite_accept");
    expect(destination.path).toBe("/invite/accept");
  });
});
