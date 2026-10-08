# Project Context

## Supabase project ownership

- Project reference: `skperjaollqyonavnltk`
- Project name: `NEWS-GARDEN-V2`
- Supabase account association: `P2`
- Supabase account association confirmed for the API keys: `1437`
- Organization ID: `vercel_icfg_DbzV2YPrghSM37BmUJHXusyf`

This project belongs to the **P2** account, and both the newly updated Gemini and GNews API keys are associated with account **1437**. The project reference uniquely identifies the Supabase project; do not confuse it with the account email or username.

## GNews API key location

The GNews API key is stored as a **Supabase Edge Function secret** named `GNEWS_API_KEY`.

- Global/news fetch: `supabase/functions/fetch-news/index.ts`
- India state news fetch: `supabase/functions/fetch-state-news/index.ts`

The frontend only calls the edge functions. It does not call GNews directly. The frontend environment variables contain the Supabase Edge Function URL and key, not the GNews API key.

## Important security notes

- Never commit real API keys or secrets.
- Keep `GNEWS_API_KEY` in the Supabase Dashboard under Project Settings > Edge Functions > Secrets.
- If the key is changed, update the `GNEWS_API_KEY` secret in Supabase and redeploy the affected functions.
- Do not copy the secret into `src`, `.env`, or committed configuration files.
