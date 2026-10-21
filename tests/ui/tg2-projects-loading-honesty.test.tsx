import React from "react";
import { describe, expect, it } from "vitest";
import ProjectsLoading from "@/app/(authenticated)/projects/loading";
import { renderAsyncServerTree } from "../helpers/render-async-server-tree";

describe("TG2 Projects route-level loading honesty", () => {
  it("renders pending Projects loading without ready navigation, empty-state copy, or fake records", async () => {
    const html = await renderAsyncServerTree(<ProjectsLoading />);

    expect(html).toContain("Loading projects");
    expect(html).toContain("Please wait while the workspace is prepared.");
    expect(html).toContain("Loading workspace…");
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-busy="true"');

    expect(html).toContain("ZyntixAI");
    expect(html).toContain('id="main-content"');
    expect(html).toContain("Skip to main content");

    expect(html).not.toContain('aria-label="Primary"');
    expect(html).not.toContain('href="/home"');
    expect(html).not.toContain(">Home</a>");
    expect(html).not.toContain(">Menu<");

    expect(html).not.toContain("New project");
    expect(html).not.toContain("New job");
    expect(html).not.toContain("/projects/new");
    expect(html).not.toContain("No projects found");
    expect(html).not.toContain("No jobs found");
    expect(html).not.toContain("No projects yet");
    expect(html).not.toContain("Delivery work for");
  });
});
