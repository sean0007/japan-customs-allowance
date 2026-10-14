export type FaqItem = { q: string; a: string };

/** FAQ list plus schema.org FAQPage JSON-LD, so search and AI answers can quote it. */
export function FaqSection({
  items,
  heading = "Questions people ask",
  id = "faq",
}: {
  items: readonly FaqItem[];
  heading?: string;
  id?: string;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
  return (
    <section id={id} className="mt-16 max-w-3xl">
      <h2 className="font-display text-3xl tracking-tight sm:text-4xl">{heading}</h2>
      <div className="mt-5 divide-y divide-line border-y border-line">
        {items.map((item) => (
          <details key={item.q} className="group py-4" open>
            <summary className="cursor-pointer list-none text-base font-medium text-foreground">
              {item.q}
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">{item.a}</p>
          </details>
        ))}
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </section>
  );
}
