'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SearchOutlined } from '@ant-design/icons';

/** Global search field in the nav → routes to /search?q=. */
export function NavSearch() {
  const router = useRouter();
  const [q, setQ] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim().length >= 2) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <form onSubmit={submit} role="search" className="mr-1 hidden md:block">
      <label className="flex items-center gap-2 rounded-pill border border-hairline bg-ink/5 px-3 py-1.5 transition-colors focus-within:border-primary">
        <SearchOutlined className="!text-ink-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search photos, sets…"
          aria-label="Search"
          className="w-36 bg-transparent text-sm outline-none placeholder:text-ink-muted lg:w-56"
        />
      </label>
    </form>
  );
}
