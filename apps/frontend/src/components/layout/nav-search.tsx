'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SearchOutlined } from '@ant-design/icons';

interface NavSearchProps {
  /** Rendered over a dark hero — invert the field so it stays visible. */
  onDark?: boolean;
}

/** Compact global search box in the nav → routes to /search?q=. */
export function NavSearch({ onDark = false }: NavSearchProps) {
  const router = useRouter();
  const [q, setQ] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim().length >= 2) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <form onSubmit={submit} className="hidden items-center md:flex">
      <div
        className={`flex items-center gap-2 rounded-pill px-3 py-1.5 transition-colors ${
          onDark ? 'bg-white/15 backdrop-blur' : 'bg-ink/5 dark:bg-white/10'
        }`}
      >
        <SearchOutlined className={onDark ? 'text-white/70' : 'text-ink-muted'} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          aria-label="Search"
          className={`w-28 bg-transparent text-[12px] outline-none transition-all focus:w-40 ${
            onDark ? 'text-white placeholder:text-white/60' : 'placeholder:text-ink-muted'
          }`}
        />
      </div>
    </form>
  );
}
