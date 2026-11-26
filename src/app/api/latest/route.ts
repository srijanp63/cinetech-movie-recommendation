import { NextResponse } from 'next/server';
import { getKaggleMovies } from '@/lib/kaggle';

export const dynamic = 'force-dynamic';
export async function GET() {
  const movies = [...getKaggleMovies()].filter(movie => movie.release_date).sort((a, b) => b.release_date.localeCompare(a.release_date));
  return NextResponse.json({ movies, series: [], upcoming: [], source: 'Kaggle TMDB 5000 Movie Dataset (static snapshot)' });
}
