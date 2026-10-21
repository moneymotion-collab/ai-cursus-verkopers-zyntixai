import { publicPageMetadata } from "@/features/public-web/metadata";
import {
  PUBLIC_PRIVACY_DESCRIPTION,
  PUBLIC_PRIVACY_TITLE,
} from "@/features/public-web/copy";
import { PUBLIC_PRIVACY_PATH } from "@/features/public-web/paths";
import { PublicPrivacyPage } from "@/features/public-web/ui/public-pages";

export const metadata = publicPageMetadata({
  title: PUBLIC_PRIVACY_TITLE,
  description: PUBLIC_PRIVACY_DESCRIPTION,
  path: PUBLIC_PRIVACY_PATH,
});

export default function PrivacyRoute() {
  return <PublicPrivacyPage />;
}
