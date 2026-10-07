import { PUBLIC_PLATFORM_DESCRIPTION, PUBLIC_PLATFORM_TITLE } from "@/features/public-web/copy";
import { publicPageMetadata } from "@/features/public-web/metadata";
import { PUBLIC_PLATFORM_PATH } from "@/features/public-web/paths";
import { PublicPlatformPage } from "@/features/public-web/ui/public-pages";

export const metadata = publicPageMetadata({
  title: PUBLIC_PLATFORM_TITLE,
  description: PUBLIC_PLATFORM_DESCRIPTION,
  path: PUBLIC_PLATFORM_PATH,
});

export default function PlatformPage() {
  return <PublicPlatformPage />;
}
