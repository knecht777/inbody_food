# Image Storage: Vercel Blob instead of Firebase Storage

The architecture spec calls for Firebase Storage. In practice, Firebase now requires the
project to be on the **Blaze** (pay-as-you-go) plan before it will provision a Storage bucket
at all — even though actual usage would stay within the free quota. The user asked to keep
the whole stack on free tiers with no billing account required.

**Decision: meal and InBody photos are stored in Vercel Blob instead.** Firestore and
Firebase Authentication are unaffected — they stay exactly as designed. Only the "Image
Storage" row of the architecture changes.

## Why Vercel Blob over the alternatives considered

- **Vercel Blob** — no new account needed (the app already deploys on Vercel), free on the
  Hobby plan, no credit card required. Chosen for this reason alone.
- **Supabase Storage** — the user already has an unrelated Supabase project, but pulling it in
  would mean three different backend vendors for auth/db/storage instead of two, for no
  functional benefit. Passed over in favor of Vercel Blob's zero-new-account path.
- **Firebase Storage on Blaze** — still the "native" fit architecturally, but blocked by the
  free-tier requirement above.

## How it works

- The client (`lib/blob/upload.ts`) resizes the image in-browser (longest side capped at
  1600px, JPEG quality 0.82) via canvas — both to satisfy the spec's "optimize images for AI
  analysis" guidance and to stay well under request body limits — then POSTs it as
  `multipart/form-data` to `app/api/upload/route.ts`.
- That route verifies the caller's Firebase ID token (via `adminAuth`), checks the requested
  blob `pathname` starts with `users/{uid}/`, and uploads server-side with `put()` from
  `@vercel/blob` using `BLOB_READ_WRITE_TOKEN`. This is the same access boundary Firebase
  Storage Security Rules would have enforced, just implemented in application code instead of
  a declarative ruleset.
- Blob paths mirror the original Firebase Storage layout:
  `users/{uid}/meals/{mealId}/original.jpg` and
  `users/{uid}/body-composition/{measurementId}/inbody.jpg`.
- The resulting public blob URL is stored on the Firestore `meals`/`bodyMeasurements` document,
  same as it would have been with a Firebase Storage download URL.

**Why server-side proxy instead of `@vercel/blob/client`'s direct-to-Blob upload**: the
client-token flow (`handleUpload`/`upload()`) issues a browser request to
`vercel.com/api/blob`, which only allows CORS from the deployed Vercel origin — it fails with
a CORS error when running `next dev` on `localhost`. Proxying the upload through our own route
handler works identically in local dev and production.

If the project later moves to Firebase Blaze (e.g. once Cloud Functions are needed anyway for
scheduled reports), this can be revisited — `lib/blob/upload.ts` is the only client call site.
