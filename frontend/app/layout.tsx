import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DSA Mistake Analyzer",
  description:
    "Analyze Python DSA solutions for complexity, patterns, and mistakes using rule-based AST parsing — no AI required.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-gray-950">{children}</body>
    </html>
  );
}


