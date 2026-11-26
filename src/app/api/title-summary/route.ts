import { NextRequest, NextResponse } from 'next/server';
import { getMovie, movieSummary } from '@/lib/kaggle';

export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  const items = (req.nextUrl.searchParams.get('items') || '').split(',').filter(Boolean).slice(0, 60);
  const results = items.map(key => {
    const [type, id] = key.split(':');
    if (type !== 'movie' || !/^\d+$/.test(id || '')) return null;
    const movie = getMovie(Number(id));
    return movie ? movieSummary(movie) : null;
  }).filter(Boolean);
  return NextResponse.json({ results });
}
