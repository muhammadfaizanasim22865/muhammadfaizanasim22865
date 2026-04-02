import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Python DSA Code Analyzer",
  description:
    "Analyze Python DSA solutions for complexity, patterns, and mistakes using rule-based AST parsing — runs entirely in your browser via Pyodide, no server required.",
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


