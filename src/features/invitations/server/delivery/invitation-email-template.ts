import "server-only";

import type { OrganizationInvitationTargetRole } from "@/features/invitations/domain/types";
import { isOrganizationInvitationTargetRole } from "@/features/invitations/domain/permissions";
import { isTrustedInvitationAcceptanceUrl } from "@/features/invitations/server/delivery/acceptance-url";

export type InvitationEmailTemplateInput = {
  organizationName: string;
  targetRole: string;
  acceptanceUrl: string;
  expiresAt: string | null;
};

export type InvitationEmailTemplateContent = {
  subject: string;
  html: string;
  text: string;
  preheader: string;
};

export type BuildInvitationEmailContentResult =
  | { ok: true; content: InvitationEmailTemplateContent }
  | { ok: false; reason: "invalid_acceptance_url" | "invalid_organization_name" };

/**
 * Escape dynamic values for HTML email bodies/attributes.
 */
export function escapeHtmlForInvitationEmail(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Prevent newline/control injection into email subject headers.
 */
export function sanitizeInvitationEmailSubjectFragment(value: string): string {
  return value.replace(/[\0\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}

export function invitationTargetRoleDisplayLabel(
  role: string,
): string | null {
  if (!isOrganizationInvitationTargetRole(role)) {
    return null;
  }
  const labels: Record<OrganizationInvitationTargetRole, string> = {
    admin: "Admin",
    staff: "Staff",
    viewer: "Viewer",
  };
  return labels[role];
}

/**
 * Deterministic UTC date label from authoritative expires_at.
 */
export function formatInvitationExpiryLabel(
  expiresAt: string | null,
): string {
  if (!expiresAt) {
    return "This invitation may expire. Accept it as soon as possible.";
  }

  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) {
    return "This invitation may expire. Accept it as soon as possible.";
  }

  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);

  return `This invitation expires on ${formatted} (UTC).`;
}

function buildSubject(organizationName: string): string {
  const org = sanitizeInvitationEmailSubjectFragment(organizationName);
  return `You're invited to join ${org} on ZyntixAI`;
}

function buildPreheader(organizationName: string): string {
  const org = sanitizeInvitationEmailSubjectFragment(organizationName);
  return `Accept your invitation to join ${org} on ZyntixAI.`;
}

/**
 * Final CB-E1-B transactional invitation email content.
 * No remote assets, no marketing layout, no token outside the CTA URL.
 */
export function buildInvitationEmailContent(
  input: InvitationEmailTemplateInput,
  env: Record<string, string | undefined> = process.env,
): BuildInvitationEmailContentResult {
  const organizationName = input.organizationName.trim();
  if (organizationName.length === 0) {
    return { ok: false, reason: "invalid_organization_name" };
  }

  if (!isTrustedInvitationAcceptanceUrl(input.acceptanceUrl, env)) {
    return { ok: false, reason: "invalid_acceptance_url" };
  }

  const roleLabel = invitationTargetRoleDisplayLabel(input.targetRole);
  const subject = buildSubject(organizationName);
  const preheader = buildPreheader(organizationName);
  const expiryText = formatInvitationExpiryLabel(input.expiresAt);

  const orgHtml = escapeHtmlForInvitationEmail(organizationName);
  const roleHtml = roleLabel
    ? escapeHtmlForInvitationEmail(roleLabel)
    : null;
  const urlHtml = escapeHtmlForInvitationEmail(input.acceptanceUrl);
  const expiryHtml = escapeHtmlForInvitationEmail(expiryText);
  const preheaderHtml = escapeHtmlForInvitationEmail(preheader);

  const inviteSentenceText = roleLabel
    ? `You have been invited to join ${organizationName} on ZyntixAI as ${roleLabel}.`
    : `You have been invited to join ${organizationName} on ZyntixAI.`;

  const inviteSentenceHtml = roleHtml
    ? `You have been invited to join <strong>${orgHtml}</strong> on ZyntixAI as <strong>${roleHtml}</strong>.`
    : `You have been invited to join <strong>${orgHtml}</strong> on ZyntixAI.`;

  const text = [
    "ZyntixAI",
    "",
    "You're invited",
    "",
    inviteSentenceText,
    "",
    `Accept invitation: ${input.acceptanceUrl}`,
    "",
    "If the button doesn't work, copy and paste the link above into your browser.",
    "",
    expiryText,
    "",
    "If you weren't expecting this invitation, you can ignore this email.",
  ].join("\n");

  const html = [
    `<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#111111;">`,
    `<p style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheaderHtml}</p>`,
    `<p style="margin:0 0 8px;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#555555;">ZyntixAI</p>`,
    `<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;font-weight:700;color:#111111;">You're invited</h1>`,
    `<p style="margin:0 0 16px;">${inviteSentenceHtml}</p>`,
    `<p style="margin:0 0 16px;">`,
    `<a href="${urlHtml}" style="display:inline-block;padding:12px 18px;background:#111111;color:#ffffff;text-decoration:none;border-radius:4px;font-weight:600;">Accept invitation</a>`,
    `</p>`,
    `<p style="margin:0 0 16px;font-size:14px;color:#333333;word-break:break-all;">`,
    `If the button doesn't work, copy and paste this link into your browser:<br />`,
    `<a href="${urlHtml}" style="color:#111111;">${urlHtml}</a>`,
    `</p>`,
    `<p style="margin:0 0 16px;">${expiryHtml}</p>`,
    `<p style="margin:0;font-size:14px;color:#555555;">If you weren't expecting this invitation, you can ignore this email.</p>`,
    `</div>`,
  ].join("");

  return {
    ok: true,
    content: {
      subject,
      html,
      text,
      preheader,
    },
  };
}
