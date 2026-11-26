import { NextRequest, NextResponse } from 'next/server';
import { getGenreNames, getKaggleMovies } from '@/lib/kaggle';
import type { KaggleMovie } from '@/lib/kaggle';

export const dynamic = 'force-dynamic';
const languageCode: Record<string, string> = { English: 'en', Hindi: 'hi', Korean: 'ko', Japanese: 'ja', Tamil: 'ta', Telugu: 'te', Malayalam: 'ml', French: 'fr', Spanish: 'es' };
const normalizeGenre = (name: string) => name.toLowerCase().replace(/sci[- ]?fi/g, 'science fiction').trim();

const moodRules: Record<string, { genres: string[]; words: string[] }> = {
  'mind-bending': { genres: ['mystery', 'science fiction', 'thriller'], words: ['time loop', 'parallel', 'dream', 'memory', 'reality', 'twist', 'psychological', 'illusion'] },
  emotional: { genres: ['drama', 'romance'], words: ['family', 'grief', 'loss', 'friendship', 'love', 'journey', 'heart'] },
  'feel-good': { genres: ['comedy', 'family', 'adventure', 'animation'], words: ['fun', 'friendship', 'joy', 'inspiring', 'uplifting', 'celebration'] },
  intense: { genres: ['action', 'thriller', 'crime', 'war'], words: ['battle', 'fight', 'danger', 'survive', 'mission', 'revenge'] },
  romantic: { genres: ['romance'], words: ['love', 'relationship', 'couple', 'romance', 'marriage'] },
  suspenseful: { genres: ['thriller', 'mystery', 'crime'], words: ['murder', 'detective', 'mystery', 'secret', 'killer', 'investigation'] },
  inspirational: { genres: ['history', 'drama', 'adventure'], words: ['dream', 'overcome', 'champion', 'inspire', 'true story', 'achievement'] },
  dark: { genres: ['horror', 'thriller', 'crime'], words: ['dark', 'murder', 'death', 'terror', 'evil', 'nightmare'] },
};

const regionMatches: Record<string, (movie: KaggleMovie) => boolean> = {
  bollywood: movie => movie.industry === 'Bollywood',
  hollywood: movie => movie.industry === 'International' && movie.original_language === 'en',
  korean: movie => movie.original_language === 'ko',
  japanese: movie => movie.original_language === 'ja',
  european: movie => ['fr', 'es', 'de', 'it', 'pt', 'da', 'sv', 'nl'].includes(movie.original_language),
  'indian regional': movie => ['ta', 'te', 'ml', 'bn', 'mr', 'kn', 'pa', 'gu', 'or', 'as'].includes(movie.original_language),
  international: movie => movie.industry === 'International',
};

function fitsRuntime(movie: KaggleMovie, options: string[]): boolean {
  if (!options.length) return false;
  const minutes = movie.runtime;
  if (!minutes) return false;
  return options.some(option => {
    if (option === 'Under 30 minutes') return minutes < 30;
    if (option === '30–60 minutes' || option === '30-60 minutes') return minutes >= 30 && minutes <= 60;
    if (option === '1–2 hours' || option === '1-2 hours') return minutes > 60 && minutes <= 120;
    if (option === 'Above 2 hours') return minutes > 120;
    return false;
  });
}

function fitsReleaseWindow(movie: KaggleMovie, options: string[], newestYear: number): boolean {
  if (!options.length) return false;
  const year = Number(movie.release_date.slice(0, 4));
  if (!year) return false;
  return options.some(option => {
    if (option === 'Newest in catalogue' || option === 'Latest releases') return year >= newestYear - 1;
    if (option === 'Last 2 years in catalogue' || option === 'Last 2 years') return year >= newestYear - 1;
    if (option === 'Last 5 years in catalogue' || option === 'Last 5 years') return year >= newestYear - 4;
    if (option === 'All time') return true;
    return false;
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const preferences = body.preferences || {};
    const preferredGenres = new Set<string>((preferences.genres || []).map((name: string) => normalizeGenre(String(name))));
    const languages = new Set<string>((preferences.languages || []).map((language: string) => languageCode[language] || language).map((value: string) => value.toLowerCase()));
    const regions = new Set<string>((preferences.regions || []).map((value: string) => String(value).toLowerCase()));
    const experiences = [...new Set<string>((preferences.experiences || []).map((value: string) => String(value).toLowerCase()))];
    const formats: string[] = (preferences.formats || []).map((value: unknown) => String(value));
    const releaseWindow: string[] = (preferences.releaseWindow || []).map((value: unknown) => String(value));
    const runtimes: string[] = (preferences.runtimes || []).map((value: unknown) => String(value));
    const interactions = Array.isArray(body.interactions) ? body.interactions : [];
    const seen = new Set<number>();
    const learnedGenres = new Map<string, number>();
    const catalogue = getKaggleMovies();
    const newestYear = catalogue.reduce((latest, movie) => Math.max(latest, Number(movie.release_date.slice(0, 4)) || 0), 0);

    for (const interaction of interactions) {
      if (interaction.media_type && interaction.media_type !== 'movie') continue;
      const id = Number(interaction.tmdb_id || interaction.id || interaction.item_id);
      const status = String(interaction.status || interaction.event || '');
      if (!id) continue;
      seen.add(id);
      const weight = status === 'liked' || status === 'watched' ? 1
        : status === 'rated' ? (Number(interaction.rating) - 5) / 5
        : status === 'dismissed' ? -1 : 0;
      const movie = catalogue.find(item => item.id === id);
      if (movie && weight) for (const genre of getGenreNames(movie)) {
        const key = normalizeGenre(genre);
        learnedGenres.set(key, (learnedGenres.get(key) || 0) + weight);
      }
    }

    const positiveLearned = [...learnedGenres.entries()].filter(([, weight]) => weight > 0.2).sort((a, b) => b[1] - a[1]);
    const activeFormats = formats.filter(value => value !== 'Any kind of film');
    const activeRelease = releaseWindow.filter(value => value !== 'All time');
    const hasTasteProfile = preferredGenres.size > 0 || languages.size > 0 || regions.size > 0 || experiences.length > 0 || activeFormats.length > 0 || activeRelease.length > 0 || runtimes.length > 0 || positiveLearned.length > 0;

    const ranked = catalogue.filter(movie => !seen.has(movie.id)).map(movie => {
      const genreNames = getGenreNames(movie).map(normalizeGenre);
      const reasons: string[] = [];
      let fit = 0;
      let availableFit = 0;
      let score = 0;
      const addFit = (weight: number, matched: boolean) => {
        availableFit += weight;
        if (matched) { fit += weight; score += weight; }
      };

      if (preferredGenres.size) {
        const matches = [...preferredGenres].filter(genre => genreNames.includes(genre));
        const matchFraction = matches.length / preferredGenres.size;
        availableFit += 25;
        fit += 25 * matchFraction;
        score += 25 * matchFraction;
        if (matches.length) reasons.push(`Matches your ${matches.slice(0, 2).join(' and ')} genre choice${matches.length > 1 ? 's' : ''}`);
      }

      if (positiveLearned.length) {
        const topLearned = positiveLearned.slice(0, 5);
        const learnedWeight = topLearned.reduce((sum, [, weight]) => sum + weight, 0);
        const matchedWeight = topLearned.filter(([genre]) => genreNames.includes(genre)).reduce((sum, [, weight]) => sum + weight, 0);
        const matchFraction = learnedWeight ? matchedWeight / learnedWeight : 0;
        availableFit += 20;
        fit += 20 * matchFraction;
        score += 20 * matchFraction;
        const matches = topLearned.filter(([genre]) => genreNames.includes(genre)).map(([genre]) => genre);
        if (matches.length) reasons.push(`Similar to genres from films you liked: ${matches.slice(0, 2).join(', ')}`);
      }

      if (languages.size) {
        const matches = languages.has(movie.original_language.toLowerCase());
        addFit(15, matches);
        if (matches) reasons.push(`In a language you selected (${movie.original_language})`);
      }

      if (regions.size) {
        const matches = [...regions].filter(region => regionMatches[region]?.(movie));
        const matchFraction = matches.length / regions.size;
        availableFit += 15;
        fit += 15 * matchFraction;
        score += 15 * matchFraction;
        if (matches.length) reasons.push(movie.industry === 'Bollywood' ? 'A Bollywood pick from your cinema choices' : `Matches your ${matches[0]} cinema choice`);
      }

      if (experiences.length) {
        const searchable = `${movie.title} ${movie.original_title} ${movie.overview} ${movie.tagline}`.toLowerCase();
        const matchedMoods = experiences.filter(mood => {
          const rule = moodRules[mood];
          return rule && (rule.genres.some(genre => genreNames.includes(genre)) || rule.words.some(word => searchable.includes(word)));
        });
        const matchFraction = matchedMoods.length / experiences.length;
        availableFit += 15;
        fit += 15 * matchFraction;
        score += 15 * matchFraction;
        if (matchedMoods.length) reasons.push(`Fits your ${matchedMoods.slice(0, 2).join(' or ')} mood`);
      }

      if (activeFormats.length) {
        const formatMatches = activeFormats.some(format =>
          (format === 'Animated films' && genreNames.includes('animation')) ||
          (format === 'Documentaries' && genreNames.includes('documentary')) ||
          (format === 'Live-action films' && !genreNames.includes('animation')),
        );
        addFit(5, formatMatches);
        if (formatMatches) reasons.push('Matches your film format choice');
      }

      if (activeRelease.length) {
        const matches = fitsReleaseWindow(movie, activeRelease, newestYear);
        addFit(5, matches);
        if (matches) reasons.push('Within your selected release range in this catalogue');
      }

      if (runtimes.length) {
        const matches = fitsRuntime(movie, runtimes);
        addFit(5, matches);
        if (matches) reasons.push(`Fits your ${runtimes[0]} runtime choice`);
      }

      const quality = (movie.vote_average / 10) * Math.min(1, Math.log1p(movie.vote_count) / Math.log1p(20000));
      score += quality * 3 + Math.log1p(movie.popularity) * 0.03;
      if (!reasons.length) reasons.push(`Rated ${movie.vote_average.toFixed(1)}/10 by ${movie.rating_source} viewers`);
      const taste_match = availableFit ? Math.min(99, Math.round(fit / availableFit * 100)) : undefined;
      return { movie, score, taste_match, recommendation_reasons: reasons.slice(0, 2) };
    }).sort((a, b) => b.score - a.score).slice(0, 16).map(({ movie, taste_match, recommendation_reasons }) => ({
      ...movie,
      ...(hasTasteProfile && taste_match !== undefined ? { taste_match, recommendation_reasons } : {}),
    }));

    return NextResponse.json({ recommendations: ranked, personalized: hasTasteProfile, match_explanation: 'Taste fit is a heuristic based on your survey choices and saved likes or ratings. Mood uses genre and plot text, while length and recency use the available catalogue data. It is not a probability. Stars show the dataset audience rating.' });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Recommendations are temporarily unavailable.' }, { status: 503 });
  }
}
