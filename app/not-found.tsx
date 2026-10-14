import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16">
      <p className="font-mono text-[11px] tracking-[0.28em] text-amber uppercase">404</p>
      <h1 className="mt-3 font-display text-5xl tracking-tight">That page is not here.</h1>
      <p className="mt-4 max-w-xl text-muted">The calculator, the API, and the disclaimer are the whole site.</p>
      <Link href="/" className="mt-6 inline-flex rounded-full bg-amber px-5 py-2.5 text-sm font-semibold text-black hover:bg-amber/90">
        Open the calculator
      </Link>
    </div>
  );
}
