-- ============================================================
-- GLOBAL NEWS CHANNELS DIRECTORY — SUPABASE MIGRATION
-- Pratinidhi AI - News Channels Database
-- ============================================================
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================

-- 1. CREATE ENUMS
-- ============================================================
DO $$ BEGIN
    CREATE TYPE channel_type AS ENUM (
        'public_broadcaster', 'private', 'state_broadcaster',
        'state_funded', 'state_linked', 'wire_service',
        'digital_first', 'independent'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE channel_scope AS ENUM ('global', 'national', 'state', 'city');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. CREATE TABLES
-- ============================================================

-- Continents
CREATE TABLE IF NOT EXISTS continents (
    id SMALLSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Countries
CREATE TABLE IF NOT EXISTS countries (
    id SMALLSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    continent_id SMALLINT REFERENCES continents(id) ON DELETE CASCADE,
    code CHAR(2),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indian States / UTs
CREATE TABLE IF NOT EXISTS indian_states (
    id SMALLSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    is_ut BOOLEAN DEFAULT false,
    primary_language TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- News Channels (main table)
CREATE TABLE IF NOT EXISTS news_channels (
    id SERIAL PRIMARY KEY,
    channel_name TEXT NOT NULL,
    country_id SMALLINT REFERENCES countries(id) ON DELETE CASCADE,
    indian_state_id SMALLINT REFERENCES indian_states(id) ON DELETE SET NULL,
    continent_id SMALLINT REFERENCES continents(id) ON DELETE CASCADE,
    language TEXT NOT NULL,
    youtube_url TEXT NOT NULL,
    youtube_handle TEXT,
    channel_type channel_type DEFAULT 'private',
    scope channel_scope DEFAULT 'global',
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    subscriber_count_approx TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. INDEXES FOR FAST QUERIES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_news_channels_country ON news_channels(country_id);
CREATE INDEX IF NOT EXISTS idx_news_channels_state ON news_channels(indian_state_id);
CREATE INDEX IF NOT EXISTS idx_news_channels_continent ON news_channels(continent_id);
CREATE INDEX IF NOT EXISTS idx_news_channels_scope ON news_channels(scope);
CREATE INDEX IF NOT EXISTS idx_news_channels_language ON news_channels(language);
CREATE INDEX IF NOT EXISTS idx_news_channels_active ON news_channels(is_active) WHERE is_active = true;

-- Full-text search index
ALTER TABLE news_channels ADD COLUMN IF NOT EXISTS fts tsvector
    GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(channel_name, '') || ' ' || coalesce(language, '') || ' ' || coalesce(notes, ''))
    ) STORED;
CREATE INDEX IF NOT EXISTS idx_news_channels_fts ON news_channels USING gin(fts);

-- 4. AUTO-UPDATE trigger for updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_news_channels_updated ON news_channels;
CREATE TRIGGER trg_news_channels_updated
    BEFORE UPDATE ON news_channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE continents ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE indian_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_channels ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can read news channels)
CREATE POLICY "Public read continents" ON continents FOR SELECT USING (true);
CREATE POLICY "Public read countries" ON countries FOR SELECT USING (true);
CREATE POLICY "Public read indian_states" ON indian_states FOR SELECT USING (true);
CREATE POLICY "Public read news_channels" ON news_channels FOR SELECT USING (true);

-- Only authenticated users can insert/update (admin)
CREATE POLICY "Auth insert news_channels" ON news_channels FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update news_channels" ON news_channels FOR UPDATE TO authenticated USING (true);

-- 6. SEED DATA — CONTINENTS
-- ============================================================
INSERT INTO continents (name) VALUES
    ('Asia'), ('Middle East'), ('Europe'), ('North America'),
    ('South America'), ('Africa'), ('Oceania'), ('International')
ON CONFLICT (name) DO NOTHING;

-- 7. SEED DATA — COUNTRIES
-- ============================================================
INSERT INTO countries (name, continent_id, code) VALUES
    -- Asia
    ('India', (SELECT id FROM continents WHERE name='Asia'), 'IN'),
    ('China', (SELECT id FROM continents WHERE name='Asia'), 'CN'),
    ('Japan', (SELECT id FROM continents WHERE name='Asia'), 'JP'),
    ('South Korea', (SELECT id FROM continents WHERE name='Asia'), 'KR'),
    ('Pakistan', (SELECT id FROM continents WHERE name='Asia'), 'PK'),
    ('Bangladesh', (SELECT id FROM continents WHERE name='Asia'), 'BD'),
    ('Sri Lanka', (SELECT id FROM continents WHERE name='Asia'), 'LK'),
    ('Nepal', (SELECT id FROM continents WHERE name='Asia'), 'NP'),
    ('Myanmar', (SELECT id FROM continents WHERE name='Asia'), 'MM'),
    ('Thailand', (SELECT id FROM continents WHERE name='Asia'), 'TH'),
    ('Vietnam', (SELECT id FROM continents WHERE name='Asia'), 'VN'),
    ('Indonesia', (SELECT id FROM continents WHERE name='Asia'), 'ID'),
    ('Malaysia', (SELECT id FROM continents WHERE name='Asia'), 'MY'),
    ('Philippines', (SELECT id FROM continents WHERE name='Asia'), 'PH'),
    ('Singapore', (SELECT id FROM continents WHERE name='Asia'), 'SG'),
    ('Taiwan', (SELECT id FROM continents WHERE name='Asia'), 'TW'),
    ('Afghanistan', (SELECT id FROM continents WHERE name='Asia'), 'AF'),
    ('Cambodia', (SELECT id FROM continents WHERE name='Asia'), 'KH'),
    ('Mongolia', (SELECT id FROM continents WHERE name='Asia'), 'MN'),
    -- Middle East
    ('Qatar', (SELECT id FROM continents WHERE name='Middle East'), 'QA'),
    ('UAE', (SELECT id FROM continents WHERE name='Middle East'), 'AE'),
    ('Saudi Arabia', (SELECT id FROM continents WHERE name='Middle East'), 'SA'),
    ('Turkey', (SELECT id FROM continents WHERE name='Middle East'), 'TR'),
    ('Iran', (SELECT id FROM continents WHERE name='Middle East'), 'IR'),
    ('Israel', (SELECT id FROM continents WHERE name='Middle East'), 'IL'),
    ('Iraq', (SELECT id FROM continents WHERE name='Middle East'), 'IQ'),
    ('Lebanon', (SELECT id FROM continents WHERE name='Middle East'), 'LB'),
    ('Jordan', (SELECT id FROM continents WHERE name='Middle East'), 'JO'),
    ('Kuwait', (SELECT id FROM continents WHERE name='Middle East'), 'KW'),
    ('Oman', (SELECT id FROM continents WHERE name='Middle East'), 'OM'),
    ('Bahrain', (SELECT id FROM continents WHERE name='Middle East'), 'BH'),
    -- Europe
    ('United Kingdom', (SELECT id FROM continents WHERE name='Europe'), 'GB'),
    ('Germany', (SELECT id FROM continents WHERE name='Europe'), 'DE'),
    ('France', (SELECT id FROM continents WHERE name='Europe'), 'FR'),
    ('Italy', (SELECT id FROM continents WHERE name='Europe'), 'IT'),
    ('Spain', (SELECT id FROM continents WHERE name='Europe'), 'ES'),
    ('Netherlands', (SELECT id FROM continents WHERE name='Europe'), 'NL'),
    ('Belgium', (SELECT id FROM continents WHERE name='Europe'), 'BE'),
    ('Sweden', (SELECT id FROM continents WHERE name='Europe'), 'SE'),
    ('Norway', (SELECT id FROM continents WHERE name='Europe'), 'NO'),
    ('Denmark', (SELECT id FROM continents WHERE name='Europe'), 'DK'),
    ('Finland', (SELECT id FROM continents WHERE name='Europe'), 'FI'),
    ('Switzerland', (SELECT id FROM continents WHERE name='Europe'), 'CH'),
    ('Austria', (SELECT id FROM continents WHERE name='Europe'), 'AT'),
    ('Poland', (SELECT id FROM continents WHERE name='Europe'), 'PL'),
    ('Portugal', (SELECT id FROM continents WHERE name='Europe'), 'PT'),
    ('Greece', (SELECT id FROM continents WHERE name='Europe'), 'GR'),
    ('Ireland', (SELECT id FROM continents WHERE name='Europe'), 'IE'),
    ('Czech Republic', (SELECT id FROM continents WHERE name='Europe'), 'CZ'),
    ('Romania', (SELECT id FROM continents WHERE name='Europe'), 'RO'),
    ('Hungary', (SELECT id FROM continents WHERE name='Europe'), 'HU'),
    ('Ukraine', (SELECT id FROM continents WHERE name='Europe'), 'UA'),
    ('Russia', (SELECT id FROM continents WHERE name='Europe'), 'RU'),
    ('Serbia', (SELECT id FROM continents WHERE name='Europe'), 'RS'),
    ('Croatia', (SELECT id FROM continents WHERE name='Europe'), 'HR'),
    ('Bulgaria', (SELECT id FROM continents WHERE name='Europe'), 'BG'),
    ('Iceland', (SELECT id FROM continents WHERE name='Europe'), 'IS'),
    -- North America
    ('United States', (SELECT id FROM continents WHERE name='North America'), 'US'),
    ('Canada', (SELECT id FROM continents WHERE name='North America'), 'CA'),
    ('Mexico', (SELECT id FROM continents WHERE name='North America'), 'MX'),
    ('Cuba', (SELECT id FROM continents WHERE name='North America'), 'CU'),
    ('Jamaica', (SELECT id FROM continents WHERE name='North America'), 'JM'),
    ('Guatemala', (SELECT id FROM continents WHERE name='North America'), 'GT'),
    ('Honduras', (SELECT id FROM continents WHERE name='North America'), 'HN'),
    ('Costa Rica', (SELECT id FROM continents WHERE name='North America'), 'CR'),
    ('Panama', (SELECT id FROM continents WHERE name='North America'), 'PA'),
    ('Dominican Republic', (SELECT id FROM continents WHERE name='North America'), 'DO'),
    ('Haiti', (SELECT id FROM continents WHERE name='North America'), 'HT'),
    ('El Salvador', (SELECT id FROM continents WHERE name='North America'), 'SV'),
    ('Trinidad & Tobago', (SELECT id FROM continents WHERE name='North America'), 'TT'),
    -- South America
    ('Brazil', (SELECT id FROM continents WHERE name='South America'), 'BR'),
    ('Argentina', (SELECT id FROM continents WHERE name='South America'), 'AR'),
    ('Colombia', (SELECT id FROM continents WHERE name='South America'), 'CO'),
    ('Chile', (SELECT id FROM continents WHERE name='South America'), 'CL'),
    ('Peru', (SELECT id FROM continents WHERE name='South America'), 'PE'),
    ('Venezuela', (SELECT id FROM continents WHERE name='South America'), 'VE'),
    ('Ecuador', (SELECT id FROM continents WHERE name='South America'), 'EC'),
    ('Uruguay', (SELECT id FROM continents WHERE name='South America'), 'UY'),
    ('Paraguay', (SELECT id FROM continents WHERE name='South America'), 'PY'),
    ('Bolivia', (SELECT id FROM continents WHERE name='South America'), 'BO'),
    -- Africa
    ('Nigeria', (SELECT id FROM continents WHERE name='Africa'), 'NG'),
    ('South Africa', (SELECT id FROM continents WHERE name='Africa'), 'ZA'),
    ('Kenya', (SELECT id FROM continents WHERE name='Africa'), 'KE'),
    ('Egypt', (SELECT id FROM continents WHERE name='Africa'), 'EG'),
    ('Morocco', (SELECT id FROM continents WHERE name='Africa'), 'MA'),
    ('Algeria', (SELECT id FROM continents WHERE name='Africa'), 'DZ'),
    ('Ghana', (SELECT id FROM continents WHERE name='Africa'), 'GH'),
    ('Ethiopia', (SELECT id FROM continents WHERE name='Africa'), 'ET'),
    ('Tanzania', (SELECT id FROM continents WHERE name='Africa'), 'TZ'),
    ('Uganda', (SELECT id FROM continents WHERE name='Africa'), 'UG'),
    ('Rwanda', (SELECT id FROM continents WHERE name='Africa'), 'RW'),
    ('Senegal', (SELECT id FROM continents WHERE name='Africa'), 'SN'),
    ('Ivory Coast', (SELECT id FROM continents WHERE name='Africa'), 'CI'),
    ('Tunisia', (SELECT id FROM continents WHERE name='Africa'), 'TN'),
    ('Libya', (SELECT id FROM continents WHERE name='Africa'), 'LY'),
    ('Sudan', (SELECT id FROM continents WHERE name='Africa'), 'SD'),
    ('Somalia', (SELECT id FROM continents WHERE name='Africa'), 'SO'),
    ('Zimbabwe', (SELECT id FROM continents WHERE name='Africa'), 'ZW'),
    ('Mozambique', (SELECT id FROM continents WHERE name='Africa'), 'MZ'),
    ('Cameroon', (SELECT id FROM continents WHERE name='Africa'), 'CM'),
    ('Congo (DRC)', (SELECT id FROM continents WHERE name='Africa'), 'CD'),
    ('Madagascar', (SELECT id FROM continents WHERE name='Africa'), 'MG'),
    -- Oceania
    ('Australia', (SELECT id FROM continents WHERE name='Oceania'), 'AU'),
    ('New Zealand', (SELECT id FROM continents WHERE name='Oceania'), 'NZ'),
    ('Fiji', (SELECT id FROM continents WHERE name='Oceania'), 'FJ'),
    ('Papua New Guinea', (SELECT id FROM continents WHERE name='Oceania'), 'PG')
ON CONFLICT (name) DO NOTHING;

-- 8. SEED DATA — INDIAN STATES & UTs
-- ============================================================
INSERT INTO indian_states (name, is_ut, primary_language) VALUES
    ('Andhra Pradesh', false, 'Telugu'),
    ('Arunachal Pradesh', false, 'English/Hindi'),
    ('Assam', false, 'Assamese'),
    ('Bihar', false, 'Hindi'),
    ('Chhattisgarh', false, 'Hindi'),
    ('Goa', false, 'Konkani'),
    ('Gujarat', false, 'Gujarati'),
    ('Haryana', false, 'Hindi'),
    ('Himachal Pradesh', false, 'Hindi'),
    ('Jharkhand', false, 'Hindi'),
    ('Karnataka', false, 'Kannada'),
    ('Kerala', false, 'Malayalam'),
    ('Madhya Pradesh', false, 'Hindi'),
    ('Maharashtra', false, 'Marathi'),
    ('Manipur', false, 'Manipuri'),
    ('Meghalaya', false, 'English/Khasi'),
    ('Mizoram', false, 'Mizo'),
    ('Nagaland', false, 'English'),
    ('Odisha', false, 'Odia'),
    ('Punjab', false, 'Punjabi'),
    ('Rajasthan', false, 'Hindi'),
    ('Sikkim', false, 'Nepali'),
    ('Tamil Nadu', false, 'Tamil'),
    ('Telangana', false, 'Telugu'),
    ('Tripura', false, 'Bengali'),
    ('Uttar Pradesh', false, 'Hindi'),
    ('Uttarakhand', false, 'Hindi'),
    ('West Bengal', false, 'Bengali'),
    -- Union Territories
    ('Delhi', true, 'Hindi'),
    ('Puducherry', true, 'Tamil'),
    ('Chandigarh', true, 'Hindi/Punjabi'),
    ('Jammu & Kashmir', true, 'Urdu/Hindi'),
    ('Ladakh', true, 'Ladakhi/Hindi'),
    ('Lakshadweep', true, 'Malayalam'),
    ('Andaman & Nicobar', true, 'Hindi/English')
ON CONFLICT (name) DO NOTHING;

-- 9. SEED DATA — GLOBAL NEWS CHANNELS
-- ============================================================
-- Helper: using a DO block for cleaner inserts with lookups

DO $$
DECLARE
    v_country_id SMALLINT;
    v_continent_id SMALLINT;
BEGIN

-- ========== ASIA ==========
SELECT id INTO v_continent_id FROM continents WHERE name = 'Asia';

SELECT id INTO v_country_id FROM countries WHERE name = 'China';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('CGTN', v_country_id, v_continent_id, 'English/Chinese', 'https://www.youtube.com/@CGTNOfficial', '@CGTNOfficial', 'state_broadcaster', 'global', 'China Global Television Network');

SELECT id INTO v_country_id FROM countries WHERE name = 'Japan';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('NHK World-Japan', v_country_id, v_continent_id, 'English/Japanese', 'https://www.youtube.com/@NHKWORLDJAPAN', '@NHKWORLDJAPAN', 'public_broadcaster', 'global', 'Japan public broadcaster');

SELECT id INTO v_country_id FROM countries WHERE name = 'South Korea';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('KBS World', v_country_id, v_continent_id, 'Korean/English', 'https://www.youtube.com/@KBSWorldTV', '@KBSWorldTV', 'public_broadcaster', 'global', 'Korean Broadcasting System');

SELECT id INTO v_country_id FROM countries WHERE name = 'Pakistan';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('ARY News', v_country_id, v_continent_id, 'Urdu', 'https://www.youtube.com/@ABORNNEWSASIA', '@ARYNEWSASIA', 'private', 'global', 'Most watched Pakistani news');

SELECT id INTO v_country_id FROM countries WHERE name = 'Bangladesh';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('Jamuna TV', v_country_id, v_continent_id, 'Bengali', 'https://www.youtube.com/@JamunaTelevision', '@JamunaTelevision', 'private', 'global', 'Leading Bangladeshi news');

SELECT id INTO v_country_id FROM countries WHERE name = 'Sri Lanka';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('Hiru News', v_country_id, v_continent_id, 'Sinhala', 'https://www.youtube.com/@HiruNews', '@HiruNews', 'private', 'global', 'Top Sri Lankan channel');

SELECT id INTO v_country_id FROM countries WHERE name = 'Nepal';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('Kantipur TV', v_country_id, v_continent_id, 'Nepali', 'https://www.youtube.com/@KantipurTV', '@KantipurTV', 'private', 'global', 'Nepal top news');

SELECT id INTO v_country_id FROM countries WHERE name = 'Myanmar';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('DVB News', v_country_id, v_continent_id, 'Burmese', 'https://www.youtube.com/@DVBTVNews', '@DVBTVNews', 'independent', 'global', 'Democratic Voice of Burma');

SELECT id INTO v_country_id FROM countries WHERE name = 'Thailand';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('Thai PBS', v_country_id, v_continent_id, 'Thai', 'https://www.youtube.com/@ThaiPBS', '@ThaiPBS', 'public_broadcaster', 'global', 'Thai public broadcaster');

SELECT id INTO v_country_id FROM countries WHERE name = 'Vietnam';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('VTV News', v_country_id, v_continent_id, 'Vietnamese', 'https://www.youtube.com/@VTV24', '@VTV24', 'state_broadcaster', 'global', 'Vietnam Television');

SELECT id INTO v_country_id FROM countries WHERE name = 'Indonesia';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('Kompas TV', v_country_id, v_continent_id, 'Indonesian', 'https://www.youtube.com/@KompasTV', '@KompasTV', 'private', 'global', 'Top Indonesian news');

SELECT id INTO v_country_id FROM countries WHERE name = 'Malaysia';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('Astro AWANI', v_country_id, v_continent_id, 'Malay/English', 'https://www.youtube.com/@astroawani', '@astroawani', 'private', 'global', 'Malaysia #1 news');

SELECT id INTO v_country_id FROM countries WHERE name = 'Philippines';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('ABS-CBN News', v_country_id, v_continent_id, 'Filipino/English', 'https://www.youtube.com/@ABSCBNNews', '@ABSCBNNews', 'private', 'global', 'Largest Philippine network');

SELECT id INTO v_country_id FROM countries WHERE name = 'Singapore';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('CNA (Channel News Asia)', v_country_id, v_continent_id, 'English', 'https://www.youtube.com/@channelnewsasia', '@channelnewsasia', 'state_linked', 'global', 'Singapore flagship news');

SELECT id INTO v_country_id FROM countries WHERE name = 'Taiwan';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('TVBS News', v_country_id, v_continent_id, 'Mandarin', 'https://www.youtube.com/@TVBSNEWS01', '@TVBSNEWS01', 'private', 'global', 'Top Taiwan news');

SELECT id INTO v_country_id FROM countries WHERE name = 'Afghanistan';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('TOLOnews', v_country_id, v_continent_id, 'Dari/Pashto', 'https://www.youtube.com/@TOLOnews', '@TOLOnews', 'private', 'global', 'Afghanistan leading news');

SELECT id INTO v_country_id FROM countries WHERE name = 'Cambodia';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('Fresh News', v_country_id, v_continent_id, 'Khmer', 'https://www.youtube.com/@FreshNewsAsia', '@FreshNewsAsia', 'private', 'global', 'Cambodia top news');

SELECT id INTO v_country_id FROM countries WHERE name = 'Mongolia';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('MNB World', v_country_id, v_continent_id, 'Mongolian', 'https://www.youtube.com/@MNBworld', '@MNBworld', 'public_broadcaster', 'global', 'Mongolian National Broadcaster');

-- ========== MIDDLE EAST ==========
SELECT id INTO v_continent_id FROM continents WHERE name = 'Middle East';

SELECT id INTO v_country_id FROM countries WHERE name = 'Qatar';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('Al Jazeera English', v_country_id, v_continent_id, 'English/Arabic', 'https://www.youtube.com/@AlJazeeraEnglish', '@AlJazeeraEnglish', 'state_funded', 'global', 'Most watched global news livestream');

SELECT id INTO v_country_id FROM countries WHERE name = 'UAE';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('Al Arabiya', v_country_id, v_continent_id, 'Arabic', 'https://www.youtube.com/@AlArabiya', '@AlArabiya', 'private', 'global', 'Leading Arabic news');

SELECT id INTO v_country_id FROM countries WHERE name = 'Saudi Arabia';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('Al Ekhbariya', v_country_id, v_continent_id, 'Arabic', 'https://www.youtube.com/@alekhbariya', '@alekhbariya', 'state_broadcaster', 'global', 'Saudi state news');

SELECT id INTO v_country_id FROM countries WHERE name = 'Turkey';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('TRT World', v_country_id, v_continent_id, 'English/Turkish', 'https://www.youtube.com/@trtworld', '@trtworld', 'public_broadcaster', 'global', 'Turkish public broadcaster');

SELECT id INTO v_country_id FROM countries WHERE name = 'Iran';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('Press TV', v_country_id, v_continent_id, 'English/Persian', 'https://www.youtube.com/@PressTVEN', '@PressTVEN', 'state_broadcaster', 'global', 'Iranian state English news');

SELECT id INTO v_country_id FROM countries WHERE name = 'Israel';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('i24NEWS', v_country_id, v_continent_id, 'English/Hebrew', 'https://www.youtube.com/@i24NEWSen', '@i24NEWSen', 'private', 'global', 'Israeli international news');

SELECT id INTO v_country_id FROM countries WHERE name = 'Iraq';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('Rudaw Media', v_country_id, v_continent_id, 'Kurdish/Arabic', 'https://www.youtube.com/@RudawMedia', '@RudawMedia', 'private', 'global', 'Kurdish region news');

SELECT id INTO v_country_id FROM countries WHERE name = 'Lebanon';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('Al Mayadeen', v_country_id, v_continent_id, 'Arabic', 'https://www.youtube.com/@AlMayadeen', '@AlMayadeen', 'private', 'global', 'Lebanese pan-Arab news');

SELECT id INTO v_country_id FROM countries WHERE name = 'Jordan';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('Roya News', v_country_id, v_continent_id, 'Arabic', 'https://www.youtube.com/@RoyaNews', '@RoyaNews', 'private', 'global', 'Jordan top news');

-- ========== EUROPE ==========
SELECT id INTO v_continent_id FROM continents WHERE name = 'Europe';

SELECT id INTO v_country_id FROM countries WHERE name = 'United Kingdom';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('BBC News', v_country_id, v_continent_id, 'English', 'https://www.youtube.com/@BBCNews', '@BBCNews', 'public_broadcaster', 'global', 'Worlds most trusted news - 19M subs');

SELECT id INTO v_country_id FROM countries WHERE name = 'Germany';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('DW News', v_country_id, v_continent_id, 'English/German', 'https://www.youtube.com/@dwnews', '@dwnews', 'public_broadcaster', 'global', 'Deutsche Welle international');

SELECT id INTO v_country_id FROM countries WHERE name = 'France';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('France 24', v_country_id, v_continent_id, 'French/English', 'https://www.youtube.com/@FRANCE24English', '@FRANCE24English', 'public_broadcaster', 'global', 'French international news');

SELECT id INTO v_country_id FROM countries WHERE name = 'Italy';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('Rai News 24', v_country_id, v_continent_id, 'Italian', 'https://www.youtube.com/@rainews', '@rainews', 'public_broadcaster', 'global', 'Italian public broadcaster');

SELECT id INTO v_country_id FROM countries WHERE name = 'Spain';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('RTVE Noticias', v_country_id, v_continent_id, 'Spanish', 'https://www.youtube.com/@rtve', '@rtve', 'public_broadcaster', 'global', 'Spanish public broadcaster');

SELECT id INTO v_country_id FROM countries WHERE name = 'Netherlands';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('NOS', v_country_id, v_continent_id, 'Dutch', 'https://www.youtube.com/@NOS', '@NOS', 'public_broadcaster', 'global', 'Dutch public broadcaster');

SELECT id INTO v_country_id FROM countries WHERE name = 'Poland';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('TVN24', v_country_id, v_continent_id, 'Polish', 'https://www.youtube.com/@tvn24', '@tvn24', 'private', 'global', 'Poland top news channel');

SELECT id INTO v_country_id FROM countries WHERE name = 'Ukraine';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('NEXTA Live', v_country_id, v_continent_id, 'Ukrainian', 'https://www.youtube.com/@nextalive', '@nextalive', 'independent', 'global', '#1 News YouTube channel Jan 2026');

SELECT id INTO v_country_id FROM countries WHERE name = 'Russia';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('RT (Russia Today)', v_country_id, v_continent_id, 'English/Russian', 'https://www.youtube.com/@RT', '@RT', 'state_broadcaster', 'global', 'Russian state international');

SELECT id INTO v_country_id FROM countries WHERE name = 'Sweden';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('SVT Nyheter', v_country_id, v_continent_id, 'Swedish', 'https://www.youtube.com/@svt', '@svt', 'public_broadcaster', 'global', 'Swedish public broadcaster');

SELECT id INTO v_country_id FROM countries WHERE name = 'Norway';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('NRK', v_country_id, v_continent_id, 'Norwegian', 'https://www.youtube.com/@nrk', '@nrk', 'public_broadcaster', 'global', 'Norwegian Broadcasting');

SELECT id INTO v_country_id FROM countries WHERE name = 'Switzerland';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('SRF News', v_country_id, v_continent_id, 'German/French', 'https://www.youtube.com/@SRF', '@SRF', 'public_broadcaster', 'global', 'Swiss public broadcaster');

SELECT id INTO v_country_id FROM countries WHERE name = 'Ireland';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('RTÉ News', v_country_id, v_continent_id, 'English/Irish', 'https://www.youtube.com/@rtenews', '@rtenews', 'public_broadcaster', 'global', 'Irish public broadcaster');

SELECT id INTO v_country_id FROM countries WHERE name = 'Romania';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('Digi24', v_country_id, v_continent_id, 'Romanian', 'https://www.youtube.com/@Digi24HD', '@Digi24HD', 'private', 'global', 'Romania top news');

SELECT id INTO v_country_id FROM countries WHERE name = 'Serbia';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('N1 Info', v_country_id, v_continent_id, 'Serbian', 'https://www.youtube.com/@N1info', '@N1info', 'private', 'global', 'Balkans CNN affiliate');

-- ========== NORTH AMERICA ==========
SELECT id INTO v_continent_id FROM continents WHERE name = 'North America';

SELECT id INTO v_country_id FROM countries WHERE name = 'United States';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('Associated Press (AP)', v_country_id, v_continent_id, 'English', 'https://www.youtube.com/@AssociatedPress', '@AssociatedPress', 'wire_service', 'global', 'Most trusted wire service');

SELECT id INTO v_country_id FROM countries WHERE name = 'Canada';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('CBC News', v_country_id, v_continent_id, 'English/French', 'https://www.youtube.com/@cbcnews', '@cbcnews', 'public_broadcaster', 'global', 'Canadian public broadcaster');

SELECT id INTO v_country_id FROM countries WHERE name = 'Mexico';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('Televisa Noticias', v_country_id, v_continent_id, 'Spanish', 'https://www.youtube.com/@televisanoticias', '@televisanoticias', 'private', 'global', 'Mexico largest network');

-- ========== SOUTH AMERICA ==========
SELECT id INTO v_continent_id FROM continents WHERE name = 'South America';

SELECT id INTO v_country_id FROM countries WHERE name = 'Brazil';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('Globo News', v_country_id, v_continent_id, 'Portuguese', 'https://www.youtube.com/@globonews', '@globonews', 'private', 'global', 'Brazil largest news network');

SELECT id INTO v_country_id FROM countries WHERE name = 'Argentina';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('TN (Todo Noticias)', v_country_id, v_continent_id, 'Spanish', 'https://www.youtube.com/@todonoticias', '@todonoticias', 'private', 'global', 'Argentina #1 news');

SELECT id INTO v_country_id FROM countries WHERE name = 'Colombia';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('Caracol Noticias', v_country_id, v_continent_id, 'Spanish', 'https://www.youtube.com/@NoticiasCaracol', '@NoticiasCaracol', 'private', 'global', 'Colombia top news');

-- ========== AFRICA ==========
SELECT id INTO v_continent_id FROM continents WHERE name = 'Africa';

SELECT id INTO v_country_id FROM countries WHERE name = 'Nigeria';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('Channels Television', v_country_id, v_continent_id, 'English', 'https://www.youtube.com/@channelstelevision', '@channelstelevision', 'private', 'global', 'Nigeria most watched');

SELECT id INTO v_country_id FROM countries WHERE name = 'South Africa';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('eNCA', v_country_id, v_continent_id, 'English', 'https://www.youtube.com/@eNCA', '@eNCA', 'private', 'global', 'South Africa 24hr news');

SELECT id INTO v_country_id FROM countries WHERE name = 'Kenya';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('Citizen TV Kenya', v_country_id, v_continent_id, 'English/Swahili', 'https://www.youtube.com/@citizentvkenya', '@citizentvkenya', 'private', 'global', 'Africa largest livestream news');

SELECT id INTO v_country_id FROM countries WHERE name = 'Egypt';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('CBC Egypt', v_country_id, v_continent_id, 'Arabic', 'https://www.youtube.com/@CBCeGYPT', '@CBCeGYPT', 'private', 'global', 'Egypt top news network');

SELECT id INTO v_country_id FROM countries WHERE name = 'Ghana';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('Joy News', v_country_id, v_continent_id, 'English', 'https://www.youtube.com/@JoyNewsOnTV', '@JoyNewsOnTV', 'private', 'global', 'Ghana leading news');

-- ========== OCEANIA ==========
SELECT id INTO v_continent_id FROM continents WHERE name = 'Oceania';

SELECT id INTO v_country_id FROM countries WHERE name = 'Australia';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('ABC News Australia', v_country_id, v_continent_id, 'English', 'https://www.youtube.com/@ABCNewsAustralia', '@ABCNewsAustralia', 'public_broadcaster', 'global', 'Australian public broadcaster');

SELECT id INTO v_country_id FROM countries WHERE name = 'New Zealand';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('TVNZ', v_country_id, v_continent_id, 'English', 'https://www.youtube.com/@1NEWS', '@1NEWS', 'public_broadcaster', 'global', 'NZ public broadcaster');

-- ========== INTERNATIONAL WIRE SERVICES ==========
SELECT id INTO v_continent_id FROM continents WHERE name = 'International';
SELECT id INTO v_country_id FROM countries WHERE name = 'United Kingdom';

INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES
    ('Reuters', v_country_id, v_continent_id, 'English', 'https://www.youtube.com/@Reuters', '@Reuters', 'wire_service', 'global', 'Global wire service'),
    ('Sky News', v_country_id, v_continent_id, 'English', 'https://www.youtube.com/@SkyNews', '@SkyNews', 'private', 'global', 'UK 24hr news - 9M subs');

SELECT id INTO v_country_id FROM countries WHERE name = 'France';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('AFP News Agency', v_country_id, v_continent_id, 'English/French', 'https://www.youtube.com/@AFP', '@AFP', 'wire_service', 'global', 'Agence France-Presse');

SELECT id INTO v_country_id FROM countries WHERE name = 'United States';
INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes)
VALUES ('CNN', v_country_id, v_continent_id, 'English', 'https://www.youtube.com/@CNN', '@CNN', 'private', 'global', '19M subs - global reach');

END $$;

-- 10. SEED DATA — INDIA NATIONAL CHANNELS
-- ============================================================
DO $$
DECLARE
    v_india_id SMALLINT;
    v_asia_id SMALLINT;
BEGIN
    SELECT id INTO v_india_id FROM countries WHERE name = 'India';
    SELECT id INTO v_asia_id FROM continents WHERE name = 'Asia';

    INSERT INTO news_channels (channel_name, country_id, continent_id, language, youtube_url, youtube_handle, channel_type, scope, notes) VALUES
        ('NDTV India', v_india_id, v_asia_id, 'Hindi', 'https://www.youtube.com/@NDTVIndia', '@NDTVIndia', 'private', 'national', 'Top rated Hindi news'),
        ('Aaj Tak', v_india_id, v_asia_id, 'Hindi', 'https://www.youtube.com/@aajtak', '@aajtak', 'private', 'national', '#1 Hindi news by viewership'),
        ('NDTV 24x7', v_india_id, v_asia_id, 'English', 'https://www.youtube.com/@NDTV', '@NDTV', 'private', 'national', 'Most trusted English news'),
        ('DD News', v_india_id, v_asia_id, 'Hindi', 'https://www.youtube.com/@DDNewslive', '@DDNewslive', 'public_broadcaster', 'national', 'Prasar Bharati public broadcaster'),
        ('WION', v_india_id, v_asia_id, 'English', 'https://www.youtube.com/@WIONews', '@WIONews', 'private', 'national', 'Global news from India'),
        ('ABP News', v_india_id, v_asia_id, 'Hindi', 'https://www.youtube.com/@ABPNews', '@ABPNews', 'private', 'national', 'Popular Hindi news network'),
        ('India Today', v_india_id, v_asia_id, 'English', 'https://www.youtube.com/@IndiaToday', '@IndiaToday', 'private', 'national', 'India Today Group flagship'),
        ('Zee News', v_india_id, v_asia_id, 'Hindi', 'https://www.youtube.com/@zeenews', '@zeenews', 'private', 'national', 'Zee Media flagship - 41M subs'),
        ('Republic World', v_india_id, v_asia_id, 'English', 'https://www.youtube.com/@RepublicWorld', '@RepublicWorld', 'private', 'national', 'Popular English channel'),
        ('News18 India', v_india_id, v_asia_id, 'Hindi', 'https://www.youtube.com/@News18India', '@News18India', 'private', 'national', 'Network18 Hindi flagship'),
        ('TV9 Bharatvarsh', v_india_id, v_asia_id, 'Hindi', 'https://www.youtube.com/@TV9Bharatvarsh', '@TV9Bharatvarsh', 'private', 'national', 'Fast growing Hindi channel'),
        ('CNN-News18', v_india_id, v_asia_id, 'English', 'https://www.youtube.com/@CNNnews18', '@CNNnews18', 'private', 'national', 'CNN partnership in India'),
        ('The Quint', v_india_id, v_asia_id, 'English/Hindi', 'https://www.youtube.com/@TheQuint', '@TheQuint', 'digital_first', 'national', 'Independent digital news'),
        ('The Wire', v_india_id, v_asia_id, 'English/Hindi', 'https://www.youtube.com/@TheWireNews', '@TheWireNews', 'digital_first', 'national', 'Independent investigative'),
        ('MIRROR NOW', v_india_id, v_asia_id, 'English', 'https://www.youtube.com/@MirrorNow', '@MirrorNow', 'private', 'national', 'Times Group');
END $$;

-- 11. SEED DATA — INDIA STATE-WISE CHANNELS
-- ============================================================
DO $$
DECLARE
    v_india_id SMALLINT;
    v_asia_id SMALLINT;
    v_state_id SMALLINT;
BEGIN
    SELECT id INTO v_india_id FROM countries WHERE name = 'India';
    SELECT id INTO v_asia_id FROM continents WHERE name = 'Asia';

    -- ANDHRA PRADESH
    SELECT id INTO v_state_id FROM indian_states WHERE name = 'Andhra Pradesh';
    INSERT INTO news_channels (channel_name, country_id, continent_id, indian_state_id, language, youtube_url, youtube_handle, channel_type, scope, notes) VALUES
        ('TV9 Telugu', v_india_id, v_asia_id, v_state_id, 'Telugu', 'https://www.youtube.com/@TV9Telugu', '@TV9Telugu', 'private', 'state', 'Most watched Telugu news'),
        ('ABN Andhra Jyothi', v_india_id, v_asia_id, v_state_id, 'Telugu', 'https://www.youtube.com/@ABNTelugu', '@ABNTelugu', 'private', 'state', 'Strong editorial stance'),
        ('Sakshi TV', v_india_id, v_asia_id, v_state_id, 'Telugu', 'https://www.youtube.com/@SakshiTV', '@SakshiTV', 'private', 'state', 'Major AP news channel'),
        ('NTV Telugu', v_india_id, v_asia_id, v_state_id, 'Telugu', 'https://www.youtube.com/@NTVTelugu', '@NTVTelugu', 'private', 'state', 'Balanced reporting');

    -- TELANGANA
    SELECT id INTO v_state_id FROM indian_states WHERE name = 'Telangana';
    INSERT INTO news_channels (channel_name, country_id, continent_id, indian_state_id, language, youtube_url, youtube_handle, channel_type, scope, notes) VALUES
        ('V6 News Telugu', v_india_id, v_asia_id, v_state_id, 'Telugu', 'https://www.youtube.com/@V6NewsTelugu', '@V6NewsTelugu', 'private', 'state', 'Hyderabad-focused'),
        ('T News', v_india_id, v_asia_id, v_state_id, 'Telugu', 'https://www.youtube.com/@TNewsLive', '@TNewsLive', 'private', 'state', 'Telangana focused'),
        ('HMTV', v_india_id, v_asia_id, v_state_id, 'Telugu', 'https://www.youtube.com/@hmtvnewslive', '@hmtvnewslive', 'private', 'state', 'Hyderabad-based 24hr news');

    -- TAMIL NADU
    SELECT id INTO v_state_id FROM indian_states WHERE name = 'Tamil Nadu';
    INSERT INTO news_channels (channel_name, country_id, continent_id, indian_state_id, language, youtube_url, youtube_handle, channel_type, scope, notes) VALUES
        ('Thanthi TV', v_india_id, v_asia_id, v_state_id, 'Tamil', 'https://www.youtube.com/@ThanthiTV', '@ThanthiTV', 'private', 'state', 'Top Tamil news channel'),
        ('Puthiya Thalaimurai', v_india_id, v_asia_id, v_state_id, 'Tamil', 'https://www.youtube.com/@PuthiyaThalaimurai', '@PuthiyaThalaimurai', 'private', 'state', 'Award-winning journalism'),
        ('Sun News', v_india_id, v_asia_id, v_state_id, 'Tamil', 'https://www.youtube.com/@SunNews', '@SunNews', 'private', 'state', 'Sun Network flagship news'),
        ('Polimer News', v_india_id, v_asia_id, v_state_id, 'Tamil', 'https://www.youtube.com/@PolimerNews', '@PolimerNews', 'private', 'state', 'Most watched Tamil news by BARC'),
        ('News18 Tamil Nadu', v_india_id, v_asia_id, v_state_id, 'Tamil', 'https://www.youtube.com/@News18TamilNadu', '@News18TamilNadu', 'private', 'state', 'Network18 Tamil regional');

    -- KERALA
    SELECT id INTO v_state_id FROM indian_states WHERE name = 'Kerala';
    INSERT INTO news_channels (channel_name, country_id, continent_id, indian_state_id, language, youtube_url, youtube_handle, channel_type, scope, notes) VALUES
        ('Manorama News', v_india_id, v_asia_id, v_state_id, 'Malayalam', 'https://www.youtube.com/@mabornamanews', '@manoramanews', 'private', 'state', '#1 Malayalam news channel'),
        ('Mathrubhumi News', v_india_id, v_asia_id, v_state_id, 'Malayalam', 'https://www.youtube.com/@MathrubhumiNews', '@MathrubhumiNews', 'private', 'state', 'Established Malayalam news'),
        ('Asianet News', v_india_id, v_asia_id, v_state_id, 'Malayalam', 'https://www.youtube.com/@AsianetNews', '@AsianetNews', 'private', 'state', 'Popular Malayalam news'),
        ('MediaOne TV', v_india_id, v_asia_id, v_state_id, 'Malayalam', 'https://www.youtube.com/@MediaoneTVLive', '@MediaoneTVLive', 'private', 'state', 'Independent Malayalam journalism'),
        ('Reporter TV', v_india_id, v_asia_id, v_state_id, 'Malayalam', 'https://www.youtube.com/@ReporterTV', '@ReporterTV', 'private', 'state', 'Kerala news-focused');

    -- KARNATAKA
    SELECT id INTO v_state_id FROM indian_states WHERE name = 'Karnataka';
    INSERT INTO news_channels (channel_name, country_id, continent_id, indian_state_id, language, youtube_url, youtube_handle, channel_type, scope, notes) VALUES
        ('TV9 Kannada', v_india_id, v_asia_id, v_state_id, 'Kannada', 'https://www.youtube.com/@TV9Kannada', '@TV9Kannada', 'private', 'state', '#1 Kannada news channel'),
        ('Public TV', v_india_id, v_asia_id, v_state_id, 'Kannada', 'https://www.youtube.com/@PublicTVKannada', '@PublicTVKannada', 'private', 'state', 'Popular Kannada channel'),
        ('Suvarna News', v_india_id, v_asia_id, v_state_id, 'Kannada', 'https://www.youtube.com/@SuvarnaNewslive', '@SuvarnaNewslive', 'private', 'state', 'Star network Kannada');

    -- MAHARASHTRA
    SELECT id INTO v_state_id FROM indian_states WHERE name = 'Maharashtra';
    INSERT INTO news_channels (channel_name, country_id, continent_id, indian_state_id, language, youtube_url, youtube_handle, channel_type, scope, notes) VALUES
        ('ABP Majha', v_india_id, v_asia_id, v_state_id, 'Marathi', 'https://www.youtube.com/@ABPMajha', '@ABPMajha', 'private', 'state', '#1 Marathi news channel'),
        ('TV9 Marathi', v_india_id, v_asia_id, v_state_id, 'Marathi', 'https://www.youtube.com/@TV9Marathi', '@TV9Marathi', 'private', 'state', 'Fast growing Marathi news'),
        ('Zee 24 Taas', v_india_id, v_asia_id, v_state_id, 'Marathi', 'https://www.youtube.com/@Zee24Taas', '@Zee24Taas', 'private', 'state', 'Zee network Marathi news');

    -- GUJARAT
    SELECT id INTO v_state_id FROM indian_states WHERE name = 'Gujarat';
    INSERT INTO news_channels (channel_name, country_id, continent_id, indian_state_id, language, youtube_url, youtube_handle, channel_type, scope, notes) VALUES
        ('TV9 Gujarati', v_india_id, v_asia_id, v_state_id, 'Gujarati', 'https://www.youtube.com/@TV9Gujarati', '@TV9Gujarati', 'private', 'state', '#1 Gujarati news channel'),
        ('ABP Asmita', v_india_id, v_asia_id, v_state_id, 'Gujarati', 'https://www.youtube.com/@ABPAsmita', '@ABPAsmita', 'private', 'state', 'Popular Gujarati channel');

    -- WEST BENGAL
    SELECT id INTO v_state_id FROM indian_states WHERE name = 'West Bengal';
    INSERT INTO news_channels (channel_name, country_id, continent_id, indian_state_id, language, youtube_url, youtube_handle, channel_type, scope, notes) VALUES
        ('ABP Ananda', v_india_id, v_asia_id, v_state_id, 'Bengali', 'https://www.youtube.com/@ABPAnanda', '@ABPAnanda', 'private', 'state', '#1 Bengali news channel'),
        ('TV9 Bangla', v_india_id, v_asia_id, v_state_id, 'Bengali', 'https://www.youtube.com/@TV9Bangla', '@TV9Bangla', 'private', 'state', 'Growing Bengali news'),
        ('Zee 24 Ghanta', v_india_id, v_asia_id, v_state_id, 'Bengali', 'https://www.youtube.com/@Zee24Ghanta', '@Zee24Ghanta', 'private', 'state', 'Zee network Bengali');

    -- RAJASTHAN
    SELECT id INTO v_state_id FROM indian_states WHERE name = 'Rajasthan';
    INSERT INTO news_channels (channel_name, country_id, continent_id, indian_state_id, language, youtube_url, youtube_handle, channel_type, scope, notes) VALUES
        ('Zee Rajasthan', v_india_id, v_asia_id, v_state_id, 'Hindi', 'https://www.youtube.com/@ZeeRajasthan', '@ZeeRajasthan', 'private', 'state', 'Top Rajasthan news'),
        ('First India News', v_india_id, v_asia_id, v_state_id, 'Hindi', 'https://www.youtube.com/@FirstIndiaNews', '@FirstIndiaNews', 'private', 'state', 'Rajasthan-focused');

    -- UTTAR PRADESH
    SELECT id INTO v_state_id FROM indian_states WHERE name = 'Uttar Pradesh';
    INSERT INTO news_channels (channel_name, country_id, continent_id, indian_state_id, language, youtube_url, youtube_handle, channel_type, scope, notes) VALUES
        ('News18 UP Uttarakhand', v_india_id, v_asia_id, v_state_id, 'Hindi', 'https://www.youtube.com/@News18UPUttarakhand', '@News18UPUttarakhand', 'private', 'state', 'Top UP regional - 9.8M subs');

    -- MADHYA PRADESH
    SELECT id INTO v_state_id FROM indian_states WHERE name = 'Madhya Pradesh';
    INSERT INTO news_channels (channel_name, country_id, continent_id, indian_state_id, language, youtube_url, youtube_handle, channel_type, scope, notes) VALUES
        ('News18 MP Chhattisgarh', v_india_id, v_asia_id, v_state_id, 'Hindi', 'https://www.youtube.com/@News18MPCG', '@News18MPCG', 'private', 'state', 'Top MP regional channel');

    -- BIHAR
    SELECT id INTO v_state_id FROM indian_states WHERE name = 'Bihar';
    INSERT INTO news_channels (channel_name, country_id, continent_id, indian_state_id, language, youtube_url, youtube_handle, channel_type, scope, notes) VALUES
        ('News18 Bihar Jharkhand', v_india_id, v_asia_id, v_state_id, 'Hindi', 'https://www.youtube.com/@News18BiharJharkhand', '@News18BiharJharkhand', 'private', 'state', 'Top Bihar regional'),
        ('Zee Bihar Jharkhand', v_india_id, v_asia_id, v_state_id, 'Hindi', 'https://www.youtube.com/@ZeeBiharJharkhand', '@ZeeBiharJharkhand', 'private', 'state', 'Zee network Bihar');

    -- ODISHA
    SELECT id INTO v_state_id FROM indian_states WHERE name = 'Odisha';
    INSERT INTO news_channels (channel_name, country_id, continent_id, indian_state_id, language, youtube_url, youtube_handle, channel_type, scope, notes) VALUES
        ('OTV (Odisha TV)', v_india_id, v_asia_id, v_state_id, 'Odia', 'https://www.youtube.com/@OTVKhabar', '@OTVKhabar', 'private', 'state', '#1 Odia news channel'),
        ('Kanak News', v_india_id, v_asia_id, v_state_id, 'Odia', 'https://www.youtube.com/@KanakNewsOfficial', '@KanakNewsOfficial', 'private', 'state', 'Popular Odia channel'),
        ('Argus News', v_india_id, v_asia_id, v_state_id, 'Odia', 'https://www.youtube.com/@ArgusNewsOdisha', '@ArgusNewsOdisha', 'private', 'state', 'Odisha-focused news');

    -- ASSAM
    SELECT id INTO v_state_id FROM indian_states WHERE name = 'Assam';
    INSERT INTO news_channels (channel_name, country_id, continent_id, indian_state_id, language, youtube_url, youtube_handle, channel_type, scope, notes) VALUES
        ('News Live', v_india_id, v_asia_id, v_state_id, 'Assamese', 'https://www.youtube.com/@NewsLive', '@NewsLive', 'private', 'state', '#1 Assamese news channel'),
        ('Pratidin Time', v_india_id, v_asia_id, v_state_id, 'Assamese', 'https://www.youtube.com/@PratidinTime', '@PratidinTime', 'private', 'state', 'Popular Assamese channel');

    -- PUNJAB
    SELECT id INTO v_state_id FROM indian_states WHERE name = 'Punjab';
    INSERT INTO news_channels (channel_name, country_id, continent_id, indian_state_id, language, youtube_url, youtube_handle, channel_type, scope, notes) VALUES
        ('PTC News', v_india_id, v_asia_id, v_state_id, 'Punjabi', 'https://www.youtube.com/@PTCNews', '@PTCNews', 'private', 'state', '#1 Punjabi news channel'),
        ('ABP Sanjha', v_india_id, v_asia_id, v_state_id, 'Punjabi', 'https://www.youtube.com/@ABPSanjha', '@ABPSanjha', 'private', 'state', 'ABP network Punjabi');

    -- HARYANA
    SELECT id INTO v_state_id FROM indian_states WHERE name = 'Haryana';
    INSERT INTO news_channels (channel_name, country_id, continent_id, indian_state_id, language, youtube_url, youtube_handle, channel_type, scope, notes) VALUES
        ('India News Haryana', v_india_id, v_asia_id, v_state_id, 'Hindi', 'https://www.youtube.com/@IndiaNewsHaryana', '@IndiaNewsHaryana', 'private', 'state', '#1 Haryana news channel');

    -- GOA
    SELECT id INTO v_state_id FROM indian_states WHERE name = 'Goa';
    INSERT INTO news_channels (channel_name, country_id, continent_id, indian_state_id, language, youtube_url, youtube_handle, channel_type, scope, notes) VALUES
        ('Prudent Media Goa', v_india_id, v_asia_id, v_state_id, 'Konkani/English', 'https://www.youtube.com/@PrudentMedia', '@PrudentMedia', 'private', 'state', '#1 Goa news channel');

    -- MANIPUR
    SELECT id INTO v_state_id FROM indian_states WHERE name = 'Manipur';
    INSERT INTO news_channels (channel_name, country_id, continent_id, indian_state_id, language, youtube_url, youtube_handle, channel_type, scope, notes) VALUES
        ('ISTV Live', v_india_id, v_asia_id, v_state_id, 'Manipuri', 'https://www.youtube.com/@ISTVNetwork', '@ISTVNetwork', 'private', 'state', 'Top Manipur news');

    -- JAMMU & KASHMIR
    SELECT id INTO v_state_id FROM indian_states WHERE name = 'Jammu & Kashmir';
    INSERT INTO news_channels (channel_name, country_id, continent_id, indian_state_id, language, youtube_url, youtube_handle, channel_type, scope, notes) VALUES
        ('Greater Kashmir TV', v_india_id, v_asia_id, v_state_id, 'Urdu/Hindi', 'https://www.youtube.com/@GreaterKashmirTV', '@GreaterKashmirTV', 'private', 'state', 'Top J&K news');

    -- DELHI
    SELECT id INTO v_state_id FROM indian_states WHERE name = 'Delhi';
    INSERT INTO news_channels (channel_name, country_id, continent_id, indian_state_id, language, youtube_url, youtube_handle, channel_type, scope, notes) VALUES
        ('NDTV India (Delhi HQ)', v_india_id, v_asia_id, v_state_id, 'Hindi/English', 'https://www.youtube.com/@NDTVIndia', '@NDTVIndia', 'private', 'state', 'Delhi-headquartered national');

END $$;

-- 12. USEFUL VIEWS FOR YOUR APP
-- ============================================================

-- View: All channels with country and state names (flat view for API)
CREATE OR REPLACE VIEW v_news_channels AS
SELECT
    nc.id,
    nc.channel_name,
    c.name AS country,
    c.code AS country_code,
    ct.name AS continent,
    ist.name AS indian_state,
    nc.language,
    nc.youtube_url,
    nc.youtube_handle,
    nc.channel_type::text,
    nc.scope::text,
    nc.notes,
    nc.is_active
FROM news_channels nc
LEFT JOIN countries c ON nc.country_id = c.id
LEFT JOIN continents ct ON nc.continent_id = ct.id
LEFT JOIN indian_states ist ON nc.indian_state_id = ist.id
WHERE nc.is_active = true
ORDER BY ct.name, c.name, nc.channel_name;

-- View: India state-wise channels only
CREATE OR REPLACE VIEW v_india_state_channels AS
SELECT
    nc.id,
    nc.channel_name,
    ist.name AS state,
    ist.is_ut,
    nc.language,
    nc.youtube_url,
    nc.youtube_handle,
    nc.channel_type::text,
    nc.notes
FROM news_channels nc
JOIN indian_states ist ON nc.indian_state_id = ist.id
WHERE nc.is_active = true AND nc.scope = 'state'
ORDER BY ist.name, nc.channel_name;

-- View: Global channels (one per country)
CREATE OR REPLACE VIEW v_global_channels AS
SELECT
    nc.id,
    nc.channel_name,
    c.name AS country,
    c.code AS country_code,
    ct.name AS continent,
    nc.language,
    nc.youtube_url,
    nc.channel_type::text,
    nc.notes
FROM news_channels nc
JOIN countries c ON nc.country_id = c.id
JOIN continents ct ON nc.continent_id = ct.id
WHERE nc.is_active = true AND nc.scope = 'global'
ORDER BY ct.name, c.name;

-- 13. HELPER FUNCTIONS FOR YOUR APP
-- ============================================================

-- Function: Get channels by continent
CREATE OR REPLACE FUNCTION get_channels_by_continent(p_continent TEXT)
RETURNS SETOF v_news_channels AS $$
    SELECT * FROM v_news_channels WHERE continent = p_continent;
$$ LANGUAGE sql STABLE;

-- Function: Get channels by Indian state
CREATE OR REPLACE FUNCTION get_channels_by_state(p_state TEXT)
RETURNS SETOF v_india_state_channels AS $$
    SELECT * FROM v_india_state_channels WHERE state = p_state;
$$ LANGUAGE sql STABLE;

-- Function: Search channels (full-text)
CREATE OR REPLACE FUNCTION search_channels(p_query TEXT)
RETURNS TABLE (
    id INT,
    channel_name TEXT,
    language TEXT,
    youtube_url TEXT,
    notes TEXT,
    rank REAL
) AS $$
    SELECT
        nc.id,
        nc.channel_name,
        nc.language,
        nc.youtube_url,
        nc.notes,
        ts_rank(nc.fts, websearch_to_tsquery('english', p_query)) AS rank
    FROM news_channels nc
    WHERE nc.fts @@ websearch_to_tsquery('english', p_query)
    ORDER BY rank DESC;
$$ LANGUAGE sql STABLE;

-- ============================================================
-- DONE! Your news channels database is ready.
-- ============================================================
-- 
-- USAGE FROM SUPABASE CLIENT (JavaScript/TypeScript):
--
-- // Get all global channels
-- const { data } = await supabase.from('v_global_channels').select('*')
--
-- // Get India state channels
-- const { data } = await supabase.from('v_india_state_channels').select('*')
--
-- // Filter by continent
-- const { data } = await supabase.rpc('get_channels_by_continent', { p_continent: 'Asia' })
--
-- // Filter by Indian state  
-- const { data } = await supabase.rpc('get_channels_by_state', { p_state: 'Telangana' })
--
-- // Full-text search
-- const { data } = await supabase.rpc('search_channels', { p_query: 'Telugu news' })
--
-- // Filter news_channels table directly
-- const { data } = await supabase
--   .from('news_channels')
--   .select('*, countries(name, code), continents(name), indian_states(name)')
--   .eq('scope', 'state')
--   .eq('language', 'Telugu')
-- ============================================================
