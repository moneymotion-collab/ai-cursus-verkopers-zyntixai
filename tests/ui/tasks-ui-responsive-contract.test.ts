import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function readCss(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const TASK_UI_CSS_MODULES = [
  "src/features/tasks/ui/task-list.module.css",
  "src/features/tasks/ui/task-detail.module.css",
  "src/features/tasks/ui/task-form.module.css",
  "src/features/tasks/ui/task-lifecycle.module.css",
  "src/features/tasks/ui/task-list-filters.module.css",
] as const;

const APP_SHELL_CSS = "src/components/app-shell.module.css";

const FIXED_VIEWPORT_BLOCKING_PATTERN =
  /position:\s*fixed|min-width:\s*9\d{2}px|width:\s*9\d{2}px/;

const GOVERNED_SKIP_LINK_FOCUS_SELECTORS = [
  ".skipLink:focus",
  ".skipLink:focus-visible",
] as const;

const REQUIRED_FOCUSED_SKIP_LINK_DECLARATIONS = [
  "position: fixed",
  "left: 0.75rem",
  "top: 0.75rem",
  "z-index: 50",
  "clip: unset",
  "clip-path: none",
  "width: auto",
  "height: auto",
  "overflow: visible",
  "pointer-events: auto",
  "outline: 2px solid var(--focus-color)",
] as const;

type CssStyleRule = {
  selector: string;
  body: string;
  raw: string;
};

function stripCssComments(css: string): string {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  if (stripped.includes("/*")) {
    throw new Error("Unterminated CSS comment");
  }
  return stripped;
}

function extractStyleRules(css: string): CssStyleRule[] {
  const source = stripCssComments(css);
  const rules: CssStyleRule[] = [];

  function walk(block: string): void {
    let index = 0;
    let statementStart = 0;

    while (index < block.length) {
      if (block[index] === "{") {
        const selector = block.slice(statementStart, index).trim();
        let depth = 1;
        const bodyStart = index + 1;
        let cursor = bodyStart;
        while (cursor < block.length) {
          if (block[cursor] === "{") {
            depth += 1;
          } else if (block[cursor] === "}") {
            depth -= 1;
            if (depth === 0) {
              break;
            }
          }
          cursor += 1;
        }
        if (depth !== 0) {
          throw new Error("CSS brace mismatch");
        }
        const body = block.slice(bodyStart, cursor);
        const raw = block.slice(statementStart, cursor + 1).trim();
        if (selector.startsWith("@")) {
          walk(body);
        } else if (selector.length > 0) {
          rules.push({ selector, body, raw });
        } else {
          throw new Error("CSS rule is missing a selector");
        }
        index = cursor + 1;
        statementStart = index;
        continue;
      }
      index += 1;
    }

    const trailing = block.slice(statementStart).trim();
    if (trailing.length > 0) {
      throw new Error("Unterminated CSS selector");
    }
  }

  walk(source);
  return rules;
}

function selectorTokens(selector: string): string[] {
  return selector
    .split(",")
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter((part) => part.length > 0);
}

function isGovernedSkipLinkFocusSelector(selector: string): boolean {
  const tokens = selectorTokens(selector);
  if (tokens.length !== GOVERNED_SKIP_LINK_FOCUS_SELECTORS.length) {
    return false;
  }
  const unique = new Set(tokens);
  if (unique.size !== GOVERNED_SKIP_LINK_FOCUS_SELECTORS.length) {
    return false;
  }
  return GOVERNED_SKIP_LINK_FOCUS_SELECTORS.every((token) => unique.has(token));
}

function findUniqueRule(
  rules: CssStyleRule[],
  predicate: (rule: CssStyleRule) => boolean,
  label: string,
): CssStyleRule {
  const matches = rules.filter(predicate);
  if (matches.length === 0) {
    throw new Error(`Missing ${label}`);
  }
  if (matches.length > 1) {
    throw new Error(`More than one ${label}`);
  }
  return matches[0];
}

function assertBodyContains(body: string, declaration: string, label: string): void {
  if (!body.includes(declaration)) {
    throw new Error(`${label} is missing ${declaration}`);
  }
}

function removeExactRuleOnce(css: string, raw: string): string {
  const index = css.indexOf(raw);
  if (index === -1) {
    throw new Error("Validated CSS rule is not present for removal");
  }
  if (css.indexOf(raw, index + raw.length) !== -1) {
    throw new Error("Validated CSS rule occurs more than once");
  }
  return `${css.slice(0, index)}${css.slice(index + raw.length)}`;
}

function cssWithoutGovernedSkipLinkFocusOverlay(css: string): string {
  const source = stripCssComments(css);
  const rules = extractStyleRules(source);
  const overlay = findUniqueRule(
    rules,
    (rule) => isGovernedSkipLinkFocusSelector(rule.selector),
    "governed focused skip-link rule",
  );
  for (const declaration of REQUIRED_FOCUSED_SKIP_LINK_DECLARATIONS) {
    assertBodyContains(overlay.body, declaration, "Focused skip-link overlay");
  }
  return removeExactRuleOnce(source, overlay.raw);
}

function styleRuleBodies(css: string): string[] {
  return extractStyleRules(css).map((rule) => rule.body);
}

function assertNoFixedViewportBlockingLayout(
  css: string,
  options: { allowGovernedSkipLinkFocusOverlay: boolean },
): void {
  const scanned = options.allowGovernedSkipLinkFocusOverlay
    ? cssWithoutGovernedSkipLinkFocusOverlay(css)
    : stripCssComments(css);
  for (const body of styleRuleBodies(scanned)) {
    if (FIXED_VIEWPORT_BLOCKING_PATTERN.test(body)) {
      throw new Error("Fixed viewport-blocking layout remains");
    }
  }
}

const SAFE_FOCUSED_SKIP_LINK_OVERLAY = `.skipLink:focus,
.skipLink:focus-visible {
  position: fixed;
  left: 0.75rem;
  top: 0.75rem;
  z-index: 50;
  clip: unset;
  clip-path: none;
  width: auto;
  height: auto;
  overflow: visible;
  pointer-events: auto;
  outline: 2px solid var(--focus-color);
  outline-offset: 2px;
}`;

describe("tasks UI responsive CSS contract", () => {
  it("shows desktop table and hides cards at 1024px breakpoint", () => {
    const css = readCss("src/features/tasks/ui/task-list.module.css");
    expect(css).toContain("@media (min-width: 1024px)");
    expect(css).toContain(".tableWrap");
    expect(css).toContain(".cardList");
  });

  it("keeps task forms within readable max width", () => {
    const formCss = readCss("src/features/tasks/ui/task-form.module.css");
    const lifecycleCss = readCss("src/features/tasks/ui/task-lifecycle.module.css");
    expect(formCss).toContain("max-width");
    expect(lifecycleCss).toContain("max-width");
  });

  it("provides reduced-motion handling on loading states", () => {
    const tasksLoading = readCss("src/app/(authenticated)/tasks/loading.module.css");
    const detailLoading = readCss("src/app/(authenticated)/tasks/[taskId]/loading.module.css");
    expect(tasksLoading).toContain("prefers-reduced-motion");
    expect(detailLoading).toContain("prefers-reduced-motion");
  });

  it("uses touch-friendly minimum control sizes in shell and forms", () => {
    const shellCss = readCss(APP_SHELL_CSS);
    const formCss = readCss("src/features/tasks/ui/task-form.module.css");
    expect(shellCss).toContain("min-height: 2.75rem");
    expect(formCss).toContain("min-height: 2.75rem");
  });

  it("avoids fixed viewport-blocking widths in task UI modules", () => {
    for (const modulePath of TASK_UI_CSS_MODULES) {
      expect(() =>
        assertNoFixedViewportBlockingLayout(readCss(modulePath), {
          allowGovernedSkipLinkFocusOverlay: false,
        }),
      ).not.toThrow();
    }

    expect(() =>
      assertNoFixedViewportBlockingLayout(readCss(APP_SHELL_CSS), {
        allowGovernedSkipLinkFocusOverlay: true,
      }),
    ).not.toThrow();
  });
});

describe("governed focused skip-link overlay exception", () => {
  it("accepts only one focused skip-link overlay with governed selectors and safe properties", () => {
    const css = readCss(APP_SHELL_CSS);
    const remainder = cssWithoutGovernedSkipLinkFocusOverlay(css);
    const overlay = findUniqueRule(
      extractStyleRules(css),
      (rule) => isGovernedSkipLinkFocusSelector(rule.selector),
      "governed focused skip-link rule",
    );

    expect(selectorTokens(overlay.selector)).toEqual(
      expect.arrayContaining([...GOVERNED_SKIP_LINK_FOCUS_SELECTORS]),
    );
    expect(selectorTokens(overlay.selector)).toHaveLength(
      GOVERNED_SKIP_LINK_FOCUS_SELECTORS.length,
    );
    for (const declaration of REQUIRED_FOCUSED_SKIP_LINK_DECLARATIONS) {
      expect(overlay.body).toContain(declaration);
    }
    for (const body of styleRuleBodies(remainder)) {
      expect(body).not.toMatch(FIXED_VIEWPORT_BLOCKING_PATTERN);
    }
    expect(remainder).toContain(".skipLink {");
    expect(remainder).toContain(".header {");
    expect(remainder).toContain(".nav {");
    expect(remainder).toContain(".navCluster {");
    expect(remainder).toContain(".main {");
  });

  it("keeps the unfocused skip-link clipped, non-interactive, and not fixed", () => {
    const css = readCss(APP_SHELL_CSS);
    const unfocused = findUniqueRule(
      extractStyleRules(css),
      (rule) => {
        const tokens = selectorTokens(rule.selector);
        return tokens.length === 1 && tokens[0] === ".skipLink";
      },
      "unfocused skip-link rule",
    );

    expect(unfocused.body).toContain("position: absolute");
    expect(unfocused.body).not.toMatch(/position:\s*fixed/);
    expect(unfocused.body).toContain("clip: rect(0 0 0 0)");
    expect(unfocused.body).toContain("clip-path: inset(50%)");
    expect(unfocused.body).toContain("width: 1px");
    expect(unfocused.body).toContain("height: 1px");
    expect(unfocused.body).toContain("overflow: hidden");
    expect(unfocused.body).toContain("pointer-events: none");
    expect(unfocused.body).not.toContain("pointer-events: auto");
  });
});

describe("skip-link overlay matcher fail-closed behavior", () => {
  it("accepts a synthetic safe focused skip-link overlay", () => {
    expect(() =>
      assertNoFixedViewportBlockingLayout(SAFE_FOCUSED_SKIP_LINK_OVERLAY, {
        allowGovernedSkipLinkFocusOverlay: true,
      }),
    ).not.toThrow();
  });

  it("rejects a synthetic fixed header even when the skip-link overlay is present", () => {
    expect(() =>
      assertNoFixedViewportBlockingLayout(
        `${SAFE_FOCUSED_SKIP_LINK_OVERLAY}\n.header { position: fixed; }`,
        { allowGovernedSkipLinkFocusOverlay: true },
      ),
    ).toThrow(/Fixed viewport-blocking layout remains/);
  });

  it("rejects a second fixed structural rule after the governed overlay is removed", () => {
    const remainder = cssWithoutGovernedSkipLinkFocusOverlay(
      `${SAFE_FOCUSED_SKIP_LINK_OVERLAY}\n.nav { position: relative; }\n.main { position: fixed; }`,
    );
    expect(
      styleRuleBodies(remainder).some((body) =>
        FIXED_VIEWPORT_BLOCKING_PATTERN.test(body),
      ),
    ).toBe(true);
  });

  it("does not treat a broader skip-link selector as the governed overlay", () => {
    expect(() =>
      cssWithoutGovernedSkipLinkFocusOverlay(
        `.skipLink:focus, .skipLink:focus-visible, .header {\n  position: fixed;\n}`,
      ),
    ).toThrow(/Missing governed focused skip-link rule/);
  });

  it("fails closed when a second governed focused skip-link rule exists", () => {
    expect(() =>
      cssWithoutGovernedSkipLinkFocusOverlay(
        `${SAFE_FOCUSED_SKIP_LINK_OVERLAY}\n.skipLink:focus-visible, .skipLink:focus {\n  position: fixed;\n  left: 0.75rem;\n  top: 0.75rem;\n  z-index: 50;\n  clip: unset;\n  clip-path: none;\n  width: auto;\n  height: auto;\n  overflow: visible;\n  pointer-events: auto;\n  outline: 2px solid var(--focus-color);\n}`,
      ),
    ).toThrow(/More than one governed focused skip-link rule/);
  });

  it("still rejects fixed positioning on other structural selectors", () => {
    const structuralRules = [
      ".shell { position: fixed; }",
      ".header { position: fixed; }",
      ".desktopCluster { position: fixed; }",
      ".nav { position: fixed; }",
      ".navCluster { position: fixed; }",
      ".main { position: fixed; }",
      ".card { position: fixed; }",
      ".statePanel { position: fixed; }",
      ".header { min-width: 960px; }",
      ".card { width: 960px; }",
    ];

    for (const extra of structuralRules) {
      expect(() =>
        assertNoFixedViewportBlockingLayout(
          `${SAFE_FOCUSED_SKIP_LINK_OVERLAY}\n${extra}`,
          { allowGovernedSkipLinkFocusOverlay: true },
        ),
      ).toThrow(/Fixed viewport-blocking layout remains/);
    }
  });
});
