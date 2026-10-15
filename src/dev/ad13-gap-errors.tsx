"use client";

import ProgressError from "@/app/(authenticated)/progress/error";
import ProgressCreateError from "@/app/(authenticated)/progress/new/error";
import ProgressDetailError from "@/app/(authenticated)/progress/[factId]/error";
import ProgressCorrectError from "@/app/(authenticated)/progress/[factId]/correct/error";
import ProgressVoidError from "@/app/(authenticated)/progress/[factId]/void/error";

const reset = () => undefined;

export function Ad13GapErrors({ state }: { state: string }) {
  if (state === "gap-progress-detail-error") return <ProgressDetailError error={new Error("AD13 example")} reset={reset} />;
  if (state === "gap-progress-new-error") return <ProgressCreateError error={new Error("AD13 example")} reset={reset} />;
  if (state === "gap-progress-correct-error") return <ProgressCorrectError error={new Error("AD13 example")} reset={reset} />;
  if (state === "gap-progress-void-error") return <ProgressVoidError error={new Error("AD13 example")} reset={reset} />;
  return <ProgressError error={new Error("AD13 example")} reset={reset} />;
}
