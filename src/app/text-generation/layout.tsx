import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Text Generation",
  description: "Text Generation using Google Gemini",
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
