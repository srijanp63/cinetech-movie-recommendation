import { NextResponse } from 'next/server';
import { getKaggleMovies, getGenreNames } from '@/lib/kaggle';
import { tmdb } from '@/lib/tmdb';

export const dynamic = 'force-dynamic';
const popular = (a: any, b: any) => b.popularity - a.popularity;
const rated = (a: any, b: any) => (b.vote_average * Math.log1p(b.vote_count)) - (a.vote_average * Math.log1p(a.vote_count));
type MovieResult = { results?: any[] };
const labelIndustry = (items: any[], industry: 'Bollywood' | 'International') => items.map(item => ({ ...item, media_type: 'movie', industry, rating_source: 'TMDB' }));

export async function GET() {
  try {
    const movies = getKaggleMovies();
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const recent = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    let featured = [...movies].sort(popular).slice(0, 8);
    let liveSections: { title: string; items: any[] }[] = [];
    let liveEnabled = false;
    try {
      const [trending, nowPlaying, upcomingHollywood, latestBollywood, upcomingBollywood] = await Promise.all([
        tmdb<MovieResult>('/trending/movie/week'),
        tmdb<MovieResult>('/movie/now_playing', { region: 'IN', page: '1' }),
        tmdb<MovieResult>('/discover/movie', { with_origin_country: 'US', 'primary_release_date.gte': today, sort_by: 'primary_release_date.asc', page: '1' }),
        tmdb<MovieResult>('/discover/movie', { with_origin_country: 'IN', with_original_language: 'hi', 'primary_release_date.gte': recent, 'primary_release_date.lte': today, sort_by: 'primary_release_date.desc', page: '1' }),
        tmdb<MovieResult>('/discover/movie', { with_origin_country: 'IN', with_original_language: 'hi', 'primary_release_date.gte': today, sort_by: 'primary_release_date.asc', page: '1' }),
      ]);
      const liveTrending = labelIndustry(trending.results || [], 'International');
      const cinema = labelIndustry(nowPlaying.results || [], 'International');
      const hollywoodUpcoming = labelIndustry(upcomingHollywood.results || [], 'International');
      const bollywoodLatestItems = labelIndustry(latestBollywood.results || [], 'Bollywood');
      const bollywoodUpcomingItems = labelIndustry(upcomingBollywood.results || [], 'Bollywood');
      if (liveTrending.length || cinema.length || hollywoodUpcoming.length || bollywoodLatestItems.length || bollywoodUpcomingItems.length) {
        liveEnabled = true;
        featured = [...cinema, ...liveTrending].filter((item, index, all) => all.findIndex(other => other.id === item.id) === index).slice(0, 8);
        liveSections = [
          { title: 'Now showing in India', items: cinema },
          { title: 'Coming soon · Hollywood', items: hollywoodUpcoming },
          { title: 'New Bollywood releases', items: bollywoodLatestItems },
          { title: 'Coming soon · Bollywood', items: bollywoodUpcomingItems },
        ].filter(section => section.items.length > 0);
      }
    } catch {
      // Keep the offline Kaggle catalogue usable when a live TMDB credential is missing or unavailable.
    }
    const byGenre = (names: string[]) => movies.filter(movie => getGenreNames(movie).some(name => names.includes(name))).sort(popular).slice(0, 24);
    const bollywood = movies.filter(movie => movie.industry === 'Bollywood' && movie.vote_count > 0)
      .sort((a, b) => rated(a, b) || b.popularity - a.popularity).slice(0, 24);
    const sections = [
      { title: liveEnabled ? 'Popular right now' : 'Popular in the Kaggle collection', items: liveEnabled ? featured : [...movies].sort(popular).slice(0, 24) },
      ...liveSections,
      { title: 'Highest rated favourites', items: [...movies].filter(movie => movie.vote_count >= 100).sort(rated).slice(0, 24) },
      { title: 'Bollywood spotlight · Hindi cinema', items: bollywood },
      { title: 'Action & adventure', items: byGenre(['Action', 'Adventure']) },
      { title: 'Comedy collection', items: byGenre(['Comedy']) },
      { title: 'Drama stories', items: byGenre(['Drama']) },
      { title: 'Science fiction & fantasy', items: byGenre(['Science Fiction', 'Fantasy']) },
      { title: 'Thrillers & mysteries', items: byGenre(['Thriller', 'Mystery']) },
      { title: 'Romance', items: byGenre(['Romance']) },
    ];
    return NextResponse.json({ configured: true, liveEnabled, featured, source: liveEnabled ? 'TMDB live releases + Kaggle recommendation catalogue' : 'Kaggle TMDB 5000 + Indian Movie Database', sections });
  } catch (error) {
    return NextResponse.json({ configured: false, error: error instanceof Error ? error.message : 'Could not load the Kaggle catalogue.', sections: [] }, { status: 503 });
  }
}
