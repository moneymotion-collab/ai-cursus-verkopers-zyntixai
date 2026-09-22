import React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AppShell } from "@/components/app-shell";
import { AppShellChrome } from "@/components/app-shell-chrome";
import { SOCIAL_NAV_LABEL, SOCIAL_ROUTE } from "@/features/social-media/domain/social-navigation";
import { KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY } from "../../features/product-access/module-access-fixtures";
import { renderAsyncServerTree } from "../../helpers/render-async-server-tree";
import AttentionError from "@/app/(authenticated)/attention/error";
import CustomerDetailError from "@/app/(authenticated)/customers/[customerId]/error";
import ProjectsError from "@/app/(authenticated)/projects/error";
import TasksError from "@/app/(authenticated)/tasks/error";

const ORG = "11111111-1111-4111-8111-111111111111";

const enrollmentStatusMock = vi.hoisted(() => vi.fn());
const createServerClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/social-media/server/social-closed-beta-enrollment", () => ({
  loadSocialClosedBetaEnrollmentStatus: enrollmentStatusMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createServerClientMock,
}));

const ERROR_BOUNDARIES = [
  "src/app/(authenticated)/attention/error.tsx",
  "src/app/(authenticated)/customers/error.tsx",
  "src/app/(authenticated)/customers/[customerId]/error.tsx",
  "src/app/(authenticated)/leads/error.tsx",
  "src/app/(authenticated)/leads/[leadId]/error.tsx",
  "src/app/(authenticated)/programs/error.tsx",
  "src/app/(authenticated)/programs/[programId]/error.tsx",
  "src/app/(authenticated)/progress/error.tsx",
  "src/app/(authenticated)/progress/new/error.tsx",
  "src/app/(authenticated)/progress/[factId]/error.tsx",
  "src/app/(authenticated)/progress/[factId]/correct/error.tsx",
  "src/app/(authenticated)/progress/[factId]/void/error.tsx",
  "src/app/(authenticated)/projects/error.tsx",
  "src/app/(authenticated)/tasks/error.tsx",
  "src/app/(authenticated)/tasks/[taskId]/error.tsx",
] as const;

function readSrc(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function primaryNavBlocks(html: string): string[] {
  const blocks: string[] = [];
  const marker = 'aria-label="Primary"';
  let searchFrom = 0;
  while (searchFrom < html.length) {
    const start = html.indexOf(marker, searchFrom);
    if (start === -1) {
      break;
    }
    const navStart = html.lastIndexOf("<nav", start);
    const navEnd = html.indexOf("</nav>", start);
    if (navStart === -1 || navEnd === -1) {
      break;
    }
    blocks.push(html.slice(navStart, navEnd + "</nav>".length));
    searchFrom = navEnd + "</nav>".length;
  }
  return blocks;
}

function countLabel(html: string): number {
  return html.split(SOCIAL_NAV_LABEL).length - 1;
}

async function renderShell(
  props: Omit<React.ComponentProps<typeof AppShellChrome>, "children"> = {},
): Promise<string> {
  return renderAsyncServerTree(
    <AppShell
      moduleNavVisibility={KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY}
      membersNavVisible={false}
      {...props}
    >
      <p>workspace</p>
    </AppShell>,
  );
}

describe("CB-VIS-1-R6-B server-resolved Social primary navigation", () => {
  beforeEach(() => {
    enrollmentStatusMock.mockReset();
    createServerClientMock.mockReset();
    createServerClientMock.mockResolvedValue({});
  });

  it("paints the enrolled Social link in server HTML once per rendered navigation", async () => {
    enrollmentStatusMock.mockResolvedValue({
      ok: true,
      status: "approved",
      statusBeforePause: null,
    });

    const html = await renderShell({ selectedOrganizationId: ORG });
    const navs = primaryNavBlocks(html);

    expect(html).toContain(SOCIAL_NAV_LABEL);
    expect(html).toContain(`${SOCIAL_ROUTE}?org=${ORG}`);
    expect(navs).toHaveLength(2);
    for (const nav of navs) {
      expect(countLabel(nav)).toBe(1);
      expect(nav).toContain(`href="${SOCIAL_ROUTE}?org=${ORG}"`);
      expect(nav).toContain(`>${SOCIAL_NAV_LABEL}<`);
    }
    expect(countLabel(html)).toBe(2);
    expect(html).not.toContain("useEffect");
    expect(enrollmentStatusMock).toHaveBeenCalledTimes(1);
    expect(enrollmentStatusMock.mock.calls[0]?.[1]).toBe(ORG);
  });

  it("omits Social from server markup when the organization is not enrolled", async () => {
    enrollmentStatusMock.mockResolvedValue({
      ok: true,
      status: "not_enrolled",
      statusBeforePause: null,
    });

    const html = await renderShell({ selectedOrganizationId: ORG });
    expect(html).not.toContain(SOCIAL_NAV_LABEL);
    expect(html).not.toContain(`href="${SOCIAL_ROUTE}`);
    expect(html).toContain(">Home<");
    expect(html).toContain(">Tasks<");
    expect(enrollmentStatusMock).toHaveBeenCalledTimes(1);
  });

  it("fails closed on enrollment lookup failure without private detail", async () => {
    enrollmentStatusMock.mockResolvedValue({
      ok: false,
      reason: "transport_error",
    });

    const html = await renderShell({ selectedOrganizationId: ORG });
    expect(html).not.toContain(SOCIAL_NAV_LABEL);
    expect(html).not.toContain("transport_error");
    expect(html).not.toContain("forbidden");
    expect(html).toContain(">Home<");
    expect(html).toContain('aria-label="Primary"');
  });

  it("does not query enrollment without organization context", async () => {
    const html = await renderShell();
    expect(html).not.toContain(SOCIAL_NAV_LABEL);
    expect(html).toContain(">Home<");
    expect(enrollmentStatusMock).not.toHaveBeenCalled();
    expect(createServerClientMock).not.toHaveBeenCalled();
  });

  it("honors an explicit trusted true without a redundant enrollment lookup", async () => {
    const html = await renderShell({
      selectedOrganizationId: ORG,
      socialNavVisible: true,
    });
    expect(html).toContain(SOCIAL_NAV_LABEL);
    expect(enrollmentStatusMock).not.toHaveBeenCalled();
    expect(createServerClientMock).not.toHaveBeenCalled();
  });

  it("honors an explicit trusted false without a redundant enrollment lookup", async () => {
    const html = await renderShell({
      selectedOrganizationId: ORG,
      socialNavVisible: false,
    });
    expect(html).not.toContain(SOCIAL_NAV_LABEL);
    expect(html).toContain(">Home<");
    expect(enrollmentStatusMock).not.toHaveBeenCalled();
    expect(createServerClientMock).not.toHaveBeenCalled();
  });

  it("keeps pending navigation free of enrollment reads and ready Primary nav", async () => {
    const html = await renderShell({
      selectedOrganizationId: ORG,
      socialNavVisible: true,
      navigationPresentation: "pending",
    });
    expect(html).toContain("Loading workspace…");
    expect(html).not.toContain('aria-label="Primary"');
    expect(html).not.toContain(SOCIAL_NAV_LABEL);
    expect(html).not.toContain(">Menu<");
    expect(enrollmentStatusMock).not.toHaveBeenCalled();
    expect(createServerClientMock).not.toHaveBeenCalled();
  });

  it("feeds the same resolved boolean to desktop and mobile navigation", async () => {
    enrollmentStatusMock.mockResolvedValue({
      ok: true,
      status: "publishing_allowed",
      statusBeforePause: null,
    });
    const enrolled = await renderShell({ selectedOrganizationId: ORG });
    const enrolledNavs = primaryNavBlocks(enrolled);
    expect(enrolledNavs).toHaveLength(2);
    expect(enrolledNavs[0]).toContain(SOCIAL_NAV_LABEL);
    expect(enrolledNavs[1]).toContain(SOCIAL_NAV_LABEL);

    enrollmentStatusMock.mockResolvedValue({
      ok: true,
      status: "not_enrolled",
      statusBeforePause: null,
    });
    const hidden = await renderShell({ selectedOrganizationId: ORG });
    for (const nav of primaryNavBlocks(hidden)) {
      expect(nav).not.toContain(SOCIAL_NAV_LABEL);
    }

    const chrome = readSrc("src/components/app-shell-chrome.tsx");
    expect(chrome.match(/socialNavVisible=\{socialNavVisible\}/g)?.length).toBe(
      2,
    );
  });

  it("defaults chrome Social visibility to hidden without fetching", () => {
    const html = renderToStaticMarkup(
      <AppShellChrome
        activeNav="home"
        membersNavVisible={false}
        moduleNavVisibility={KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY}
      >
        <p>workspace</p>
      </AppShellChrome>,
    );
    expect(html).not.toContain(SOCIAL_NAV_LABEL);
    expect(html).toContain(">Home<");
    expect(enrollmentStatusMock).not.toHaveBeenCalled();
    expect(createServerClientMock).not.toHaveBeenCalled();
  });

  it("keeps representative error chrome fail-closed with retry and no Social", () => {
    const reset = () => undefined;
    const error = Object.assign(new Error("secret-internal"), { digest: "abc" });
    const attention = renderToStaticMarkup(
      <AttentionError error={error} reset={reset} />,
    );
    const customer = renderToStaticMarkup(
      <CustomerDetailError error={error} reset={reset} />,
    );
    const projects = renderToStaticMarkup(<ProjectsError reset={reset} />);
    const tasks = renderToStaticMarkup(<TasksError error={error} reset={reset} />);

    expect(attention).toContain("Something went wrong");
    expect(attention).toContain("Unable to display Attention");
    expect(attention).toContain("Try again");
    expect(customer).toContain("Unable to display this record");
    expect(customer).toContain("Try again");
    expect(projects).toContain("Projects could not be loaded");
    expect(projects).toContain("Try again");
    expect(tasks).toContain("Unable to display tasks");
    expect(tasks).toContain("Try again");

    for (const html of [attention, customer, projects, tasks]) {
      expect(html).not.toContain(SOCIAL_NAV_LABEL);
      expect(html).not.toContain(`href="${SOCIAL_ROUTE}`);
      expect(html).not.toContain("secret-internal");
    }
    expect(enrollmentStatusMock).not.toHaveBeenCalled();
    expect(createServerClientMock).not.toHaveBeenCalled();
  });

  it("source-locks the server/client split, Social first paint, and error-chrome imports", () => {
    const wrapper = readSrc("src/components/app-shell.tsx");
    const chrome = readSrc("src/components/app-shell-chrome.tsx");
    const navLink = readSrc(
      "src/features/social-media/ui/social-primary-nav-link.tsx",
    );
    const helper = readSrc(
      "src/features/social-media/server/load-social-primary-nav-visibility.ts",
    );
    const socialPage = readSrc("src/app/(authenticated)/social/page.tsx");

    expect(wrapper).toMatch(/export async function AppShell/);
    expect(wrapper).toContain("loadSocialPrimaryNavVisibility");
    expect(wrapper).toContain("AppShellChrome");
    expect(wrapper).not.toContain("useEffect");
    expect(wrapper).not.toContain("getSocialClosedBetaNavVisibleAction");
    expect(wrapper).not.toContain("SocialPrimaryNavLink");

    expect(chrome).toContain("export function AppShellChrome");
    expect(chrome).toContain("SocialPrimaryNavLink");
    expect(chrome).toContain('activeNav === "social"');
    expect(chrome).toContain("socialNavVisible = false");
    expect(chrome).not.toContain("server-only");
    expect(chrome).not.toContain("cookies(");
    expect(chrome).not.toContain("createSupabaseServerClient");
    expect(chrome).not.toContain("loadSocialPrimaryNavVisibility");
    expect(chrome).not.toContain("getSocialClosedBetaNavVisibleAction");
    expect(chrome).not.toContain("useEffect");
    expect(chrome).not.toContain("useState");

    expect(navLink).not.toContain('"use client"');
    expect(navLink).not.toContain("useEffect");
    expect(navLink).not.toContain("useState");
    expect(navLink).not.toContain("getSocialClosedBetaNavVisibleAction");
    expect(navLink).toContain("SOCIAL_NAV_LABEL");
    expect(navLink).toContain("visible");

    expect(helper).toContain('import "server-only"');
    expect(helper).toContain("loadSocialClosedBetaEnrollmentStatus");
    expect(helper).toContain("resolveSocialNavVisible");
    expect(helper).not.toContain("console.log");
    expect(helper).not.toContain("listSocialConnections");
    expect(helper).not.toContain("createSupabaseServiceRoleClient");

    expect(socialPage).toContain("socialNavVisible={result.closedBeta.socialNavVisible}");
    expect(socialPage).not.toContain("loadSocialPrimaryNavVisibility");
    expect(socialPage).not.toContain("getSocialClosedBetaNavVisibleAction");

    expect(ERROR_BOUNDARIES).toHaveLength(15);
    for (const relativePath of ERROR_BOUNDARIES) {
      const source = readSrc(relativePath);
      expect(source).toContain('"use client"');
      expect(source).toContain('from "@/components/app-shell-chrome"');
      expect(source).toContain("AppShellChrome");
      expect(source).not.toContain('from "@/components/app-shell"');
      expect(source).not.toContain("loadSocialPrimaryNavVisibility");
      expect(source).not.toContain("getSocialClosedBetaNavVisibleAction");
      expect(source).not.toContain("server-only");
    }
  });
});
