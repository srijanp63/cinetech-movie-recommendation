import Link from 'next/link';
import { ArrowLeft, Database } from 'lucide-react';

export default function Setup() {
  return <main className="min-h-screen bg-[#050914] px-6 text-white sm:px-12">
    <Link href="/" className="flex h-20 items-center gap-2 text-sm text-white/60"><ArrowLeft size={16}/> CINETECH</Link>
    <div className="mx-auto max-w-2xl py-12">
      <p className="text-[10px] uppercase tracking-[.3em] text-sky-200">Offline movie catalogue</p>
      <h1 className="mt-2 font-[Manrope] text-4xl font-extrabold">Kaggle data setup</h1>
      <p className="mt-4 leading-7 text-white/55">CINETECH combines the Kaggle TMDB 5000 catalogue with a Bollywood movie catalogue. The saved Kaggle collection works offline; poster pictures need an internet connection. To show current theatrical releases, trending movies, and upcoming Hollywood and Hindi films, add your TMDB API Read Access Token as <code>TMDB_ACCESS_TOKEN</code> in the project root&apos;s <code>.env.local</code>, then restart the development server. The app falls back to the Kaggle catalogue if TMDB is unavailable.</p>
      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[.04] p-5">
        <div className="flex items-center gap-3 text-sky-200"><Database size={19}/><h2 className="font-semibold">Required files</h2></div>
        <p className="mt-3 text-sm leading-6 text-white/65">The project includes <code>tmdb_5000_movies.csv</code>, <code>tmdb_5000_credits.csv</code>, <code>mymoviedb_posters.csv</code>, and <code>timdb_bollywood.csv</code> in <code>data/kaggle</code>. The Bollywood catalogue covers films from 1950–2019, includes IMDb ratings and poster links, and is merged with the international catalogue.</p>
        <p className="mt-3 text-xs text-white/40">Sources: <a className="text-sky-200 underline" href="https://www.kaggle.com/datasets/tmdb/tmdb-movie-metadata" target="_blank" rel="noreferrer">TMDB 5000 on Kaggle</a>, <a className="text-sky-200 underline" href="https://github.com/pncnmnp/TIMDB" target="_blank" rel="noreferrer">The Indian Movie Database</a>, and <a className="text-sky-200 underline" href="https://www.kaggle.com/datasets/disham993/9000-movies-dataset" target="_blank" rel="noreferrer">movie poster catalogue</a>.</p>
      </div>
      <Link href="/" className="mt-8 inline-flex rounded-full bg-sky-300 px-5 py-3 text-sm font-bold text-black">Explore the catalogue</Link>
    </div>
  </main>;
}
