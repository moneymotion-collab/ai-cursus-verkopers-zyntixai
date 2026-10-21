import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveAuthenticatedEntryPath } from "@/features/auth/server/resolve-registration-destination";
import { readInvitationCookiesFromStore } from "@/features/invitations/server/resolve-invitation-auth-state";
import { PUBLIC_HOME_DESCRIPTION, PUBLIC_HOME_TITLE } from "@/features/public-web/copy";
import { publicPageMetadata } from "@/features/public-web/metadata";
import { PUBLIC_HOME_PATH } from "@/features/public-web/paths";
import { PublicHomepage } from "@/features/public-web/ui/public-homepage";

export const metadata = publicPageMetadata({
  title: PUBLIC_HOME_TITLE,
  description: PUBLIC_HOME_DESCRIPTION,
  path: PUBLIC_HOME_PATH,
});

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <PublicHomepage />;
  }

  const cookieStore = await cookies();
  redirect(
    await resolveAuthenticatedEntryPath(supabase, user, {
      invitationCookies: readInvitationCookiesFromStore(cookieStore),
    }),
  );
}
