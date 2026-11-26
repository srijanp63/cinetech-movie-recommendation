"""CINETECH hybrid recommendation API. Accepts TMDB-shaped catalogue and interaction data."""
from __future__ import annotations
from typing import Any
import numpy as np
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI(title="CINETECH Recommender", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_methods=["GET", "POST"], allow_headers=["*"])

class RecommendRequest(BaseModel):
    catalog: list[dict[str, Any]] = Field(default_factory=list)
    interactions: list[dict[str, Any]] = Field(default_factory=list)
    preferences: dict[str, Any] = Field(default_factory=dict)
    user_id: str | None = None
    limit: int = Field(default=20, ge=1, le=100)

def _features(row: dict[str, Any]) -> str:
    fields = ["overview", "title", "name", "genres", "keywords", "cast", "directors", "original_language"]
    return " ".join(str(row.get(k) or "") for k in fields).lower()

def rank(payload: RecommendRequest) -> list[dict[str, Any]]:
    catalog = payload.catalog
    if not catalog:
        return []
    df = pd.DataFrame(catalog).copy().reset_index(drop=True)
    if "id" not in df:
        raise ValueError("Every catalog title must have an id")
    df["_features"] = [_features(x) for x in catalog]
    tfidf = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), max_features=50000)
    matrix = tfidf.fit_transform(df["_features"].fillna(""))
    interactions = [x for x in payload.interactions if str(x.get("user_id")) == str(payload.user_id)]
    by_id = {str(x.get("id")): i for i, x in enumerate(catalog)}
    seen = {str(x.get("item_id")) for x in interactions if x.get("event") in {"watched", "dismissed"}}
    positive = [x for x in interactions if x.get("event") in {"liked", "watched", "watchlist", "rated"} and str(x.get("item_id")) in by_id]
    user_scores = np.zeros(len(catalog), dtype=float)
    if positive:
        weights = np.array([max(.25, float(x.get("rating", 3)) / 5) for x in positive])
        profile = np.average(matrix[[by_id[str(x["item_id"])] for x in positive]].toarray(), axis=0, weights=weights)
        user_scores = cosine_similarity(matrix, profile.reshape(1, -1)).ravel()
    prefs = payload.preferences
    genres = {str(x).lower() for x in prefs.get("genres", [])}
    languages = {str(x).lower() for x in prefs.get("languages", [])}
    now_year = int(pd.Timestamp.utcnow().year)
    scores = []
    for i, item in enumerate(catalog):
        if str(item.get("id")) in seen:
            continue
        item_genres = {str(g.get("name", g) if isinstance(g, dict) else g).lower() for g in item.get("genres", [])}
        genre_match = len(genres & item_genres) / max(1, len(genres)) if genres else 0
        language_match = 1 if str(item.get("original_language", "")).lower() in languages else 0
        year = str(item.get("release_date") or item.get("first_air_date") or "")[:4]
        recency = max(0, 1 - (now_year - int(year)) / 12) if year.isdigit() else 0
        popularity = np.log1p(max(0, float(item.get("popularity", 0)))) / 15
        rating = float(item.get("vote_average", 0)) / 10
        content = user_scores[i]
        # New users receive preference and quality ranking; engaged users get a hybrid content score.
        score = (.48 * content + .23 * genre_match + .08 * language_match + .08 * recency + .08 * rating + .05 * min(popularity, 1))
        if not positive:
            score = .48 * genre_match + .14 * language_match + .15 * recency + .13 * rating + .10 * min(popularity, 1)
        scores.append((i, score))
    scores.sort(key=lambda x: x[1], reverse=True)
    # Greedy genre diversity: avoid filling the first page from one genre.
    selected, counts = [], {}
    for idx, score in scores:
        gs = df.iloc[idx].get("genres", [])
        key = str(gs[0].get("name", "unknown") if gs and isinstance(gs[0], dict) else (gs[0] if gs else "unknown"))
        adjusted = score / (1 + .35 * counts.get(key, 0))
        selected.append((idx, adjusted))
        counts[key] = counts.get(key, 0) + 1
    selected.sort(key=lambda x: x[1], reverse=True)
    return [{**catalog[i], "recommendation_score": round(float(s), 5)} for i, s in selected[:payload.limit]]

@app.get("/health")
def health(): return {"status": "ok", "service": "cineverse-recommender"}

@app.post("/recommend")
def recommend(body: RecommendRequest): return {"recommendations": rank(body)}
