import { notFound } from "next/navigation";
import { resolveAd02PreviewAccess } from "@/dev/ad02-preview-access";
import { Ad02PreviewBody } from "@/dev/ad02-preview-body";

export default async function Ad02PreviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  if (
    resolveAd02PreviewAccess({
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      state: params.state,
    }) === "not-found"
  ) {
    notFound();
  }
  return <Ad02PreviewBody searchParams={params} />;
}
