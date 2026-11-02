import Link from 'next/link';
import { ArrowRightOutlined } from '@ant-design/icons';

interface HomeSectionProps {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
}

/** A home-page band: heading row with an optional "see all" link, then content. */
export function HomeSection({
  title,
  subtitle,
  href,
  linkLabel = 'See all',
  children,
}: HomeSectionProps) {
  return (
    <section className="mx-auto max-w-wide px-4 py-10 sm:px-5">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-[28px]">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
        </div>
        {href && (
          <Link
            href={href}
            className="group flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary"
          >
            {linkLabel}
            <ArrowRightOutlined className="text-xs transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
