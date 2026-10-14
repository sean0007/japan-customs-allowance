import { DISCLAIMER_SHORT, HONESTY } from "@/lib/site";

export function CardDisclaimer() {
  return (
    <footer className="sticky bottom-0 border-t border-white/10 bg-black/80 px-5 py-4 text-xs leading-relaxed text-muted backdrop-blur-sm sm:px-7">
      <p>{DISCLAIMER_SHORT}</p>
      <p className="mt-1">{HONESTY}</p>
    </footer>
  );
}
