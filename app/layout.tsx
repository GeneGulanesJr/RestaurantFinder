import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Restaurant Finder",
  description: "Find restaurants using natural language",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Ask AI crawlers not to use this site (honored by OpenAI, Anthropic, etc.) */}
        <meta name="GPTBot" content="noindex, nofollow" />
        <meta name="Claude-Web" content="noindex, nofollow" />
        <meta name="ClaudeBot" content="noindex, nofollow" />
        <meta name="CCBot" content="noindex, nofollow" />
        <meta name="PerplexityBot" content="noindex, nofollow" />
        <meta name="Google-Extended" content="noindex, nofollow" />
      </head>
      <body>{children}</body>
    </html>
  );
}
