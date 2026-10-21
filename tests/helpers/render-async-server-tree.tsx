import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

function isThenable(value: unknown): value is Promise<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "then" in value &&
    typeof (value as { then: unknown }).then === "function"
  );
}

function isInvalidHookCall(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /Invalid hook call|Dispatcher is null|Cannot read properties of null \(reading 'use|useSearchParams|useContext|useState|useEffect|useRef|useTransition|suspended while responding/i.test(
    message,
  );
}

function isCallableComponent(
  type: unknown,
): type is (props: unknown) => unknown {
  return typeof type === "function";
}

/**
 * Await AsyncFunction roots (AppShell) and invoke sync server wrappers
 * (loading.tsx, FieldShell) so chrome can paint. Leave Suspense intact so
 * renderToStaticMarkup uses PrimaryNavFallback instead of OrgAwareLink.
 */
export async function resolveAsyncServerTree(
  node: React.ReactNode,
): Promise<React.ReactNode> {
  if (node == null || typeof node === "boolean") {
    return node;
  }
  if (typeof node === "string" || typeof node === "number") {
    return node;
  }
  if (Array.isArray(node)) {
    return Promise.all(node.map((child) => resolveAsyncServerTree(child)));
  }
  if (!React.isValidElement(node)) {
    return node;
  }

  const type: unknown = node.type;
  if (type === React.Suspense) {
    return node;
  }

  if (isCallableComponent(type)) {
    try {
      const rendered = type(node.props);
      const value = isThenable(rendered) ? await rendered : rendered;
      return resolveAsyncServerTree(value as React.ReactNode);
    } catch (error) {
      if (isInvalidHookCall(error)) {
        return node;
      }
      throw error;
    }
  }

  if (type === React.Fragment) {
    return resolveAsyncServerTree(
      (node.props as { children?: React.ReactNode }).children,
    );
  }

  const element = node as React.ReactElement<{ children?: React.ReactNode }>;
  if (element.props.children == null) {
    return element;
  }
  const resolvedChildren = await resolveAsyncServerTree(element.props.children);
  if (resolvedChildren === element.props.children) {
    return element;
  }
  return React.cloneElement(element, undefined, resolvedChildren);
}

export async function renderAsyncServerTree(
  node: React.ReactNode,
): Promise<string> {
  return renderToStaticMarkup(<>{await resolveAsyncServerTree(node)}</>);
}
