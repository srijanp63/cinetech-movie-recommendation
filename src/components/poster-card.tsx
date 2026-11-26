'use client';
import {useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {Bookmark,Film,Star} from 'lucide-react';
import {Media,titleOf,yearOf} from '@/types/media';
import {image} from '@/lib/tmdb';
import {recordActivity} from '@/lib/activity';

export function PosterCard({item}:{item:Media}){
 const [imageFailed,setImageFailed]=useState(false);
 const type=item.media_type||(item.first_air_date?'tv':'movie');
 const src=!imageFailed&&item.poster_path?image(item.poster_path,'w342'):null;
 async function addToList(){try{await recordActivity({...item,media_type:type},'watchlist')}catch{/* Browser list remains available when cloud sync is offline. */}}
 return <div className="group relative block w-[150px] shrink-0 sm:w-[184px]">
  <Link href={`/${type}/${item.id}`} aria-label={`${titleOf(item)}, ${yearOf(item)}`}>
   <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-[#101b2d] ring-1 ring-white/[.075] transition duration-500 group-hover:-translate-y-1 group-hover:ring-sky-200/60 group-hover:shadow-[0_18px_45px_rgba(30,105,180,.22)]">
    {src?<Image src={src} alt={titleOf(item)} fill sizes="(max-width:640px) 150px,184px" className="object-cover transition duration-700 group-hover:scale-[1.045]" onError={()=>setImageFailed(true)}/>:<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[radial-gradient(ellipse_at_50%_20%,rgba(76,164,255,.25),transparent_55%),linear-gradient(145deg,#102b49,#091321_70%)] p-4 text-center"><span className="grid h-11 w-11 place-items-center rounded-full border border-sky-100/20 bg-sky-100/[.06]"><Film size={21} className="text-sky-100/75"/></span><span className="text-[9px] font-semibold uppercase tracking-[.23em] text-sky-100/60">Cinetech selection</span><span className="line-clamp-4 font-[Manrope] text-sm font-bold leading-5 text-white/85">{titleOf(item)}</span></div>}
    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/15 opacity-80"/>
    <div title={`${item.rating_source || 'Catalogue'} audience rating, not your personal taste fit`} className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-[11px] font-semibold backdrop-blur"><Star size={11} className="fill-amber-300 text-amber-300"/>{item.vote_average?.toFixed(1)||'—'}<span className="text-[9px] text-white/65">{item.rating_source || 'Rating'}</span></div>
    {item.taste_match !== undefined && <div className="absolute inset-x-2 bottom-2 rounded-full border border-sky-100/40 bg-[#071827]/90 px-2 py-1.5 text-center text-[9px] font-bold uppercase tracking-[.12em] text-sky-100 backdrop-blur">{item.taste_match}% taste fit</div>}
   </div>
   <div className="mt-3 truncate text-[13px] font-semibold tracking-[.01em] text-white/90">{titleOf(item)}</div>
   <div className="mt-1 text-[11px] text-[#9ba9bd]">{yearOf(item)} <span className="mx-1 text-white/25">·</span>{type==='tv'?'Series':'Film'}{item.industry==='Bollywood'&&<span className="ml-1 text-sky-200">· Bollywood</span>}</div>
   {item.recommendation_reasons?.length ? <p title={item.recommendation_reasons.join(' · ')} className="mt-1 line-clamp-2 text-[10px] leading-4 text-sky-200/75">{item.recommendation_reasons[0]}</p> : null}
  </Link>
  <button onClick={addToList} className="absolute right-2 top-2 rounded-full bg-black/60 p-2 opacity-0 transition hover:bg-sky-500 group-hover:opacity-100 focus:opacity-100" aria-label="Add to watchlist"><Bookmark size={14}/></button>
 </div>
}
