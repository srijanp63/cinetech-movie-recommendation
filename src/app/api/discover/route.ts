import { NextRequest, NextResponse } from 'next/server';
import { getKaggleMovies } from '@/lib/kaggle';

export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const page = Math.max(1, Number(params.get('page') || 1));
  const type = params.get('type') === 'tv' ? 'tv' : 'movie';
  if (type === 'tv') return NextResponse.json({ page, total_pages: 0, total_results: 0, results: [], note: 'The Kaggle source contains movies only.' });
  const genres = (params.get('with_genres') || '').split(',').filter(Boolean).map(Number);
  const language = params.get('with_original_language');
  const industry = params.get('industry')?.toLowerCase();
  const year = params.get('primary_release_year');
  const minRating = Number(params.get('vote_average.gte') || 0);
  const sort = params.get('sort') || params.get('sort_by') || 'popularity.desc';
  let movies = getKaggleMovies().filter(movie =>
    (!genres.length || genres.some(id => movie.genre_ids.includes(id))) &&
    (!language || movie.original_language === language) &&
    (!industry || movie.industry.toLowerCase() === industry) &&
    (!year || movie.release_date.startsWith(year)) &&
    movie.vote_average >= minRating,
  );
  if (sort.startsWith('primary_release_date') || sort.startsWith('release_date')) movies.sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''));
  else if (sort.startsWith('vote_average')) movies.sort((a, b) => b.vote_average - a.vote_average || b.vote_count - a.vote_count);
  else movies.sort((a, b) => b.popularity - a.popularity);
  const pageSize = 28;
  return NextResponse.json({ page, total_pages: Math.max(1, Math.ceil(movies.length / pageSize)), total_results: movies.length, results: movies.slice((page - 1) * pageSize, page * pageSize) });
}
