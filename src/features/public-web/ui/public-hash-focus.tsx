"use client";

import { useEffect } from "react";
import { PUBLIC_SECTION_IDS } from "@/features/public-web/copy";

/**
 * Progressive enhancement: move focus to in-page destinations.
 * Native fragment navigation works without this module.
 * Skip target `#hoofdinhoud` keeps focus on main. Other destinations
 * follow PW-8 Anchor Model B by focusing the destination heading.
 */
function resolveFocusElement(target: HTMLElement, id: string): HTMLElement {
  if (id === PUBLIC_SECTION_IDS.main) {
    return target;
  }
  if (/^H[1-6]$/.test(target.tagName)) {
    return target;
  }
  const heading = target.querySelector("h1, h2, h3, h4, h5, h6");
  return heading instanceof HTMLElement ? heading : target;
}

export function PublicHashFocus() {
  useEffect(() => {
    const focusHashTarget = () => {
      const raw = window.location.hash.replace(/^#/, "");
      if (!raw) {
        return;
      }

      let id = raw;
      try {
        id = decodeURIComponent(raw);
      } catch {
        return;
      }
      if (!id) {
        return;
      }

      const target = document.getElementById(id);
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const focusEl = resolveFocusElement(target, id);
      if (!focusEl.hasAttribute("tabindex")) {
        focusEl.setAttribute("tabindex", "-1");
      }
      focusEl.focus({ preventScroll: true });
    };

    focusHashTarget();
    window.addEventListener("hashchange", focusHashTarget);
    return () => {
      window.removeEventListener("hashchange", focusHashTarget);
    };
  }, []);

  return null;
}
