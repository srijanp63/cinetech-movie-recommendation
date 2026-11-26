import Image from 'next/image';
import { ExternalLink, Film } from 'lucide-react';
import { image } from '@/lib/tmdb';

type Provider = { provider_id: number; provider_name: string; logo_path: string };
type Availability = {
  link?: string;
  free?: Provider[];
  ads?: Provider[];
  flatrate?: Provider[];
  rent?: Provider[];
  buy?: Provider[];
};
type OfferKey = 'free' | 'ads' | 'flatrate' | 'rent' | 'buy';

const offerGroups: { title: string; key: OfferKey }[] = [
  { title: 'Free & ad-supported', key: 'free' },
  { title: 'Included with subscription', key: 'flatrate' },
  { title: 'Rent', key: 'rent' },
  { title: 'Buy', key: 'buy' },
  { title: 'Free with ads', key: 'ads' },
];

export function WatchAvailability({ data, status }: { data: Availability | null; status: 'ready' | 'unavailable' }) {
  const groups = offerGroups.map(group => ({ ...group, providers: data?.[group.key] || [] })).filter(group => group.providers.length);

  return <section aria-labelledby="watch-options-heading" className="mx-auto max-w-[1450px] px-6 py-8 sm:px-12">
    <div className="overflow-hidden rounded-3xl border border-sky-100/[.12] bg-[radial-gradient(ellipse_at_100%_0%,rgba(58,142,224,.12),transparent_48%),#081321] p-5 sm:p-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-sky-200/75">Legal viewing options · India</p>
          <h2 id="watch-options-heading" className="mt-2 font-[Manrope] text-2xl font-bold">Where to watch</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">Compare free, subscription, rental, and purchase options. Prices and availability can change; check the provider before paying.</p>
        </div>
        <span className="text-[10px] uppercase tracking-[.12em] text-white/35">Availability data by JustWatch</span>
      </div>

      {status === 'unavailable' ? <div className="mt-6 flex items-start gap-3 rounded-2xl border border-white/[.08] bg-white/[.025] p-4 text-sm text-white/55">
        <Film className="mt-0.5 shrink-0 text-sky-200/70" size={18}/>
        <p>Provider availability isn’t connected yet. Add <code className="text-sky-100">TMDB_ACCESS_TOKEN</code> to the project root&apos;s <code className="text-sky-100">.env.local</code> and restart CineTech to load India listings.</p>
      </div> : groups.length ? <>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map(group => <div key={group.key} className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-[.14em] text-white/65">{group.title}</h3>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {group.providers.map(provider => <div key={provider.provider_id} title={provider.provider_name} className="flex items-center gap-2 rounded-full border border-white/[.08] bg-black/20 py-1.5 pl-1.5 pr-3">
                {provider.logo_path && <Image src={image(provider.logo_path, 'w92')!} width={24} height={24} unoptimized alt="" className="rounded-full"/>}
                <span className="text-xs text-white/75">{provider.provider_name}</span>
              </div>)}
            </div>
          </div>)}
        </div>
        {data?.link && <a href={data.link} target="_blank" rel="noreferrer" className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-sky-200 px-5 text-xs font-bold uppercase tracking-[.08em] text-[#061221] transition hover:bg-white">Check current options <ExternalLink size={14}/></a>}
      </> : <div className="mt-6 rounded-2xl border border-white/[.08] bg-white/[.025] p-4 text-sm text-white/55">No streaming or rental options are listed for India right now.</div>}

      <p className="mt-4 text-[10px] leading-5 text-white/30">Availability information provided via JustWatch and TMDB. CineTech does not host or stream these movies.</p>
    </div>
  </section>;
}
