// app/api/events/route.ts
import { prisma } from '@/lib/prisma';
import { faker } from '@faker-js/faker';

export const dynamic = 'force-dynamic';

// ─── SYNC COOLDOWN ────────────────────────────────────────────────────────────
const syncCooldown = new Map<string, number>();
const SYNC_TTL_MS  = 60 * 60 * 1000; // 60 min per unique query (artist sweeps are expensive)

function isSyncCoolingDown(key: string) {
  const last = syncCooldown.get(key);
  return !!last && Date.now() - last < SYNC_TTL_MS;
}
function markSynced(key: string) {
  syncCooldown.set(key, Date.now());
}

// ─── BOT POOL ─────────────────────────────────────────────────────────────────
const BOT_POOL_SIZE = 40;
let _botPoolCache: string[] | null = null;

async function getBotPool(): Promise<string[]> {
  if (_botPoolCache && _botPoolCache.length >= BOT_POOL_SIZE) return _botPoolCache;
  const existing = await prisma.sellerProfile.findMany({
    where: { isBot: true }, select: { id: true }, take: BOT_POOL_SIZE,
  });
  if (existing.length >= BOT_POOL_SIZE) {
    _botPoolCache = existing.map(b => b.id);
    return _botPoolCache;
  }
  const needed = BOT_POOL_SIZE - existing.length;
  await prisma.sellerProfile.createMany({
    data: Array.from({ length: needed }).map(() => ({
      name: 'Verified Seller', isBot: true, avatarUrl: faker.image.avatarGitHub(),
    })),
  });
  const allBots = await prisma.sellerProfile.findMany({
    where: { isBot: true }, select: { id: true }, take: BOT_POOL_SIZE,
  });
  _botPoolCache = allBots.map(b => b.id);
  return _botPoolCache;
}

// ─── TICKETMASTER SEGMENT / GENRE IDs ─────────────────────────────────────────
// Segment IDs (top-level classification)
const TM_SEGMENTS: Record<string, string> = {
  music:   'KZFzniwnSyZfZ7v7nJ',
  sports:  'KZFzniwnSyZfZ7v7nE',
  arts:    'KZFzniwnSyZfZ7v7na',
  family:  'KZFzniwnSyZfZ7v7n1',
  film:    'KZFzniwnSyZfZ7v7nn',
  misc:    'KZFzniwnSyZfZ7v7n2',
};

// Genre IDs under Music segment
const TM_MUSIC_GENRES: Record<string, string> = {
  rock:        'KnvZfZ7vAeA',
  pop:         'KnvZfZ7vAev',
  hiphop:      'KnvZfZ7vAv1',
  rnb:         'KnvZfZ7vAvv',
  country:     'KnvZfZ7vAv6',
  electronic:  'KnvZfZ7vAvF',
  jazz:        'KnvZfZ7vAea',
  classical:   'KnvZfZ7vAeJ',
  latin:       'KnvZfZ7vAv4',
  metal:       'KnvZfZ7vAvt',
  reggae:      'KnvZfZ7vAe7',
  folk:        'KnvZfZ7vAeW',
  blues:       'KnvZfZ7vAvd',
  gospel:      'KnvZfZ7vAe6',
  afrobeats:   'KnvZfZ7vAvv', // maps to R&B/world
};

// Genre IDs under Sports segment
const TM_SPORTS_GENRES: Record<string, string> = {
  nfl:       'KnvZfZ7vAde',
  nba:       'KnvZfZ7vAdv',
  mlb:       'KnvZfZ7vAda',
  nhl:       'KnvZfZ7vAdl',
  mls:       'KnvZfZ7vAdt',
  ufc:       'KnvZfZ7vAd7',
  boxing:    'KnvZfZ7vAdF',
  tennis:    'KnvZfZ7vAd1',
  golf:      'KnvZfZ7vAdb',
  wrestling: 'KnvZfZ7vAdE',
  soccer:    'KnvZfZ7vAdE',
  rugby:     'KnvZfZ7vAdn',
  cricket:   'KnvZfZ7vAdJ',
  motorsport:'KnvZfZ7vAdc',
};

// Sport abbreviation -> TM keyword map
const SPORT_ABBR: Record<string, string> = {
  'nfl': 'NFL Football', 'nba': 'NBA Basketball', 'mlb': 'MLB Baseball',
  'nhl': 'NHL Hockey',   'mls': 'MLS Soccer',     'ufc': 'UFC',
  'wwe': 'WWE Wrestling','pga': 'PGA Golf',        'atp': 'ATP Tennis',
  'wta': 'WTA Tennis',   'f1':  'Formula 1',       'nascar': 'NASCAR',
  'epl': 'Premier League Soccer', 'ucl': 'Champions League Soccer',
  'efl': 'EFL Soccer',   'laliga': 'La Liga Soccer',
  'ipl': 'IPL Cricket',  'bbl': 'BBL Cricket',
};

// Arts/Theatre sub-categories
const TM_ARTS_GENRES: Record<string, string> = {
  comedy:   'KnvZfZ7vAv6',
  theatre:  'KnvZfZ7vAe1',
  musical:  'KnvZfZ7vAeT',
  dance:    'KnvZfZ7vAeO',
  opera:    'KnvZfZ7vAe5',
  circus:   'KnvZfZ7vAeC',
};

// ─── CITY / COUNTRY ALIAS MAP ─────────────────────────────────────────────────
const CITY_ALIASES: Record<string, string> = {
  // US cities
  'nyc': 'New York', 'ny': 'New York', 'new yok': 'New York', 'new yokr': 'New York',
  'la': 'Los Angeles', 'los angles': 'Los Angeles', 'los angelos': 'Los Angeles',
  'chi': 'Chicago', 'chicgo': 'Chicago', 'sf': 'San Francisco', 'san fran': 'San Francisco',
  'dc': 'Washington', 'washington dc': 'Washington', 'lv': 'Las Vegas', 'vegas': 'Las Vegas',
  'atl': 'Atlanta', 'mia': 'Miami', 'bos': 'Boston', 'phx': 'Phoenix',
  'sea': 'Seattle', 'pdx': 'Portland', 'den': 'Denver', 'dal': 'Dallas',
  'hou': 'Houston', 'sat': 'San Antonio', 'sdq': 'San Diego', 'slc': 'Salt Lake City',
  'msp': 'Minneapolis', 'stl': 'St. Louis', 'det': 'Detroit', 'cle': 'Cleveland',
  'pit': 'Pittsburgh', 'bal': 'Baltimore', 'phi': 'Philadelphia', 'nas': 'Nashville',
  'mem': 'Memphis', 'cha': 'Charlotte', 'ind': 'Indianapolis', 'col': 'Columbus',
  'okc': 'Oklahoma City', 'kck': 'Kansas City', 'raleigh': 'Raleigh',
  // Canada
  'tor': 'Toronto', 'tronto': 'Toronto', 'van': 'Vancouver', 'mtl': 'Montreal',
  'yyc': 'Calgary', 'yeg': 'Edmonton', 'ott': 'Ottawa',
  // Europe
  'lon': 'London', 'londen': 'London', 'londn': 'London',
  'par': 'Paris', 'pris': 'Paris', 'paaris': 'Paris',
  'ber': 'Berlin', 'berlim': 'Berlin', 'muc': 'Munich', 'ham': 'Hamburg',
  'ams': 'Amsterdam', 'bru': 'Brussels', 'zur': 'Zurich', 'vie': 'Vienna',
  'mad': 'Madrid', 'bcn': 'Barcelona', 'lis': 'Lisbon', 'rom': 'Rome',
  'mil': 'Milan', 'fra': 'Frankfurt', 'cop': 'Copenhagen', 'sto': 'Stockholm',
  'hel': 'Helsinki', 'osl': 'Oslo', 'war': 'Warsaw', 'pra': 'Prague',
  'bud': 'Budapest', 'buc': 'Bucharest', 'ath': 'Athens', 'ist': 'Istanbul',
  'dub': 'Dublin', 'man': 'Manchester', 'bir': 'Birmingham', 'gla': 'Glasgow',
  'edi': 'Edinburgh', 'liv': 'Liverpool', 'bri': 'Bristol',
  // Asia Pacific
  'tok': 'Tokyo', 'tokio': 'Tokyo', 'osa': 'Osaka',
  'syd': 'Sydney', 'sydeny': 'Sydney', 'mel': 'Melbourne', 'melbourna': 'Melbourne',
  'bne': 'Brisbane', 'per': 'Perth', 'akl': 'Auckland',
  'sin': 'Singapore', 'hkg': 'Hong Kong', 'sei': 'Seoul', 'bkk': 'Bangkok',
  'kul': 'Kuala Lumpur', 'jkt': 'Jakarta', 'mni': 'Manila', 'mum': 'Mumbai',
  'del': 'Delhi', 'blr': 'Bangalore', 'hyd': 'Hyderabad', 'che': 'Chennai',
  // Middle East & Africa
  'dubai': 'Dubai', 'dubay': 'Dubai', 'dxb': 'Dubai',
  'ruh': 'Riyadh', 'cai': 'Cairo', 'lag': 'Lagos', 'abj': 'Abuja',
  'acc': 'Accra', 'nai': 'Nairobi', 'jnb': 'Johannesburg', 'cpt': 'Cape Town',
  'dar': 'Dar es Salaam', 'add': 'Addis Ababa', 'cas': 'Casablanca',
  // Latin America
  'sao': 'Sao Paulo', 'rio': 'Rio de Janeiro', 'bue': 'Buenos Aires',
  'bog': 'Bogota', 'lim': 'Lima', 'scl': 'Santiago', 'mex': 'Mexico City',
  'gdl': 'Guadalajara', 'med': 'Medellin', 'car': 'Caracas',
};

// Country name -> TM countryCode
const COUNTRY_CODES: Record<string, string> = {
  'united states': 'US', 'usa': 'US', 'us': 'US', 'america': 'US',
  'united kingdom': 'GB', 'uk': 'GB', 'england': 'GB', 'britain': 'GB',
  'canada': 'CA', 'ca': 'CA', 'australia': 'AU', 'au': 'AU',
  'germany': 'DE', 'de': 'DE', 'france': 'FR', 'fr': 'FR',
  'spain': 'ES', 'es': 'ES', 'italy': 'IT', 'it': 'IT',
  'netherlands': 'NL', 'nl': 'NL', 'brazil': 'BR', 'br': 'BR',
  'mexico': 'MX', 'mx': 'MX', 'japan': 'JP', 'jp': 'JP',
  'south korea': 'KR', 'korea': 'KR', 'kr': 'KR',
  'new zealand': 'NZ', 'nz': 'NZ', 'ireland': 'IE', 'ie': 'IE',
  'portugal': 'PT', 'pt': 'PT', 'sweden': 'SE', 'se': 'SE',
  'norway': 'NO', 'no': 'NO', 'denmark': 'DK', 'dk': 'DK',
  'finland': 'FI', 'fi': 'FI', 'belgium': 'BE', 'be': 'BE',
  'switzerland': 'CH', 'ch': 'CH', 'austria': 'AT', 'at': 'AT',
  'poland': 'PL', 'pl': 'PL', 'czech republic': 'CZ', 'czechia': 'CZ',
  'hungary': 'HU', 'hu': 'HU', 'romania': 'RO', 'ro': 'RO',
  'turkey': 'TR', 'tr': 'TR', 'greece': 'GR', 'gr': 'GR',
  'argentina': 'AR', 'ar': 'AR', 'chile': 'CL', 'cl': 'CL',
  'colombia': 'CO', 'co': 'CO', 'peru': 'PE', 'pe': 'PE',
  'india': 'IN', 'in': 'IN', 'singapore': 'SG', 'sg': 'SG',
  'south africa': 'ZA', 'za': 'ZA', 'nigeria': 'NG', 'ng': 'NG',
  'uae': 'AE', 'ae': 'AE', 'saudi arabia': 'SA', 'sa': 'SA',
  'israel': 'IL', 'il': 'IL', 'egypt': 'EG', 'eg': 'EG',
};

function normalizeCity(city: string | null): string | null {
  if (!city) return null;
  const lower = city.trim().toLowerCase();
  return CITY_ALIASES[lower] ?? city.trim();
}

function resolveCountryCode(raw: string | null): string | null {
  if (!raw) return null;
  return COUNTRY_CODES[raw.trim().toLowerCase()] ?? null;
}

// ─── RESOLVE KEYWORD TO TM PARAMS ─────────────────────────────────────────────
// Returns extra TM query params for known genre/sport keywords
function resolveKeywordToTmParams(keyword: string): Record<string, string> {
  const k = keyword.trim().toLowerCase();

  // Sport abbreviations
  if (SPORT_ABBR[k]) return { keyword: SPORT_ABBR[k] };

  // Music genres
  if (TM_MUSIC_GENRES[k]) return { segmentId: TM_SEGMENTS.music, genreId: TM_MUSIC_GENRES[k] };

  // Sports genres
  if (TM_SPORTS_GENRES[k]) return { segmentId: TM_SEGMENTS.sports, genreId: TM_SPORTS_GENRES[k] };

  // Arts genres
  if (TM_ARTS_GENRES[k]) return { segmentId: TM_SEGMENTS.arts, genreId: TM_ARTS_GENRES[k] };

  // Segment keywords
  if (['music', 'concert', 'tour', 'live music'].includes(k)) return { segmentId: TM_SEGMENTS.music };
  if (['sports', 'sport', 'game', 'match'].includes(k))        return { segmentId: TM_SEGMENTS.sports };
  if (['arts', 'theatre', 'theater', 'comedy', 'dance'].includes(k)) return { segmentId: TM_SEGMENTS.arts };
  if (['festival', 'fest'].includes(k)) return { keyword: 'Festival', segmentId: TM_SEGMENTS.music };
  if (['family', 'kids', 'children'].includes(k)) return { segmentId: TM_SEGMENTS.family };

  // Default: pass raw keyword
  return { keyword };
}

// ─── CATEGORY → TM PARAMS ─────────────────────────────────────────────────────
function categoryToTmParams(category: string): Record<string, string> {
  switch (category) {
    case 'Concerts': return { segmentId: TM_SEGMENTS.music };
    case 'Festivals': return { keyword: 'Festival', segmentId: TM_SEGMENTS.music };
    case 'Comedy':   return { segmentId: TM_SEGMENTS.arts, genreId: TM_ARTS_GENRES.comedy };
    case 'Theater':  return { segmentId: TM_SEGMENTS.arts };
    case 'Sports':   return { segmentId: TM_SEGMENTS.sports };
    default:         return {};
  }
}

// ─── FUZZY KEYWORD CORRECTION ─────────────────────────────────────────────────
async function correctKeyword(keyword: string, apiKey: string): Promise<string> {
  // Skip correction for short ALL-CAPS acronyms (UFC, WWE, NFL, etc.)
  const trimmed = keyword.trim();
  if (trimmed.length <= 5 && trimmed === trimmed.toUpperCase()) return keyword;
  // Skip if it's a known sport abbreviation
  if (SPORT_ABBR[trimmed.toLowerCase()]) return keyword;

  try {
    const url = `https://app.ticketmaster.com/discovery/v2/suggest?apikey=${apiKey}`
              + `&keyword=${encodeURIComponent(keyword)}&resource=attractions,events&size=1`;
    const res  = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return keyword;
    const json = await res.json();
    const suggestion =
      json._embedded?.attractions?.[0]?.name ||
      json._embedded?.events?.[0]?.name;
    if (!suggestion) return keyword;
    const similar = suggestion.toLowerCase().startsWith(keyword.toLowerCase().slice(0, 4));
    return similar ? suggestion : keyword;
  } catch {
    return keyword;
  }
}

// ─── FUZZY CITY CORRECTION ────────────────────────────────────────────────────
async function correctCity(city: string, apiKey: string): Promise<string> {
  try {
    const url = `https://app.ticketmaster.com/discovery/v2/suggest?apikey=${apiKey}`
              + `&keyword=${encodeURIComponent(city)}&resource=venues&size=1`;
    const res  = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return city;
    const json = await res.json();
    return json._embedded?.venues?.[0]?.city?.name || city;
  } catch {
    return city;
  }
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const rawCity     = searchParams.get('city');
  const rawCountry  = searchParams.get('country');
  const rawKeyword  = searchParams.get('keyword');
  const rawCategory = searchParams.get('category');
  const rawState    = searchParams.get('state');       // US state filter
  const apiKey      = process.env.TICKETMASTER_API_KEY;

  // ── 1. Resolve inputs in parallel ──────────────────────────────────────────
  const [resolvedKeyword, resolvedCity] = await Promise.all([
    rawKeyword && apiKey
      ? correctKeyword(rawKeyword, apiKey).catch(() => rawKeyword)
      : Promise.resolve(rawKeyword),

    rawCity && apiKey
      ? (async () => {
          const aliased = normalizeCity(rawCity);
          if (aliased !== rawCity) return aliased;
          return correctCity(rawCity, apiKey).catch(() => rawCity);
        })()
      : Promise.resolve(normalizeCity(rawCity)),
  ]);

  const resolvedCountryCode = resolveCountryCode(rawCountry);
  const keywordCorrected    = !!rawKeyword && resolvedKeyword !== rawKeyword;
  const cityCorrected       = !!rawCity    && resolvedCity    !== rawCity;
  const isGlobalQuery       = !resolvedKeyword && !resolvedCity && !rawCategory && !rawCountry;

  // ── 2. Build DB WHERE clause ────────────────────────────────────────────────
  const andConditions: any[] = [];

  if (resolvedKeyword) {
    const words = resolvedKeyword.trim().split(/\s+/).filter(Boolean);
    andConditions.push({
      OR: words.flatMap(word => [
        { title:       { contains: word, mode: 'insensitive' } },
        { description: { contains: word, mode: 'insensitive' } },
        { city:        { contains: word, mode: 'insensitive' } },
        { category:    { contains: word, mode: 'insensitive' } },
      ]),
    });
  }

  if (rawCategory && rawCategory !== 'All') {
    const catMap: Record<string, string[]> = {
      Concerts:  ['Music', 'Concert', 'Tour'],
      Festivals: ['Festival', 'Fest'],
      Comedy:    ['Comedy', 'Stand-up', 'Standup'],
      Theater:   ['Theatre', 'Theater', 'Arts', 'Musical', 'Dance', 'Opera'],
      Sports:    ['Sports', 'Sport', 'NFL', 'NBA', 'MLB', 'NHL', 'MLS', 'UFC', 'Boxing', 'Tennis', 'Soccer', 'Football', 'Basketball', 'Baseball', 'Hockey', 'Golf', 'Cricket', 'Rugby', 'Wrestling', 'Racing'],
    };
    const terms = catMap[rawCategory] ?? [rawCategory];
    andConditions.push({
      OR: terms.flatMap(t => [
        { title:       { contains: t, mode: 'insensitive' } },
        { description: { contains: t, mode: 'insensitive' } },
        { category:    { contains: t, mode: 'insensitive' } },
      ]),
    });
  }

  if (resolvedCity && !resolvedKeyword) {
    andConditions.push({ city: { contains: resolvedCity, mode: 'insensitive' } });
  }

  const dbQuery = andConditions.length > 0 ? { AND: andConditions } : {};

  // ── 3. Warm bot pool + count ────────────────────────────────────────────────
  getBotPool().catch(err => console.error('Bot pool warm failed:', err));
  const existingCount = await prisma.event.count({ where: dbQuery });

  // ── 4. Sync strategy ────────────────────────────────────────────────────────
  //
  // KEYWORD / ARTIST SEARCH  ← user explicitly searched, always hit TM fresh
  //   • Start the full artist sweep immediately (no cooldown gate).
  //   • If DB already has results: run sync IN PARALLEL and stream existing
  //     events right away; new events from TM are appended after sync finishes.
  //   • If DB is empty: await sync first so the user sees something.
  //
  // BROWSE (city / category / global)
  //   • Keep the background-with-cooldown approach — we don't want slow
  //     page loads when the user is just browsing.
  //
  const syncKey = [resolvedCity, rawState, resolvedCountryCode, resolvedKeyword, rawCategory]
    .map(v => v ?? '').join('::');

  let syncPromise: Promise<void> = Promise.resolve();

  if (resolvedKeyword && apiKey) {
    // Always fresh for explicit artist/keyword searches — no cooldown check
    markSynced(syncKey);
    syncPromise = syncExternalEvents(
      resolvedCity, rawState, resolvedCountryCode, resolvedKeyword,
      rawCategory, apiKey, rawCountry,
    ).catch(console.error);

    if (existingCount === 0) {
      // Nothing in DB yet — must wait before we can show anything
      await syncPromise;
      syncPromise = Promise.resolve(); // already done
    }
    // else: sync runs in parallel; we stream existing events now, new ones after
  } else {
    // Passive browse — cooldown-gated background sync
    if (apiKey && !isSyncCoolingDown(syncKey)) {
      markSynced(syncKey);
      syncPromise = syncExternalEvents(
        resolvedCity, rawState, resolvedCountryCode, resolvedKeyword,
        rawCategory, apiKey, rawCountry,
      ).catch(console.error);
    }
    if (existingCount === 0) {
      await syncPromise;
      syncPromise = Promise.resolve();
    }
  }

  const finalCount = await prisma.event.count({ where: dbQuery });

  // ── 5. Response headers ──────────────────────────────────────────────────────
  const headers: Record<string, string> = {
    'Content-Type':  'application/x-ndjson',
    'Cache-Control': 'no-cache',
    'Connection':    'keep-alive',
  };
  if (keywordCorrected && resolvedKeyword) {
    headers['X-Corrected-Keyword'] = resolvedKeyword;
    headers['X-Original-Keyword']  = rawKeyword!;
  }
  if (cityCorrected && resolvedCity) {
    headers['X-Corrected-City'] = resolvedCity;
  }

  // ── 6. Stream ────────────────────────────────────────────────────────────────
  const encoder   = new TextEncoder();
  const batchSize = 12;

  const stream = new ReadableStream({
    async start(controller) {
      const meta = {
        __meta: true,
        total:  finalCount,
        query: {
          keyword:          resolvedKeyword  ?? null,
          city:             resolvedCity     ?? null,
          state:            rawState         ?? null,
          country:          rawCountry       ?? null,
          countryCode:      resolvedCountryCode ?? null,
          category:         rawCategory      ?? null,
          isGlobal:         isGlobalQuery,
          correctedKeyword: keywordCorrected ? resolvedKeyword : null,
          correctedCity:    cityCorrected    ? resolvedCity    : null,
        },
      };
      controller.enqueue(encoder.encode(JSON.stringify(meta) + '\n'));

      if (finalCount === 0 && !resolvedKeyword) { controller.close(); return; }

      // Helper: stream all DB events matching a query, tracking IDs we've sent
      async function streamDbEvents(extraWhere: any = {}, seenIds: Set<string> = new Set()) {
        let skip    = 0;
        let hasMore = true;
        const sizes = [6, ...Array(200).fill(batchSize)];
        const combinedWhere = Object.keys(extraWhere).length
          ? { AND: [dbQuery, extraWhere] }
          : dbQuery;

        for (const take of sizes) {
          if (!hasMore) break;
          const batch = await prisma.event.findMany({
            where: combinedWhere,
            include: {
              ticketBatches: {
                where:   { quantity: { gt: 0 } },
                include: { seller: { select: { id: true, name: true, avatarUrl: true, isBot: true } } },
                orderBy: { price: 'asc' },
              },
            },
            orderBy: [{ isFeatured: 'desc' }, { date: 'asc' }],
            take,
            skip,
          });

          const fresh = batch.filter(e => !seenIds.has(e.id));
          if (batch.length === 0) {
            hasMore = false;
          } else if (fresh.length > 0) {
            const formatted = fresh.map(({ ticketBatches, ...rest }) => ({
              ...rest,
              listings: ticketBatches.map(tb => ({
                id: tb.id, price: tb.price, quantity: tb.quantity,
                ticketsSold: tb.ticketsSold, seller: tb.seller,
              })),
            }));
            controller.enqueue(encoder.encode(JSON.stringify(formatted) + '\n'));
            fresh.forEach(e => seenIds.add(e.id));
            skip += take;
          } else {
            // All results in this page already sent — no more new ones
            hasMore = false;
          }
        }
        return seenIds;
      }

      try {
        // ── Phase 1: stream whatever is already in DB right now ───────────────
        const sentIds = await streamDbEvents();

        // ── Phase 2 (keyword only): wait for TM sync to finish, then stream
        //    any NEW events it added that we haven't sent yet ──────────────────
        if (resolvedKeyword) {
          await syncPromise; // sync was running in parallel since request start
          await streamDbEvents({ id: { notIn: Array.from(sentIds) } }, sentIds);
        }
      } catch (err) {
        console.error('Stream error:', err);
        controller.enqueue(encoder.encode(JSON.stringify({ __error: 'Stream interrupted' }) + '\n'));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers });
}

// ─── TICKETMASTER MULTI-PASS SYNC ─────────────────────────────────────────────
async function syncExternalEvents(
  targetCity:         string | null,
  targetState:        string | null,
  countryCode:        string | null,
  keyword:            string | null,
  category:           string | null,
  apiKey:             string,
  targetCountryName:  string | null = null,
) {
  try {
    const BASE = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}`;

    // Build multiple fetch passes to maximise coverage
    const passes: string[] = [];

    // Common location params
    const locParts: string[] = [];
    if (targetCity)  locParts.push(`city=${encodeURIComponent(targetCity)}`);
    if (targetState) locParts.push(`stateCode=${encodeURIComponent(targetState)}`);
    if (countryCode) locParts.push(`countryCode=${encodeURIComponent(countryCode)}`);
    const locStr = locParts.length ? '&' + locParts.join('&') : '';

    if (keyword) {
      // ── Artist / keyword: GLOBAL multi-pass sweep ────────────────────────────
      // We intentionally drop the location filter here so that an artist search
      // like "Ariana Grande" returns every tour date worldwide, not just one city.
      // Location filtering is applied later on the DB query level if needed.

      const tmParams = resolveKeywordToTmParams(keyword);
      const paramStr = Object.entries(tmParams)
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join('&');

      // ── Step 1: Resolve artist → TM attractionId for exhaustive coverage ────
      // Using attractionId guarantees we get EVERY event TM has for this artist,
      // not just events that happen to match the keyword string.
      let attractionId: string | null = null;
      try {
        const attrUrl = `https://app.ticketmaster.com/discovery/v2/attractions.json`
                      + `?apikey=${apiKey}&keyword=${encodeURIComponent(keyword)}&size=1`;
        const attrRes  = await fetch(attrUrl, { signal: AbortSignal.timeout(5000) });
        if (attrRes.ok) {
          const attrData = await attrRes.json();
          attractionId   = attrData._embedded?.attractions?.[0]?.id ?? null;
        }
      } catch { /* non-fatal */ }

      if (attractionId) {
        // Attraction-scoped: every event, every city, paginated
        passes.push(`${BASE}&attractionId=${attractionId}&size=200&sort=date,asc&page=0`);
        passes.push(`${BASE}&attractionId=${attractionId}&size=200&sort=date,asc&page=1`);
        passes.push(`${BASE}&attractionId=${attractionId}&size=200&sort=date,asc&page=2`);
      }

      // ── Step 2: Broad keyword passes (global, no location) ──────────────────
      passes.push(`${BASE}&${paramStr}&size=200&sort=date,asc&page=0`);
      passes.push(`${BASE}&${paramStr}&size=200&sort=date,asc&page=1`);
      passes.push(`${BASE}&${paramStr}&size=200&sort=relevance,desc`);

      // ── Step 3: Companion event types ──────────────────────────────────────
      // Meet & greets, VIP packages, signings and fan events often live under
      // slightly different keyword strings in TM — sweep them all.
      const variants = [
        `${keyword} meet greet`,
        `${keyword} meet and greet`,
        `${keyword} VIP`,
        `${keyword} VIP package`,
        `${keyword} signing`,
        `${keyword} fan meet`,
        `${keyword} tour`,
        `${keyword} world tour`,
        `${keyword} concert`,
      ];
      for (const v of variants) {
        passes.push(`${BASE}&keyword=${encodeURIComponent(v)}&size=50&sort=date,asc`);
      }

      // ── Step 4: Location-scoped pass if caller supplied a city/country ──────
      // This is additive — the global passes above already cover these, but a
      // location pass surfaces results TM's global ranking might bury.
      if (locStr) {
        passes.push(`${BASE}&${paramStr}${locStr}&size=100&sort=date,asc`);
        if (attractionId) {
          passes.push(`${BASE}&attractionId=${attractionId}${locStr}&size=100&sort=date,asc`);
        }
      }
    } else if (category && category !== 'All') {
      const catParams = categoryToTmParams(category);
      const paramStr  = Object.entries(catParams)
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join('&');
      // Pass 1: category + location
      passes.push(`${BASE}&${paramStr}${locStr}&size=100&sort=date,asc`);
      // Pass 2: same but relevance-sorted
      passes.push(`${BASE}&${paramStr}${locStr}&size=100&sort=relevance,desc`);
    } else if (targetCity || targetState || countryCode) {
      // Location-only queries: pull ALL segment types
      const segments = ['music', 'sports', 'arts', 'family', 'misc'];
      for (const seg of segments) {
        passes.push(`${BASE}&segmentId=${TM_SEGMENTS[seg]}${locStr}&size=50&sort=date,asc`);
      }
      // Plus a bare location pass for anything un-segmented
      passes.push(`${BASE}${locStr}&size=100&sort=date,asc`);
    } else {
      // Global / default: pull top events from every major segment
      const segments = ['music', 'sports', 'arts', 'family'];
      for (const seg of segments) {
        passes.push(`${BASE}&segmentId=${TM_SEGMENTS[seg]}&size=50&sort=relevance,desc`);
      }
      // Global trending
      passes.push(`${BASE}&size=100&sort=relevance,desc`);
    }

    // Collect all live events from all passes (deduplicated by TM event ID)
    const seenTmIds = new Set<string>();
    const allEvents: any[] = [];

    await Promise.allSettled(
      passes.map(async (url) => {
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
          if (!res.ok) return;
          const data       = await res.json();
          const liveEvents = (data._embedded?.events ?? []) as any[];
          for (const ev of liveEvents) {
            if (!seenTmIds.has(ev.id)) {
              seenTmIds.add(ev.id);
              allEvents.push(ev);
            }
          }
        } catch { /* individual pass failure is non-fatal */ }
      })
    );

    if (allEvents.length === 0) return;

    // ── Filter & deduplicate against DB ───────────────────────────────────────
    const candidateTitles = allEvents
      .filter(e => (e.dates?.status?.code as string)?.toLowerCase() !== 'cancelled')
      .map(e => (e.name as string)?.substring(0, 250) || 'Live Event');

    const alreadyInDb = new Set(
      (await prisma.event.findMany({
        where:  { title: { in: candidateTitles } },
        select: { title: true },
      })).map(e => e.title)
    );

    const botPool = await getBotPool();

    for (const extEvent of allEvents) {
      // Status guard
      const statusCode = (extEvent.dates?.status?.code as string)?.toLowerCase();
      if (statusCode === 'cancelled') continue;

      const title = (extEvent.name as string)?.substring(0, 250) || 'Live Event';
      if (alreadyInDb.has(title)) continue;

      // Use TM price when available; fall back to a sensible default by segment
      // (Many TM events — especially UK/EU and major artists — omit priceRanges entirely)
      const priceMin = extEvent.priceRanges?.[0]?.min;
      const priceSegment = extEvent.classifications?.[0]?.segment?.name?.toLowerCase() ?? '';
      const fallback = priceSegment.includes('sport') ? 65
                     : priceSegment.includes('music') ? 75
                     : priceSegment.includes('arts')  ? 45
                     : 50;
      const basePrice = priceMin != null ? Number(Number(priceMin).toFixed(2)) : fallback;
      const venue      = extEvent._embedded?.venues?.[0];
      const actualCity = venue?.city?.name  || targetCity || 'Global';
      const country    = venue?.country?.name || targetCountryName || 'Global';
      const venueName  = venue?.name          || 'TBA';

      // Best image: prefer 16:9 >= 1024px wide
      const imageUrl =
        extEvent.images?.find((img: any) => img.ratio === '16_9' && img.width >= 1024)?.url ||
        extEvent.images?.find((img: any) => img.ratio === '16_9')?.url ||
        extEvent.images?.[0]?.url ||
        'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?q=80&w=1000';

      const eventDateString = extEvent.dates?.start?.dateTime || extEvent.dates?.start?.localDate;
      const date = eventDateString
        ? new Date(eventDateString)
        : new Date(Date.now() + 86_400_000 * 7);

      // Category from TM classification
      const segment    = extEvent.classifications?.[0]?.segment?.name || 'Live Event';
      const genre      = extEvent.classifications?.[0]?.genre?.name;
      const subGenre   = extEvent.classifications?.[0]?.subGenre?.name;
      const catName    = genre && genre !== 'Undefined' ? genre : segment;

      // Attractions / Artists
      const attractions = extEvent._embedded?.attractions
        ?.map((a: any) => a.name).filter(Boolean) ?? [];
      const attractionStr = attractions.length ? attractions.join(', ') : null;

      const description = attractionStr
        ? `${catName} at ${venueName}${subGenre ? ' \u2022 ' + subGenre : ''} \u2022 Feat. ${attractionStr}`
        : `${catName} at ${venueName}${subGenre ? ' \u2022 ' + subGenre : ''}`;

      const newEvent = await prisma.event.create({
        data: {
          title,
          description,
          date,
          city:      actualCity,
          country:   country,
          basePrice,
          imageUrl,
          category:  catName,
          isFeatured: false,
        },
      });

      const numSellers   = Math.floor(Math.random() * 5) + 3;
      const assignedBots = [...botPool].sort(() => Math.random() - 0.5).slice(0, numSellers);

      await prisma.ticketBatch.createMany({
        data: assignedBots.map(botId => ({
          eventId:  newEvent.id,
          sellerId: botId,
          price:    parseFloat((basePrice * (1 + Math.random() * 0.3)).toFixed(2)),
          quantity: Math.floor(Math.random() * 4) + 1,
        })),
      });

      alreadyInDb.add(title);
    }
  } catch (err) {
    console.error('TM Sync error:', err instanceof Error ? err.message : err);
  }
  }
