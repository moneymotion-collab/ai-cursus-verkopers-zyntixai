import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveAuthenticatedEntryPath } from "@/features/auth/server/resolve-registration-destination";
import { readInvitationCookiesFromStore } from "@/features/invitations/server/resolve-invitation-auth-state";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  redirect(
    await resolveAuthenticatedEntryPath(supabase, user, {
      invitationCookies: readInvitationCookiesFromStore(cookieStore),
    }),
  );
}
