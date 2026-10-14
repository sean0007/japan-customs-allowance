import { aiPluginManifest, preflight, staticJson } from "@/lib/agent-api";
import { PLUGIN, PUBLIC_URL } from "@/lib/api";

export function GET() {
  return staticJson(aiPluginManifest(PUBLIC_URL, PLUGIN));
}
export const OPTIONS = preflight;
