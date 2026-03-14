import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";

const sans = Outfit({
  subsets: ["latin"],
  variable: "--rf-font-sans",
  display: "swap",
});

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--rf-font-display",
  display: "swap",
});

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
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <head>
        {/* Ask AI crawlers not to use this site (honored by OpenAI, Anthropic, etc.) */}
        <meta name="GPTBot" content="noindex, nofollow" />
        <meta name="Claude-Web" content="noindex, nofollow" />
        <meta name="ClaudeBot" content="noindex, nofollow" />
        <meta name="CCBot" content="noindex, nofollow" />
        <meta name="PerplexityBot" content="noindex, nofollow" />
        <meta name="Google-Extended" content="noindex, nofollow" />
      </head>
      <body className="bg-bg text-fg bg-pattern min-h-screen">
        <div className="relative min-h-screen">
          {/* Single solid accent line — avoids generic gradient stripe */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent/80" />
          {children}
        </div>
      </body>
    </html>
  );
}
