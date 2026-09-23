import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="flex min-h-[80svh] items-center justify-center px-5">
      <div className="text-center">
        <p className="font-display text-[120px] font-semibold leading-none tracking-tight text-primary">
          404
        </p>
        <h1 className="font-display mt-2 text-2xl font-semibold">This frame doesn’t exist.</h1>
        <p className="mt-3 text-ink-muted">
          The page you’re looking for may have moved or never existed.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-pill bg-primary px-6 py-3 text-base text-white transition active:scale-95"
        >
          Back home
        </Link>
      </div>
    </section>
  );
}
