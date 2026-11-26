export type MediaType = 'movie' | 'tv';
export type Media = { id:number; media_type?:MediaType; title?:string; name?:string; overview?:string; poster_path:string|null; backdrop_path:string|null; vote_average:number; release_date?:string; first_air_date?:string; genre_ids?:number[]; industry?:'Bollywood'|'International'; rating_source?:'IMDb'|'TMDB'; taste_match?:number; recommendation_reasons?:string[] };
export const titleOf = (m:Media) => m.title || m.name || 'Untitled';
export const yearOf = (m:Media) => (m.release_date || m.first_air_date || '').slice(0,4);
