'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Bookmark, ChevronLeft, ChevronRight, Clapperboard, Compass, Film, Menu, Play, Search, Star, X } from 'lucide-react';
import { Media, titleOf, yearOf } from '@/types/media';
import { image } from '@/lib/tmdb';
import { PosterCard } from './poster-card';
import { readActivity, readPreferences } from '@/lib/activity';

type Section = { title: string; items: Media[] };
type HomeData = { configured: boolean; liveEnabled?: boolean; featured?: Media[]; error?: string; sections: Section[] };

const navigation = [
  ['Home', '/', Compass], ['Movies', '/discover?type=movie', Film],
  ['Top Rated', '/discover?type=movie&sort=vote_average.desc', Star], ['Trending', '/latest', Clapperboard],
  ['My List', '/watchlist', Bookmark],
] as const;

export default function Home() {
  const [data, setData] = useState<HomeData | null>(null);
  const [recommended, setRecommended] = useState<Media[]>([]);
  const [matchExplanation, setMatchExplanation] = useState('');
  const [query, setQuery] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    fetch('/api/home').then(response => response.json()).then(setData)
      .catch(() => setData({ configured: false, error: 'Could not load the movie collection.', sections: [] }));
    void (async () => {
      try {
        const preferences = readPreferences();
        const interactions = await readActivity();
        const hasProfile = preferences.genres.length + preferences.regions.length + preferences.languages.length + preferences.experiences.length + preferences.formats.length + preferences.releaseWindow.length + preferences.runtimes.length > 0 || interactions.length > 0;
        if (!hasProfile) return;
        const response = await fetch('/api/recommend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ preferences, interactions }) });
        const result = await response.json();
        setRecommended(result.recommendations || []);
        setMatchExplanation(result.match_explanation || '');
      } catch { /* Personal recommendations are optional when local or cloud activity is unavailable. */ }
    })();
  }, []);

  const featured = data?.featured?.length ? data.featured : data?.sections?.[0]?.items || [];
  const hero = featured.length ? featured[heroIndex % featured.length] : undefined;
  const sections = data?.sections || [];
  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    if (value) window.location.href = `/search?q=${encodeURIComponent(value)}`;
  };

  return <main id="top" className="min-h-screen overflow-hidden bg-[#050914]">
    <header className="fixed inset-x-0 top-0 z-40 border-b border-sky-100/[.08] bg-[#050914]/75 backdrop-blur-2xl">
      <div className="mx-auto flex h-[76px] max-w-[1680px] items-center gap-8 px-5 sm:px-10">
        <Link href="/" className="brand flex shrink-0 items-center gap-3 text-[16px]">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-sky-100/25 bg-gradient-to-br from-sky-200 to-sky-500 text-[#061221] shadow-[0_0_30px_rgba(83,174,255,.2)]">C</span>
          <span>CINE<span className="text-sky-200">TECH</span></span>
        </Link>
        <nav className="hidden items-center gap-7 md:flex">{navigation.map(([label, href, Icon], index) =>
          <Link key={label} href={href} className={`group relative flex h-[76px] items-center gap-2 text-[11px] font-semibold uppercase tracking-[.12em] transition hover:text-sky-100 ${index === 0 ? 'text-white' : 'text-white/55'}`}><Icon size={14} className="opacity-75"/>{label}{index === 0 && <span className="absolute inset-x-0 bottom-0 h-px bg-sky-200"/>}</Link>
        )}</nav>
        <div className="ml-auto flex items-center gap-3">
          <form onSubmit={submitSearch} className="relative hidden sm:block"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" size={15}/><input aria-label="Search movies" value={query} onChange={event => setQuery(event.target.value)} placeholder="Titles, moods, people" className="h-10 w-[245px] rounded-full border border-white/10 bg-white/[.035] pl-10 pr-4 text-xs outline-none transition placeholder:text-white/35 focus:border-sky-200/50 focus:bg-sky-100/[.04]"/></form>
          <Link href="/profile" aria-label="Profile" className="grid h-9 w-9 place-items-center rounded-full border border-sky-100/20 bg-gradient-to-br from-sky-200/15 to-blue-500/10 font-semibold text-sky-100 transition hover:border-sky-100/50">C</Link>
          <button className="p-2 md:hidden" onClick={() => setMobileMenu(!mobileMenu)} aria-label={mobileMenu ? 'Close menu' : 'Open menu'}>{mobileMenu ? <X size={19}/> : <Menu size={19}/>}</button>
        </div>
      </div>
      {mobileMenu && <nav className="glass grid gap-1 border-t border-white/10 p-3 md:hidden">{navigation.map(([label, href, Icon]) => <Link key={label} href={href} onClick={() => setMobileMenu(false)} className="flex gap-3 rounded-xl p-3 text-sm text-white/75"><Icon size={17}/>{label}</Link>)}</nav>}
    </header>

    <section className="relative min-h-[680px] overflow-hidden pt-[76px] sm:h-[810px]">
      {hero?.backdrop_path && <Image src={image(hero.backdrop_path, 'original')!} alt={`${titleOf(hero)} movie artwork`} fill priority sizes="100vw" className="scale-[1.02] object-cover object-[center_30%] opacity-[.76]"/>}
      <div className="hero-shade absolute inset-0"/><div className="absolute inset-0 bg-gradient-to-t from-[#050914] via-transparent to-[#050914]/30"/>
      <div className="relative mx-auto flex min-h-[680px] max-w-[1680px] items-end px-5 pb-16 sm:h-full sm:px-16 sm:pb-28">
        <div className="max-w-[650px]">
          <p className="mb-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[.3em] text-sky-100"><span className="h-px w-9 bg-sky-200/80"/>Cinetech spotlight <span className="text-white/35">/ 01</span></p>
          <h1 className="max-w-[780px] font-[Manrope] text-5xl font-extrabold leading-[.99] tracking-[-.055em] sm:text-7xl lg:text-[88px]">{hero ? titleOf(hero) : 'Every story has a universe.'}</h1>
          {hero && <><div className="mt-6 flex flex-wrap items-center gap-3 text-[11px] font-medium uppercase tracking-[.1em] text-white/65"><span className="flex items-center gap-1.5 text-amber-200"><Star size={13} className="fill-current"/>{hero.vote_average?.toFixed(1)} <span className="text-white/45">Audience</span></span><span className="text-white/30">/</span><span>{yearOf(hero)}</span><span className="text-white/30">/</span><span>{hero.industry === 'Bollywood' ? 'Bollywood' : 'Film'}</span><span className="text-white/30">/</span><span>{data?.liveEnabled ? 'Now in the conversation' : 'Popular in the collection'}</span></div><p className="mt-5 line-clamp-4 max-w-[530px] text-sm leading-7 text-white/70 sm:text-[15px]">{hero.overview}</p></>}
          {!data && <p className="mt-5 text-sm text-white/60">Loading movies…</p>}
          {data && !data.configured && <p className="mt-5 text-sm text-amber-200">{data.error || 'Movie data could not be loaded.'}</p>}
          {data && !data.liveEnabled && <Link href="/setup" className="mt-4 inline-flex items-center gap-2 rounded-full border border-sky-100/15 bg-sky-100/[.045] px-3.5 py-2 text-[10px] font-medium tracking-wide text-sky-100/75 transition hover:border-sky-100/40 hover:text-sky-50">Live releases not connected <ArrowRight size={12}/></Link>}
          <div className="mt-8 flex flex-wrap gap-3"><Link href={hero ? `/movie/${hero.id}` : '/discover?type=movie'} className="inline-flex h-[50px] items-center gap-2.5 rounded-full bg-sky-200 px-6 text-[11px] font-bold uppercase tracking-[.1em] text-[#061221] shadow-[0_8px_30px_rgba(83,174,255,.18)] transition hover:bg-white"><Play size={15} fill="currentColor"/>{hero ? 'Explore film' : 'Explore films'}</Link><Link href="/discover?type=movie" className="inline-flex h-[50px] items-center gap-2.5 rounded-full border border-white/20 bg-[#081321]/50 px-6 text-[11px] font-semibold uppercase tracking-[.1em] backdrop-blur-xl transition hover:border-sky-100/50 hover:bg-sky-100/10">Browse collection<ArrowRight size={15}/></Link></div>
        </div>
        <div className="absolute bottom-20 right-16 hidden max-w-[220px] items-start gap-3 text-[10px] uppercase tracking-[.2em] text-white/55 lg:flex"><span className="mt-1.5 h-px w-8 shrink-0 bg-sky-100/60"/><span>Stories across borders<br/><span className="mt-1 block text-white/35">Curated for your next discovery</span></span></div>
        {featured.length > 1 && <div className="absolute right-5 top-1/2 flex -translate-y-1/2 items-center gap-2 sm:right-12"><button onClick={() => setHeroIndex(index => (index - 1 + featured.length) % featured.length)} aria-label="Previous spotlight film" className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-[#07111f]/55 text-white/80 backdrop-blur-xl transition hover:border-sky-100/60 hover:bg-sky-100/10"><ChevronLeft size={19}/></button><button onClick={() => setHeroIndex(index => (index + 1) % featured.length)} aria-label="Next spotlight film" className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-[#07111f]/55 text-white/80 backdrop-blur-xl transition hover:border-sky-100/60 hover:bg-sky-100/10"><ChevronRight size={19}/></button></div>}
        {featured.length > 1 && <div className="absolute bottom-8 left-5 flex items-center gap-2 sm:left-16">{featured.slice(0, 8).map((item, index) => <button key={item.id} onClick={() => setHeroIndex(index)} aria-label={`Show spotlight ${index + 1}: ${titleOf(item)}`} className={`h-1 rounded-full transition-all ${index === heroIndex ? 'w-9 bg-sky-100' : 'w-4 bg-white/35 hover:bg-white/70'}`}/>)}</div>}
      </div>
    </section>

    <div className="relative z-10 -mt-2 pb-20">
      {recommended.length > 0 && <section className="mb-10"><div className="mb-1 px-5 sm:px-12"><p className="mb-1.5 text-[9px] font-bold uppercase tracking-[.27em] text-sky-300/70">Built from your preferences</p><h2 className="font-[Manrope] text-lg font-bold sm:text-[21px]">Recommended for your taste</h2><p className="mt-1 max-w-3xl text-xs text-white/40">{matchExplanation}</p></div><div className="hide-scroll mt-4 flex snap-x gap-4 overflow-x-auto px-5 pb-3 sm:gap-[18px] sm:px-12">{recommended.map(item => <PosterCard key={item.id} item={item}/>)}</div></section>}
      {sections.map((section, index) => <section key={section.title} className="mb-10">
        <div className="mb-4 flex items-end justify-between px-5 sm:px-12"><div><p className="mb-1.5 text-[9px] font-bold uppercase tracking-[.27em] text-sky-300/70">{section.title.startsWith('Bollywood') ? 'Hindi cinema' : index === 0 ? 'The collection' : 'Explore by mood'}</p><h2 className="font-[Manrope] text-lg font-bold sm:text-[21px]">{section.title}</h2></div><div className="hidden gap-2 sm:flex"><button onClick={() => document.getElementById(`row-${index}`)?.scrollBy({ left: -600, behavior: 'smooth' })} aria-label="Scroll left" className="rounded-full border border-white/10 p-2 text-white/65 hover:bg-white/10"><ChevronLeft size={16}/></button><button onClick={() => document.getElementById(`row-${index}`)?.scrollBy({ left: 600, behavior: 'smooth' })} aria-label="Scroll right" className="rounded-full border border-white/10 p-2 text-white/65 hover:bg-white/10"><ChevronRight size={16}/></button></div></div>
        <div id={`row-${index}`} className="hide-scroll flex snap-x gap-4 overflow-x-auto px-5 pb-3 sm:gap-[18px] sm:px-12">{section.items.slice(0, 14).map(item => <PosterCard key={item.id} item={item}/>)}</div>
      </section>)}
      {data && !sections.length && <div className="px-5 py-14 text-center text-white/60">No movies are available right now. Please refresh the page.</div>}
      <div className="mx-5 mt-16 flex items-center justify-between rounded-3xl border border-white/[.07] bg-gradient-to-r from-sky-400/[.12] to-transparent p-6 sm:mx-12 sm:p-9"><div><div className="brand text-[10px] text-sky-200">CINETECH SELECTS</div><h3 className="mt-2 text-xl font-bold">Good stories find their people.</h3><p className="mt-2 text-sm text-white/55">Choose a mood and find your next film.</p></div><Link href="/onboarding" className="flex shrink-0 items-center gap-2 rounded-full bg-sky-300 px-5 py-3 text-xs font-bold text-[#061221] transition hover:bg-sky-200">Set my taste <ArrowRight size={15}/></Link></div>
    </div>
    <footer className="border-t border-white/[.06] px-5 py-8 sm:px-12"><div className="mx-auto flex max-w-[1600px] flex-col justify-between gap-4 text-xs text-white/40 sm:flex-row"><Link href="/" className="brand text-[12px] text-white/60">CINE<span className="text-sky-300">TECH</span></Link><p>Every story has a universe. Find yours.</p><p>Catalogue: Kaggle TMDB 5000 Movie Dataset.</p></div></footer>
  </main>;
}
