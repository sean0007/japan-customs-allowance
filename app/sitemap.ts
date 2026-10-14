import type { MetadataRoute } from "next";
import { EXAMPLE_SHARED, resultPath } from "@/lib/share";

const SITE_URL = "https://japan-customs-allowance.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE_URL}`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}${resultPath(EXAMPLE_SHARED).replace(/&/g, "&amp;")}`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/legal/disclaimer`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}
