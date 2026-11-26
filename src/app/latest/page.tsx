'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Media } from '@/types/media';
import { PosterCard } from '@/components/poster-card';

export default function Latest() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  useEffect(() => { fetch('/api/latest').then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.error); setData(result); }).catch(reason => setError(reason.message)); }, []);
  return <main className="min-h-screen bg-[#050914] px-5 pb-16 text-white sm:px-12">
    <Link href="/" className="flex h-20 items-center gap-2 text-sm text-white/60"><ArrowLeft size={16}/> CINETECH</Link>
    <p className="text-[10px] uppercase tracking-[.3em] text-sky-200">Local catalogue</p>
    <h1 className="mt-2 font-[Manrope] text-4xl font-extrabold">Movie collection</h1>
    <p className="mt-2 text-sm text-white/50">A static snapshot from the Kaggle TMDB 5000 Movie Dataset.</p>
    {error && <p className="mt-7 text-sm text-white/50">{error}</p>}
    {data && <section className="mt-10"><h2 className="mb-5 text-xl font-bold">Films in the dataset</h2><div className="hide-scroll flex gap-4 overflow-x-auto">{data.movies.slice(0, 30).map((movie: Media) => <PosterCard key={movie.id} item={movie}/>)}</div></section>}
    <p className="mt-8 text-xs text-white/40">This dataset contains movies only. It does not include current releases or TV shows.</p>
  </main>;
}
