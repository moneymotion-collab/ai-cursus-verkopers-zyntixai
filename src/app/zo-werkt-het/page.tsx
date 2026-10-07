import { PUBLIC_HOW_DESCRIPTION, PUBLIC_HOW_TITLE } from "@/features/public-web/copy";
import { publicPageMetadata } from "@/features/public-web/metadata";
import { PUBLIC_HOW_PATH } from "@/features/public-web/paths";
import { PublicHowPage } from "@/features/public-web/ui/public-pages";

export const metadata = publicPageMetadata({
  title: PUBLIC_HOW_TITLE,
  description: PUBLIC_HOW_DESCRIPTION,
  path: PUBLIC_HOW_PATH,
});

export default function HowPage() {
  return <PublicHowPage />;
}
