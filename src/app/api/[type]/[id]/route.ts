import { NextResponse } from 'next/server';
import { getMovie, similarMovies } from '@/lib/kaggle';
import { tmdb } from '@/lib/tmdb';

export const dynamic = 'force-dynamic';
export async function GET(_req: Request, { params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  if (type !== 'movie' || !/^\d+$/.test(id)) return NextResponse.json({ error: 'This local dataset contains movies only.' }, { status: 404 });
  const movie = getMovie(Number(id));
  if (!movie) return NextResponse.json({ error: 'Movie not found in the Kaggle collection.' }, { status: 404 });
  let watchProviders = null;
  let watchProvidersStatus: 'ready' | 'unavailable' = 'unavailable';
  // Bollywood catalogue ids are local synthetic ids; only real TMDB ids can be queried here.
  if (movie.id < 2_000_000_000) {
    try {
      const availability = await tmdb<{ results?: Record<string, any> }>(`/movie/${movie.id}/watch/providers`);
      watchProviders = availability.results?.IN || null;
      watchProvidersStatus = 'ready';
    } catch {
      // Keep movie details available if provider data is not configured or temporarily unavailable.
    }
  }
  return NextResponse.json({
    details: { ...movie, keywords: { keywords: movie.keywords } },
    credits: { cast: movie.cast, crew: movie.crew },
    videos: { results: [] },
    similar: similarMovies(movie),
    watchProviders,
    watchProvidersStatus,
  });
}
