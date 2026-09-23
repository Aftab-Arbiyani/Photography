import Link from 'next/link';
import type { PublicPhoto } from '@photography/types';
import { PhotoFrame } from '@/components/media/photo-frame';
import { Reveal } from '@/components/landing/reveal';

interface CtaBandProps {
  photo?: PublicPhoto | null;
}

/** Closing full-bleed band: one photograph, one decision. */
export function CtaBand({ photo }: CtaBandProps) {
  return (
    <section className="relative isolate overflow-hidden bg-tile-1 px-5 py-28 text-white sm:py-36">
      <PhotoFrame photo={photo} seed="cta-band" grain sizes="100vw" />
      <div aria-hidden className="absolute inset-0 bg-black/65" />
      <div aria-hidden className="film-grain absolute inset-0" />

      <Reveal className="relative z-10 mx-auto max-w-content text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/80">
          For photographers
        </p>
        <h2 className="font-display mt-5 text-[clamp(30px,5vw,54px)] font-semibold leading-[1.05] tracking-[-0.02em]">
          Your work deserves a better wall.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/85">
          Upload once — derivatives, EXIF, blur placeholders and the storefront are handled for you.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="rounded-pill bg-white px-7 py-3.5 text-[15px] font-medium text-ink transition hover:bg-white/90 active:scale-95"
          >
            Create your account
          </Link>
          <Link
            href="/pricing"
            className="rounded-pill border border-white/30 bg-white/5 px-7 py-3.5 text-[15px] font-medium text-white backdrop-blur transition hover:border-white/70 hover:bg-white/10 active:scale-95"
          >
            See membership plans
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
