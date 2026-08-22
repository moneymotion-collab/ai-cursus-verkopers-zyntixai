import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { AppShell } from "@/components/app-shell";
import {
  CLOSED_BETA_SUPPORT_SUBJECT,
  buildClosedBetaSupportMailto,
  parseClosedBetaSupportEmail,
  resolveClosedBetaSupportMailto,
} from "@/features/support/closed-beta-support-contact";

const previousSupportEmail = process.env.CLOSED_BETA_SUPPORT_EMAIL;

afterEach(() => {
  if (previousSupportEmail === undefined) {
    delete process.env.CLOSED_BETA_SUPPORT_EMAIL;
  } else {
    process.env.CLOSED_BETA_SUPPORT_EMAIL = previousSupportEmail;
  }
});

describe("parseClosedBetaSupportEmail", () => {
  it("accepts a simple mailbox and normalizes case", () => {
    expect(parseClosedBetaSupportEmail("  Owner@Example.com ")).toBe(
      "owner@example.com",
    );
  });

  it("fails closed on missing or invalid values", () => {
    expect(parseClosedBetaSupportEmail(undefined)).toBeNull();
    expect(parseClosedBetaSupportEmail("")).toBeNull();
    expect(parseClosedBetaSupportEmail("not-an-email")).toBeNull();
    expect(parseClosedBetaSupportEmail("owner@example")).toBeNull();
  });
});

describe("buildClosedBetaSupportMailto", () => {
  it("prefills a non-sensitive subject and prompt without identifiers", () => {
    const href = buildClosedBetaSupportMailto("owner@example.com");
    expect(href.startsWith("mailto:owner@example.com?")).toBe(true);
    const decoded = decodeURIComponent(href.replace(/\+/g, " "));
    expect(decoded).toContain(`subject=${CLOSED_BETA_SUPPORT_SUBJECT}`);
    expect(decoded).toContain("What happened");
    expect(href).not.toContain("token");
    expect(href).not.toContain("cookie");
    expect(href).not.toContain("org=");
  });
});

describe("resolveClosedBetaSupportMailto", () => {
  it("returns null when the env mailbox is unset", () => {
    delete process.env.CLOSED_BETA_SUPPORT_EMAIL;
    expect(resolveClosedBetaSupportMailto({})).toBeNull();
  });

  it("builds mailto from a valid env mailbox", () => {
    expect(
      resolveClosedBetaSupportMailto({
        CLOSED_BETA_SUPPORT_EMAIL: "owner@example.com",
      }),
    ).toBe(buildClosedBetaSupportMailto("owner@example.com"));
  });
});

describe("AppShell support contact", () => {
  it("hides Support & feedback when destination is unset", () => {
    delete process.env.CLOSED_BETA_SUPPORT_EMAIL;
    const html = renderToStaticMarkup(
      <AppShell activeNav="home" membersNavVisible={false}>
        <h1>Today</h1>
      </AppShell>,
    );
    expect(html).not.toContain("Support");
    expect(html).not.toContain("mailto:");
  });

  it("renders an accessible Support & feedback mailto when configured", () => {
    process.env.CLOSED_BETA_SUPPORT_EMAIL = "owner@example.com";
    const html = renderToStaticMarkup(
      <AppShell activeNav="home" membersNavVisible={false}>
        <h1>Today</h1>
      </AppShell>,
    );
    expect(html).toContain("Support &amp; feedback");
    expect(html).toContain('href="mailto:owner@example.com?');
    expect(html).toContain("<footer");
    expect(html).toMatch(/<a[^>]+href="mailto:owner@example.com\?/);
  });
});
