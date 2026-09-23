'use client';

import { useEffect, useRef, useState } from 'react';

interface RevealProps {
  children: React.ReactNode;
  /** Stagger position — each step adds 80ms. */
  index?: number;
  className?: string;
}

/**
 * Scroll reveal that degrades to plain visible content.
 *
 * The server renders the block in its final state, so the landing page is fully
 * readable without JavaScript and never ships an invisible <h1>. Once mounted,
 * anything still below the fold is pulled back and faded in as it arrives;
 * anything already on screen — and anyone who asked for reduced motion — is
 * left alone.
 */
export function Reveal({ children, index = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Already in view at hydration: showing it, then animating, would only flash.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;

    setHidden(true);
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHidden(false);
          observer.disconnect();
        }
      },
      { rootMargin: '-60px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${index * 80}ms` }}
      className={`transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none ${
        hidden ? 'translate-y-7 opacity-0' : 'translate-y-0 opacity-100'
      } ${className ?? ''}`}
    >
      {children}
    </div>
  );
}
