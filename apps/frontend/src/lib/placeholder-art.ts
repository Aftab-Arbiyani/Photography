/**
 * Deterministic placeholder artwork for image slots that have no photograph yet.
 *
 * Every frame on the landing page is photographic by design; until a photo is
 * published the slot renders a generated duotone "plate" instead of an empty
 * box. The art is a self-contained SVG data URI — no network, no external host,
 * no layout shift — and it is a pure function of the seed, so server and client
 * render byte-identical markup (no hydration mismatch).
 */

/** Cinematic grades: [skyTop, skyMid, skyBottom, silhouette, accent]. */
const PALETTES: ReadonlyArray<readonly [string, string, string, string, string]> = [
  ['#2f6ea8', '#123c66', '#07131f', '#0a1c2e', '#7fd2ff'], // blue hour
  ['#8a4b6d', '#40203c', '#0f0812', '#241423', '#ffb0a0'], // dusk plum
  ['#2f7d6a', '#14493f', '#050f0d', '#0d2a24', '#ffd479'], // forest gold
  ['#c9773a', '#7a3c22', '#170a06', '#33170e', '#ffd9a0'], // desert amber
  ['#6d8296', '#33424f', '#0a0d11', '#1a222b', '#cfe9ff'], // slate mono
  ['#a8556a', '#5a2635', '#120709', '#2b1219', '#ffc2cf'], // rose granite
];

/** FNV-1a — small, stable, and dependency-free. */
function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Layered horizon silhouette. */
function ridge(y: number, amp: number, phase: number): string {
  const pts: string[] = [`M0 ${(y + Math.sin(phase) * amp).toFixed(1)}`];
  for (let x = 80; x <= 1200; x += 80) {
    const t = phase + x / 240;
    pts.push(`L${x} ${(y + Math.sin(t) * amp + Math.sin(t * 2.7) * amp * 0.45).toFixed(1)}`);
  }
  pts.push('L1200 800 L0 800 Z');
  return pts.join(' ');
}

/** Soft stacked sweeps rather than peaks. */
function dune(y: number, amp: number): string {
  return [
    `M0 ${y}`,
    `C 300 ${(y - amp).toFixed(1)} 520 ${(y + amp).toFixed(1)} 800 ${(y - amp * 0.7).toFixed(1)}`,
    `S 1060 ${(y + amp * 0.5).toFixed(1)} 1200 ${(y - amp * 0.25).toFixed(1)}`,
    'L1200 800 L0 800 Z',
  ].join(' ');
}

/**
 * Generate the plate for a seed. Three scene grammars (horizon, dunes, aurora)
 * keep a grid of placeholders from looking repetitive.
 *
 * @param seed  stable identifier for the slot (e.g. `mosaic-2`, a photo slug)
 * @param grain adds fine film grain — reserve it for large surfaces (hero, CTA
 *              band); it is an extra filter pass, so skip it on small tiles.
 * @param palette pins the colour grade instead of deriving it from the seed —
 *                used where a run of plates should feel deliberately sequenced.
 */
export function artDataUri(seed: string, grain = false, palette?: number): string {
  const h = hash(seed);
  const [top, mid, bottom, shape, accent] = PALETTES[(palette ?? h) % PALETTES.length];
  const scene = h % 3;
  const sunX = 200 + ((h >> 3) % 800);
  const horizon = 430 + ((h >> 11) % 90);
  const sunY = horizon - 60 - ((h >> 7) % 140);
  const phase = ((h >> 5) % 100) / 12;

  const layers =
    scene === 0
      ? `<path d="${ridge(horizon + 60, 62, phase)}" fill="${shape}" opacity=".62"/>
<path d="${ridge(horizon + 150, 48, phase + 2.1)}" fill="${shape}" opacity=".85"/>
<path d="${ridge(horizon + 250, 30, phase + 4.2)}" fill="${bottom}"/>`
      : scene === 1
        ? `<path d="${dune(horizon + 70, 80)}" fill="${shape}" opacity=".6"/>
<path d="${dune(horizon + 170, 62)}" fill="${shape}" opacity=".88"/>
<path d="${dune(horizon + 280, 40)}" fill="${bottom}"/>`
        : `<g filter="url(#soft)" opacity=".5">
<path d="M-120 ${300 + (h % 70)} C 320 ${170 + (h % 90)} 820 ${450 - (h % 80)} 1320 ${250 + (h % 70)}" stroke="${accent}" stroke-width="70" fill="none"/>
<path d="M-120 ${450 + (h % 60)} C 360 ${310 + (h % 70)} 880 ${590 - (h % 60)} 1320 ${400 + (h % 60)}" stroke="${accent}" stroke-width="34" fill="none" opacity=".7"/>
</g>
<path d="${dune(horizon + 230, 46)}" fill="${bottom}"/>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset=".38" stop-color="${mid}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>
<radialGradient id="glow" cx="${(sunX / 1200).toFixed(3)}" cy="${(sunY / 800).toFixed(3)}" r=".34"><stop offset="0" stop-color="${accent}" stop-opacity=".62"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>
<radialGradient id="vig" cx=".5" cy=".42" r=".8"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".4"/></radialGradient>
<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>
<filter id="disc" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="18"/></filter>
${grain ? '<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2"/><feColorMatrix type="saturate" values="0"/></filter>' : ''}
</defs>
<rect width="1200" height="800" fill="url(#sky)"/>
<rect width="1200" height="800" fill="url(#glow)"/>
<circle cx="${sunX}" cy="${sunY}" r="34" fill="${accent}" opacity=".8" filter="url(#disc)"/>
${layers}
<rect width="1200" height="800" fill="url(#vig)"/>
${grain ? '<rect width="1200" height="800" filter="url(#grain)" opacity=".08"/>' : ''}
</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg.replace(/\n/g, ''))}`;
}
