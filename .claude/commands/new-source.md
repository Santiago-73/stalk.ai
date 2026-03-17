Add support for a new content source type to stalk.ai.

## Plataformas permitidas
Solo implementar fuentes de esta lista (definida en CLAUDE.md):
- YouTube ✅ — API de Google
- Reddit ✅
- Twitch ✅
- RSS / Blogs ✅
- Hacker News ✅
- Bluesky ✅
- Substack ✅

NO implementar: Twitter/X, Instagram, TikTok (sin API viable).

## Plan gates
- Free: YouTube + RSS + HN + Bluesky únicamente
- Pro/Ultra: todas las plataformas de la lista

## Pasos

Given a source type name (e.g. "twitch", "substack"), do the following:

1. **Read existing source implementation** for reference:
   - `src/app/api/` — find an existing source fetcher to understand the pattern
   - `src/app/(dashboard)/dashboard/subjects/[id]/page.tsx` — cómo se muestran las fuentes
   - `src/app/(dashboard)/dashboard/sources/page.tsx` — UI de gestión de fuentes

2. **Add the source type**:
   - Add its color to the `typeColor` map in `src/app/(dashboard)/dashboard/page.tsx` and `subjects/[id]/page.tsx`
   - Add its label to the `typeLabel` map
   - Add the platform badge in `src/app/page.tsx` under the correct plan tier

3. **Create the fetcher** in `src/app/api/sources/<type>/` following existing patterns:
   - Fetch content from the platform's public API or RSS
   - Return normalized array of `{ title, url, published_at, summary? }`

4. **Update the digest generator** to include the new source type.

5. **Verify plan gating** — confirm the new source is only accessible on the correct plan tier.
