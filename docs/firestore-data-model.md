# Firestore Data Model Decision

## Structure: per-user subcollections

```
users/{userId}
users/{userId}/bodyMeasurements/{measurementId}
users/{userId}/weightLogs/{weightLogId}
users/{userId}/goals/{goalId}
users/{userId}/meals/{mealId}
users/{userId}/dailyNutrition/{dateId}        // dateId = "YYYY-MM-DD"
users/{userId}/exerciseLogs/{exerciseId}
users/{userId}/aiAnalyses/{analysisId}
users/{userId}/weeklyReports/{weekId}         // weekId = "YYYY-Www"
users/{userId}/monthlyReports/{monthId}       // monthId = "YYYY-MM"
users/{userId}/notionSyncLogs/{syncLogId}

profiles/{userId}   // public-ish profile fields, kept top-level for cheap lookups
```

## Why subcollections instead of top-level collections + userId field

Every query this app makes (dashboard, meal history, weight trend, reports) is scoped to
"the current signed-in user." There is no cross-user query in the product requirements.
Given that, and the hard requirement in section 7 (a user must never be able to read another
user's health data), subcollections under `users/{userId}` are the safer and simpler choice:

- **Security rules collapse to one rule.** `match /users/{userId}/{document=**} { allow read, write: if request.auth.uid == userId; }` covers every subcollection. With a top-level-collection + `userId` field design, every collection needs its own rule checking `resource.data.userId == request.auth.uid`, and a rule bug in any one of them is a data leak.
- **No accidental cross-user reads.** A query against `users/{uid}/meals` cannot return another user's meals even if application code forgets a `where("userId", "==", uid)` filter. With top-level collections, forgetting that filter is a real, easy-to-make bug.
- **Scheduled aggregation (weekly/monthly reports) still works.** Cloud Functions that need to process all users use `collectionGroup("meals")` / `collectionGroup("weightLogs")` queries, which Firestore supports natively across subcollections — so we don't lose the "run this for every user" capability described in section 16.

## `foodItems`

The spec lists `foodItems` as its own collection. In practice each meal has a handful (1–10)
of detected food items, always read together with the meal. Rather than a separate
`users/{uid}/meals/{mealId}/foodItems/{id}` subcollection (extra round-trip reads for no
benefit), food items are stored as an embedded array field on the `meals/{mealId}` document
(see `types/Meal.ts`). If a future requirement needs food items queried independently across
meals (e.g. "show me every time I ate salmon"), this can be split out later without touching
unrelated collections.

## `dailyNutrition` / `weeklySummary` / `monthlySummary` aggregates

Per section 14–15, the dashboard never recomputes totals from raw `meals`/`weightLogs` on
every load. `dailyNutrition/{dateId}` is written by a Cloud Function (or a Vercel API route,
see section 9) whenever a meal is created/edited/deleted for that day, keyed by date so a
dashboard read is a single-document get.
