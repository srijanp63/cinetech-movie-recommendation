# CINETECH

**Every story has a universe. Find yours.** A movie discovery and recommendation app powered by a local Kaggle catalogue. No TMDB API token is required.

## Catalogue

The app reads the Kaggle [TMDB 5000 Movie Dataset](https://www.kaggle.com/datasets/tmdb/tmdb-movie-metadata), a [9,000+ movie poster dataset](https://www.kaggle.com/datasets/disham993/9000-movies-dataset), and [The Indian Movie Database](https://github.com/pncnmnp/TIMDB) from `data/kaggle`. The Indian Movie Database adds Bollywood films from 1950–2019, including IMDb ratings, plot summaries, cast names, genres, and poster URLs. It is merged with the main catalogue using normalized title and year to avoid duplicates.

The home page has a Bollywood spotlight and discovery includes a cinema filter. Recommendations use the viewer's selected genres, languages, Bollywood preference, and saved likes/ratings. The app separates the dataset audience rating from its heuristic taste-fit score and displays reasons for personalized picks. Taste fit is a transparent score from those selected signals, not a probability.

This is a static movie-only snapshot. It does not provide TV shows or live TMDB updates. Some titles can still lack poster images, and posters need an internet connection. Bollywood metadata and imagery are attributed to the TIMDB project and their underlying IMDb/Wikipedia sources; check those sources' terms before redistributing the data. TMDB does not endorse this app.

## Run locally

Requirements: Node.js 20.9 or newer and npm.

```powershell
npm install
npm run dev
```

Open <http://localhost:3000>. The recommendation, search, discovery, details, and cast pages use the local CSV files. Supabase is optional and is only needed for sign-in and cloud-synced preferences.

## Optional Supabase setup

Copy `.env.example` to `.env.local`, then set the Supabase project URL and anon key. Run `supabase/schema.sql` in the Supabase SQL editor. Never put the service role key in a `NEXT_PUBLIC_` variable or commit `.env.local`.

## Optional Python recommender service

The app's local recommendation route runs without Python. The standalone FastAPI service in `recommendation/` can still be run separately for experimentation:

```powershell
cd recommendation
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Notes

- User watchlists and activity work in browser storage; Supabase sync is optional.
- The CSV files are included under `data/kaggle`; metadata is available offline and poster images load from their hosted URLs.
- Dataset source and attribution: [TMDB 5000 Movie Dataset on Kaggle](https://www.kaggle.com/datasets/tmdb/tmdb-movie-metadata).
