import type { Metadata } from "next";
import { PUBLIC_NOT_FOUND_TITLE } from "@/features/public-web/copy";
import { PublicNotFound } from "@/features/public-web/ui/public-pages";

export const metadata: Metadata = {
  title: PUBLIC_NOT_FOUND_TITLE,
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <PublicNotFound />;
}
