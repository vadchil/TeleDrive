import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.APP_URL?.trim() || "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/admin/", "/forgot-password/", "/reset-password/", "/api/"],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
