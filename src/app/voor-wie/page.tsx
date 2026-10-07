import { PUBLIC_AUDIENCES_DESCRIPTION, PUBLIC_AUDIENCES_TITLE } from "@/features/public-web/copy";
import { publicPageMetadata } from "@/features/public-web/metadata";
import { PUBLIC_AUDIENCES_PATH } from "@/features/public-web/paths";
import { PublicAudiencesPage } from "@/features/public-web/ui/public-pages";

export const metadata = publicPageMetadata({
  title: PUBLIC_AUDIENCES_TITLE,
  description: PUBLIC_AUDIENCES_DESCRIPTION,
  path: PUBLIC_AUDIENCES_PATH,
});

export default function AudiencesPage() {
  return <PublicAudiencesPage />;
}
