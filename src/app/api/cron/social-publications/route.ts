/**
 * Vercel Cron: fail-closed Social publication scheduler (SMM-B1.11-C).
 * Machine Authorization: Bearer CRON_SECRET. No member session privileges.
 * Production verification is dry-run only — no Instagram provider write.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorizeSocialSchedulerCronHeader } from "@/features/social-media/server/scheduler-cron-auth";
import { runSocialPublicationScheduler } from "@/features/social-media/server/run-social-publication-scheduler";
import {
  createSocialSchedulerDatabaseClient,
  isSocialSchedulerDatabaseConfigured,
} from "@/features/social-media/server/scheduler-service-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Instagram container poll sleeps up to 240s plus HTTP. Historical IMAGE publish ~70.69s. */
export const maxDuration = 300;

function deny(status: number, reason: string): NextResponse {
  console.info(
    JSON.stringify({
      event: "social_scheduler_auth_denied",
      reason,
    }),
  );
  return NextResponse.json(
    { ok: false, reason },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

async function handle(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  if (url.searchParams.has("secret") || url.searchParams.has("cron_secret")) {
    return deny(401, "missing_credentials");
  }

  const auth = authorizeSocialSchedulerCronHeader({
    authorizationHeader: request.headers.get("authorization"),
  });
  if (!auth.ok) {
    const status = auth.reason === "missing_secret" ? 503 : 401;
    return deny(status, auth.reason);
  }

  if (!isSocialSchedulerDatabaseConfigured()) {
    return deny(503, "service_unavailable");
  }

  const summary = await runSocialPublicationScheduler({
    supabase: createSocialSchedulerDatabaseClient(),
  });

  return NextResponse.json(
    {
      ok: true,
      ...summary,
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handle(request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handle(request);
}
