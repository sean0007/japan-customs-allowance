"use client";

import { useState } from "react";

export function ShareBar({ url, text }: { url: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const intent = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        data-testid="copy-link"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            window.prompt("Copy this link", url);
          }
        }}
        className="rounded-full bg-amber px-4 py-2 text-sm font-semibold text-black hover:bg-amber/90"
      >
        {copied ? "Link copied" : "Copy link"}
      </button>
      <a
        href={intent}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-foreground hover:border-amber/60"
      >
        Share on X
      </a>
    </div>
  );
}
