import { NextResponse } from 'next/server';
import { getKaggleMovies } from '@/lib/kaggle';

export const dynamic = 'force-dynamic';
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'Invalid person.' }, { status: 400 });
  const personId = Number(id);
  const credits = getKaggleMovies().filter(movie => movie.cast.some(person => Number(person.id) === personId));
  const person = credits[0]?.cast.find(item => Number(item.id) === personId);
  if (!person) return NextResponse.json({ error: 'Person not found in this dataset.' }, { status: 404 });
  return NextResponse.json({ person: { ...person, profile_path: null }, credits: credits.map(movie => ({ ...movie, character: movie.cast.find(item => Number(item.id) === personId)?.character })).sort((a, b) => b.popularity - a.popularity) });
}
