const base = 'https://api.themoviedb.org/3';
export const image = (path:string|null, size='w500') => path ? (path.startsWith('https://') ? path : `https://image.tmdb.org/t/p/${size}${path}`) : null;
export async function tmdb<T>(path:string, params:Record<string,string>={}) {
  const token=process.env.TMDB_ACCESS_TOKEN;
  if (!token) throw new Error('TMDB is not configured. Add TMDB_ACCESS_TOKEN to your .env.local file.');
  const url=new URL(`${base}${path}`); Object.entries(params).forEach(([k,v])=>url.searchParams.set(k,v));
  const res=await fetch(url,{headers:{Authorization:`Bearer ${token}`,accept:'application/json'},next:{revalidate:900}});
  if(!res.ok) throw new Error(`Movie data service returned ${res.status}. Please try again.`);
  return res.json() as Promise<T>;
}
