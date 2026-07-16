import { redirect } from "next/navigation";
import { resolveAuthenticatedLanding } from "@/features/auth/server/resolve-authenticated-landing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  redirect(await resolveAuthenticatedLanding(supabase));
}
