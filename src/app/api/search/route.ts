import { NextRequest, NextResponse } from 'next/server';
import { getKaggleMovies } from '@/lib/kaggle';

export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')?.trim().toLocaleLowerCase();
  if (!query) return NextResponse.json({ results: [] });
  const words = query.split(/\s+/).filter(Boolean);
  const results = getKaggleMovies().map(movie => {
    const text = `${movie.title} ${movie.original_title} ${movie.overview} ${movie.keywords.map(item => item.name).join(' ')} ${movie.cast.map(person => person.name).join(' ')}`.toLocaleLowerCase();
    const hits = words.filter(word => text.includes(word)).length;
    const titleMatch = movie.title.toLocaleLowerCase().includes(query) || movie.original_title.toLocaleLowerCase().includes(query);
    return { movie, hits, titleMatch };
  }).filter(result => result.hits === words.length)
    .sort((a, b) => Number(b.titleMatch) - Number(a.titleMatch) || b.hits - a.hits || b.movie.popularity - a.movie.popularity)
    .slice(0, 30).map(result => result.movie);
  return NextResponse.json({ results });
}
