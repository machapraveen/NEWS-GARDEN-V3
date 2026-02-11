// ============================================================
// News Channels - Supabase Client Utilities
// For Pratinidhi AI
// ============================================================

import { createClient } from '@supabase/supabase-js'

// Types
export interface NewsChannel {
  id: number
  channel_name: string
  country: string
  country_code: string
  continent: string
  indian_state: string | null
  language: string
  youtube_url: string
  youtube_handle: string
  channel_type: string
  scope: 'global' | 'national' | 'state' | 'city'
  notes: string
  is_active: boolean
}

export interface IndiaStateChannel {
  id: number
  channel_name: string
  state: string
  is_ut: boolean
  language: string
  youtube_url: string
  youtube_handle: string
  channel_type: string
  notes: string
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ============================================================
// QUERY FUNCTIONS
// ============================================================

/** Get all news channels (flat view) */
export async function getAllChannels() {
  const { data, error } = await supabase
    .from('v_news_channels')
    .select('*')
  if (error) throw error
  return data as NewsChannel[]
}

/** Get global channels (one per country) */
export async function getGlobalChannels() {
  const { data, error } = await supabase
    .from('v_global_channels')
    .select('*')
  if (error) throw error
  return data
}

/** Get channels by continent */
export async function getChannelsByContinent(continent: string) {
  const { data, error } = await supabase
    .rpc('get_channels_by_continent', { p_continent: continent })
  if (error) throw error
  return data as NewsChannel[]
}

/** Get all India national channels */
export async function getIndiaNationalChannels() {
  const { data, error } = await supabase
    .from('news_channels')
    .select('*, countries(name), continents(name)')
    .eq('scope', 'national')
    .eq('is_active', true)
    .order('channel_name')
  if (error) throw error
  return data
}

/** Get India state-wise channels */
export async function getIndiaStateChannels() {
  const { data, error } = await supabase
    .from('v_india_state_channels')
    .select('*')
  if (error) throw error
  return data as IndiaStateChannel[]
}

/** Get channels for a specific Indian state */
export async function getChannelsByState(state: string) {
  const { data, error } = await supabase
    .rpc('get_channels_by_state', { p_state: state })
  if (error) throw error
  return data as IndiaStateChannel[]
}

/** Get channels by language */
export async function getChannelsByLanguage(language: string) {
  const { data, error } = await supabase
    .from('v_news_channels')
    .select('*')
    .ilike('language', `%${language}%`)
  if (error) throw error
  return data as NewsChannel[]
}

/** Full-text search across channels */
export async function searchChannels(query: string) {
  const { data, error } = await supabase
    .rpc('search_channels', { p_query: query })
  if (error) throw error
  return data
}

/** Get all continents */
export async function getContinents() {
  const { data, error } = await supabase
    .from('continents')
    .select('*')
    .order('name')
  if (error) throw error
  return data
}

/** Get all countries grouped by continent */
export async function getCountriesByContinent() {
  const { data, error } = await supabase
    .from('countries')
    .select('*, continents(name)')
    .order('name')
  if (error) throw error
  return data
}

/** Get all Indian states */
export async function getIndianStates() {
  const { data, error } = await supabase
    .from('indian_states')
    .select('*')
    .order('name')
  if (error) throw error
  return data
}

/** Get channel count stats */
export async function getChannelStats() {
  const [global, national, state] = await Promise.all([
    supabase.from('news_channels').select('id', { count: 'exact' }).eq('scope', 'global'),
    supabase.from('news_channels').select('id', { count: 'exact' }).eq('scope', 'national'),
    supabase.from('news_channels').select('id', { count: 'exact' }).eq('scope', 'state'),
  ])
  return {
    global: global.count ?? 0,
    national: national.count ?? 0,
    state: state.count ?? 0,
    total: (global.count ?? 0) + (national.count ?? 0) + (state.count ?? 0),
  }
}

// ============================================================
// USAGE EXAMPLES
// ============================================================
//
// // In a Next.js page or component:
// const channels = await getChannelsByState('Telangana')
// channels.forEach(ch => {
//   console.log(`${ch.channel_name} - ${ch.youtube_url}`)
// })
//
// // Search:
// const results = await searchChannels('Telugu news Hyderabad')
//
// // Get all European channels:
// const euroChannels = await getChannelsByContinent('Europe')
