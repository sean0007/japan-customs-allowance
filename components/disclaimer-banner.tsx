import { DISCLAIMER_SHORT } from "@/lib/site";

export function DisclaimerBanner() {
  return (
    <div
      data-testid="disclaimer-banner"
      className="sticky top-0 z-50 border-b border-amber/30 bg-[#1a1408] px-4 py-2.5 text-center"
    >
      <p className="mx-auto max-w-5xl text-[13px] font-medium leading-snug text-amber-100 sm:text-sm">
        {DISCLAIMER_SHORT}{" "}
        <a
          href="/legal/disclaimer"
          className="underline decoration-amber/70 underline-offset-2 hover:text-white"
        >
          Full disclaimer
        </a>
      </p>
    </div>
  );
}
