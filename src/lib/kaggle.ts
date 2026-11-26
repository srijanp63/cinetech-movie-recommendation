import fs from 'node:fs';
import path from 'node:path';

type Genre = { id: number; name: string };
export type KaggleMovie = {
  id: number; media_type: 'movie'; title: string; original_title: string; overview: string;
  poster_path: string | null; backdrop_path: string | null; vote_average: number; vote_count: number;
  popularity: number; release_date: string; original_language: string; genre_ids: number[];
  industry: 'Bollywood' | 'International'; rating_source: 'IMDb' | 'TMDB';
  taste_match?: number; recommendation_reasons?: string[];
  genres: Genre[]; keywords: { id: number; name: string }[]; runtime: number | null;
  budget: number; revenue: number; status: string; tagline: string;
  production_countries: { iso_3166_1: string; name: string }[];
  production_companies: { id: number; name: string }[];
  cast: any[]; crew: any[];
};

const genreNames: Record<number, string> = {
  12: 'Adventure', 14: 'Fantasy', 16: 'Animation', 18: 'Drama', 27: 'Horror',
  28: 'Action', 35: 'Comedy', 36: 'History', 37: 'Western', 53: 'Thriller',
  80: 'Crime', 99: 'Documentary',
  10402: 'Music', 10749: 'Romance', 10751: 'Family', 10752: 'War',
  878: 'Science Fiction', 9648: 'Mystery',
};

function* csvRows(text: string): Generator<string[]> {
  let row: string[] = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"' && field.length === 0) quoted = true;
    else if (char === ',') { row.push(field); field = ''; }
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(value => value.length)) yield row;
      row = [];
    } else field += char;
  }
  if (field.length || row.length) { row.push(field); yield row; }
}

function object(value: string): any[] {
  try { const parsed = JSON.parse(value || '[]'); return Array.isArray(parsed) ? parsed : []; }
  catch { return []; }
}
function number(value: string): number { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
function indexMap(header: string[]): Record<string, number> { return Object.fromEntries(header.map((name, i) => [name, i])); }
function titleKey(value: string): string { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
const genreIds: Record<string, number> = {
  action: 28, adventure: 12, animation: 16, biography: 18, comedy: 35, crime: 80,
  documentary: 99, drama: 18, family: 10751, fantasy: 14, history: 36, horror: 27,
  music: 10402, musical: 10402, mystery: 9648, romance: 10749, 'sci fi': 878,
  'science fiction': 878, sport: 99, thriller: 53, war: 10752, western: 37,
};

let cache: KaggleMovie[] | null = null;
export function getKaggleMovies(): KaggleMovie[] {
  if (cache) return cache;
  const directory = path.join(process.cwd(), 'data', 'kaggle');
  const moviesFile = path.join(directory, 'tmdb_5000_movies.csv');
  const creditsFile = path.join(directory, 'tmdb_5000_credits.csv');
  const postersFile = path.join(directory, 'mymoviedb_posters.csv');
  const bollywoodFile = path.join(directory, 'timdb_bollywood.csv');
  if (!fs.existsSync(moviesFile) || !fs.existsSync(creditsFile)) {
    throw new Error('Kaggle data is missing. Put tmdb_5000_movies.csv and tmdb_5000_credits.csv in data/kaggle.');
  }

  const postersByTitleYear = new Map<string, string>();
  const postersByTitle = new Map<string, string>();
  if (fs.existsSync(postersFile)) {
    const posterIterator = csvRows(fs.readFileSync(postersFile, 'utf8'));
    const posterHeader = indexMap(posterIterator.next().value || []);
    for (const row of posterIterator) {
      const key = titleKey(row[posterHeader.Title] || '');
      const url = row[posterHeader.Poster_Url] || '';
      const year = (row[posterHeader.Release_Date] || '').slice(0, 4);
      if (!key || !/^https:\/\//i.test(url)) continue;
      if (year) postersByTitleYear.set(`${key}|${year}`, url);
      if (!postersByTitle.has(key)) postersByTitle.set(key, url);
    }
  }

  const credits = new Map<number, { cast: any[]; crew: any[] }>();
  const creditIterator = csvRows(fs.readFileSync(creditsFile, 'utf8'));
  const creditHeader = indexMap(creditIterator.next().value || []);
  for (const row of creditIterator) {
    const id = number(row[creditHeader.movie_id] || '0');
    if (!id) continue;
    credits.set(id, {
      cast: object(row[creditHeader.cast] || '').slice(0, 20).map((person: any) => ({
        id: person.id, name: person.name, character: person.character, order: person.order,
        gender: person.gender, profile_path: null,
      })),
      crew: object(row[creditHeader.crew] || '').map((person: any) => ({
        id: person.id, name: person.name, job: person.job, department: person.department,
      })),
    });
  }

  const movieIterator = csvRows(fs.readFileSync(moviesFile, 'utf8'));
  const movieHeader = indexMap(movieIterator.next().value || []);
  cache = [];
  const seenTitles = new Set<string>();
  for (const row of movieIterator) {
    const id = number(row[movieHeader.id] || '0');
    const title = row[movieHeader.title] || row[movieHeader.original_title] || '';
    if (!id || !title) continue;
    const normalizedTitle = titleKey(title);
    const releaseDate = row[movieHeader.release_date] || '';
    const titleYear = releaseDate.slice(0, 4);
    const dedupeKey = `${normalizedTitle}|${titleYear}`;
    seenTitles.add(dedupeKey);
    const genres = object(row[movieHeader.genres] || '') as Genre[];
    const credit = credits.get(id) || { cast: [], crew: [] };
    const poster = postersByTitleYear.get(dedupeKey)
      || postersByTitle.get(normalizedTitle)
      || postersByTitle.get(titleKey(row[movieHeader.original_title] || ''))
      || null;
    cache.push({
      id, media_type: 'movie', title, original_title: row[movieHeader.original_title] || title,
      overview: row[movieHeader.overview] || '', poster_path: poster, backdrop_path: poster,
      vote_average: number(row[movieHeader.vote_average] || '0'),
      vote_count: number(row[movieHeader.vote_count] || '0'),
      popularity: number(row[movieHeader.popularity] || '0'),
      release_date: releaseDate, original_language: row[movieHeader.original_language] || '',
      genre_ids: genres.map(genre => Number(genre.id)).filter(Number.isFinite), genres,
      industry: 'International', rating_source: 'TMDB',
      keywords: object(row[movieHeader.keywords] || ''),
      runtime: number(row[movieHeader.runtime] || '0') || null,
      budget: number(row[movieHeader.budget] || '0'), revenue: number(row[movieHeader.revenue] || '0'),
      status: row[movieHeader.status] || '', tagline: row[movieHeader.tagline] || '',
      production_countries: object(row[movieHeader.production_countries] || ''),
      production_companies: object(row[movieHeader.production_companies] || ''),
      cast: credit.cast, crew: credit.crew,
    });
  }

  if (fs.existsSync(bollywoodFile)) {
    const bollywoodIterator = csvRows(fs.readFileSync(bollywoodFile, 'utf8'));
    const bollywoodHeader = indexMap(bollywoodIterator.next().value || []);
    let rowIndex = 0;
    for (const row of bollywoodIterator) {
      rowIndex++;
      const title = row[bollywoodHeader.title_y] || row[bollywoodHeader.title_x] || row[bollywoodHeader.original_title] || '';
      if (!title) continue;
      const year = row[bollywoodHeader.year_of_release] || '';
      const dedupeKey = `${titleKey(title)}|${year}`;
      if (seenTitles.has(dedupeKey)) continue;
      seenTitles.add(dedupeKey);

      const genreLabels = (row[bollywoodHeader.genres] || '').split('|').map(name => name.trim()).filter(Boolean);
      const genres: Genre[] = genreLabels.map(name => ({ id: genreIds[titleKey(name)] || 18, name }));
      const genreIdsUnique = [...new Set(genres.map(genre => genre.id))];
      const poster = row[bollywoodHeader.poster_path] || postersByTitleYear.get(dedupeKey) || postersByTitle.get(titleKey(title)) || null;
      const id = 2_000_000_000 + rowIndex;
      const voteAverage = number(row[bollywoodHeader.imdb_rating] || '0');
      const voteCount = number(row[bollywoodHeader.imdb_votes] || '0');
      const actors = (row[bollywoodHeader.actors] || '').split('|').map(name => name.trim()).filter(Boolean).slice(0, 20);
      const releaseDate = /^\d{4}$/.test(year) ? `${year}-01-01` : '';
      cache.push({
        id, media_type: 'movie', title, original_title: row[bollywoodHeader.original_title] || title,
        overview: row[bollywoodHeader.story] || row[bollywoodHeader.summary] || '',
        poster_path: poster, backdrop_path: poster, vote_average: voteAverage, vote_count: voteCount,
        popularity: Math.log1p(voteCount) * Math.max(voteAverage, 1), release_date: releaseDate,
        original_language: 'hi', genre_ids: genreIdsUnique, genres,
        keywords: [], runtime: number(row[bollywoodHeader.runtime] || '0') || null,
        budget: 0, revenue: 0, status: '', tagline: row[bollywoodHeader.tagline] || '',
        production_countries: [{ iso_3166_1: 'IN', name: 'India' }], production_companies: [],
        cast: actors.map((name, index) => ({ id: id * 100 + index, name, character: '', order: index, profile_path: null })),
        crew: [], industry: 'Bollywood', rating_source: 'IMDb',
      });
    }
  }
  return cache;
}

export function getMovie(id: number): KaggleMovie | undefined { return getKaggleMovies().find(movie => movie.id === id); }
export function getGenreNames(movie: KaggleMovie): string[] { return movie.genre_ids.map(id => genreNames[id]).filter(Boolean); }
export function movieSummary(movie: KaggleMovie) {
  const { id, media_type, title, overview, poster_path, backdrop_path, vote_average, release_date, original_language, genre_ids, industry, rating_source } = movie;
  return { id, media_type, title, overview, poster_path, backdrop_path, vote_average, release_date, original_language, genre_ids, industry, rating_source };
}
export function similarMovies(movie: KaggleMovie, limit = 12): KaggleMovie[] {
  const genres = new Set(movie.genre_ids);
  return getKaggleMovies().filter(item => item.id !== movie.id).map(item => ({
    item,
    score: item.genre_ids.filter(id => genres.has(id)).length * 2 + Math.log1p(item.popularity) * 0.04 + item.vote_average * 0.01,
  })).sort((a, b) => b.score - a.score).slice(0, limit).map(result => result.item);
}

