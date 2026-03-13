import type { MetadataRoute } from "next";

/**
 * robots.txt: asks well-behaved crawlers (including AI scrapers) not to crawl this site.
 * Covers GPTBot, ClaudeBot, CCBot, Perplexity, Google-Extended, and others.
 * Note: robots.txt is advisory; malicious scrapers can ignore it.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // OpenAI
      { userAgent: "GPTBot", allow: "", disallow: "/" },
      { userAgent: "ChatGPT-User", allow: "", disallow: "/" },
      { userAgent: "OAI-SearchBot", allow: "", disallow: "/" },
      // Anthropic
      { userAgent: "Claude-Web", allow: "", disallow: "/" },
      { userAgent: "ClaudeBot", allow: "", disallow: "/" },
      { userAgent: "anthropic-ai", allow: "", disallow: "/" },
      // Common Crawl (used by many AI training pipelines)
      { userAgent: "CCBot", allow: "", disallow: "/" },
      // Perplexity
      { userAgent: "PerplexityBot", allow: "", disallow: "/" },
      // Google AI (Bard / AI Overviews)
      { userAgent: "Google-Extended", allow: "", disallow: "/" },
      // Cohere
      { userAgent: "cohere-ai", allow: "", disallow: "/" },
      // Meta
      { userAgent: "FacebookBot", allow: "", disallow: "/" },
      // ByteDance
      { userAgent: "Bytespider", allow: "", disallow: "/" },
      // Amazon
      { userAgent: "Amazonbot", allow: "", disallow: "/" },
      // Apple
      { userAgent: "Applebot-Extended", allow: "", disallow: "/" },
    ],
    sitemap: undefined,
  };
}
