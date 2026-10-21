import { PUBLIC_ABOUT_DESCRIPTION, PUBLIC_ABOUT_TITLE } from "@/features/public-web/copy";
import { publicPageMetadata } from "@/features/public-web/metadata";
import { PUBLIC_ABOUT_PATH } from "@/features/public-web/paths";
import { PublicAboutPage } from "@/features/public-web/ui/public-pages";

export const metadata = publicPageMetadata({
  title: PUBLIC_ABOUT_TITLE,
  description: PUBLIC_ABOUT_DESCRIPTION,
  path: PUBLIC_ABOUT_PATH,
});

export default function AboutPage() {
  return <PublicAboutPage />;
}
