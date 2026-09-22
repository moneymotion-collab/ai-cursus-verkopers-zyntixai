import { authenticatedLayoutMetadata } from "@/features/workspace/authenticated-document-titles";

export const metadata = authenticatedLayoutMetadata();

export default function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
