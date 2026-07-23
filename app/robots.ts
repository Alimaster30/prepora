import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return {
    rules: [
      { userAgent: "*", allow: ["/", "/privacy", "/terms"], disallow: ["/api/", "/account", "/interview", "/mock-interview", "/resume", "/settings"] },
    ],
    sitemap: `${origin.replace(/\/$/, "")}/sitemap.xml`,
  };
}
