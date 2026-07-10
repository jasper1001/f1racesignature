// Curated, real per-circuit facts keyed by the Jolpica/Ergast `circuitId` that
// getSchedule() returns. The live API doesn't expose lap length, lap count,
// corner count or lap records, and public/data/circuits.json only carries a
// reliable lapLength for a subset — so these facts are maintained here.
//
// Lengths are cross-checked against circuits.json where both exist (e.g. Spa
// 7004 m, Silverstone 5891 m). Lap records are official F1 fastest-race-lap
// records; only circuits with a verified record carry one — the UI hides the
// row when it's absent rather than guessing.

export interface CircuitFacts {
  /** Lap length in metres. */
  lengthM: number
  /** Scheduled Grand Prix distance in laps. */
  laps: number
  /** Number of corners on the current layout. */
  corners: number
  /** Official race lap record, when known. */
  lapRecord?: { driver: string; time: string; year: number }
}

export const CIRCUIT_FACTS: Record<string, CircuitFacts> = {
  albert_park:   { lengthM: 5278, laps: 58, corners: 14, lapRecord: { driver: 'Charles Leclerc', time: '1:19.813', year: 2024 } },
  shanghai:      { lengthM: 5451, laps: 56, corners: 16, lapRecord: { driver: 'Michael Schumacher', time: '1:32.238', year: 2004 } },
  suzuka:        { lengthM: 5807, laps: 53, corners: 18, lapRecord: { driver: 'Lewis Hamilton', time: '1:30.983', year: 2019 } },
  bahrain:       { lengthM: 5412, laps: 57, corners: 15, lapRecord: { driver: 'Pedro de la Rosa', time: '1:31.447', year: 2005 } },
  jeddah:        { lengthM: 6174, laps: 50, corners: 27, lapRecord: { driver: 'Lewis Hamilton', time: '1:30.734', year: 2021 } },
  miami:         { lengthM: 5412, laps: 57, corners: 19, lapRecord: { driver: 'Max Verstappen', time: '1:29.708', year: 2023 } },
  imola:         { lengthM: 4909, laps: 63, corners: 19, lapRecord: { driver: 'Lewis Hamilton', time: '1:15.484', year: 2020 } },
  monaco:        { lengthM: 3337, laps: 78, corners: 19, lapRecord: { driver: 'Lewis Hamilton', time: '1:12.909', year: 2021 } },
  catalunya:     { lengthM: 4657, laps: 66, corners: 14, lapRecord: { driver: 'Max Verstappen', time: '1:16.330', year: 2023 } },
  villeneuve:    { lengthM: 4361, laps: 70, corners: 14, lapRecord: { driver: 'Valtteri Bottas', time: '1:13.078', year: 2019 } },
  red_bull_ring: { lengthM: 4318, laps: 71, corners: 10, lapRecord: { driver: 'Carlos Sainz', time: '1:05.619', year: 2020 } },
  silverstone:   { lengthM: 5891, laps: 52, corners: 18, lapRecord: { driver: 'Max Verstappen', time: '1:27.097', year: 2020 } },
  hungaroring:   { lengthM: 4381, laps: 70, corners: 14, lapRecord: { driver: 'Lewis Hamilton', time: '1:16.627', year: 2020 } },
  spa:           { lengthM: 7004, laps: 44, corners: 19, lapRecord: { driver: 'Valtteri Bottas', time: '1:46.286', year: 2018 } },
  zandvoort:     { lengthM: 4259, laps: 72, corners: 14, lapRecord: { driver: 'Lewis Hamilton', time: '1:11.097', year: 2021 } },
  monza:         { lengthM: 5793, laps: 53, corners: 11, lapRecord: { driver: 'Rubens Barrichello', time: '1:21.046', year: 2004 } },
  baku:          { lengthM: 6003, laps: 51, corners: 20, lapRecord: { driver: 'Charles Leclerc', time: '1:43.009', year: 2019 } },
  marina_bay:    { lengthM: 4940, laps: 62, corners: 19, lapRecord: { driver: 'Lewis Hamilton', time: '1:34.486', year: 2023 } },
  americas:      { lengthM: 5513, laps: 56, corners: 20, lapRecord: { driver: 'Charles Leclerc', time: '1:36.169', year: 2019 } },
  rodriguez:     { lengthM: 4304, laps: 71, corners: 17, lapRecord: { driver: 'Valtteri Bottas', time: '1:17.774', year: 2021 } },
  interlagos:    { lengthM: 4309, laps: 71, corners: 15, lapRecord: { driver: 'Valtteri Bottas', time: '1:10.540', year: 2018 } },
  vegas:         { lengthM: 6201, laps: 50, corners: 17, lapRecord: { driver: 'Oscar Piastri', time: '1:35.490', year: 2023 } },
  losail:        { lengthM: 5419, laps: 57, corners: 16, lapRecord: { driver: 'Max Verstappen', time: '1:24.319', year: 2021 } },
  yas_marina:    { lengthM: 5281, laps: 58, corners: 16, lapRecord: { driver: 'Max Verstappen', time: '1:26.103', year: 2021 } },
}

export function circuitFacts(circuitId: string): CircuitFacts | null {
  return CIRCUIT_FACTS[circuitId] ?? null
}

// Country name (as returned by the F1 API's Location.country) → flag emoji.
const COUNTRY_FLAGS: Record<string, string> = {
  Australia: '🇦🇺', China: '🇨🇳', Japan: '🇯🇵', Bahrain: '🇧🇭',
  'Saudi Arabia': '🇸🇦', USA: '🇺🇸', 'United States': '🇺🇸', 'United States of America': '🇺🇸',
  Monaco: '🇲🇨', Canada: '🇨🇦', Spain: '🇪🇸', Austria: '🇦🇹',
  UK: '🇬🇧', 'United Kingdom': '🇬🇧', 'Great Britain': '🇬🇧',
  Hungary: '🇭🇺', Belgium: '🇧🇪', Netherlands: '🇳🇱', Azerbaijan: '🇦🇿',
  Singapore: '🇸🇬', Italy: '🇮🇹', Mexico: '🇲🇽', Brazil: '🇧🇷',
  'United Arab Emirates': '🇦🇪', UAE: '🇦🇪', Qatar: '🇶🇦', France: '🇫🇷',
  Germany: '🇩🇪', Portugal: '🇵🇹', Turkey: '🇹🇷', Russia: '🇷🇺',
}

export function raceFlag(country: string): string {
  return COUNTRY_FLAGS[country] ?? '🏁'
}

// Country name (as returned by the F1 API's Location.country) → ISO alpha-2 code,
// used to load self-hosted SVG flags from /public/flags (emoji flags don't render
// on Windows, so images are used instead — see FlagIcon).
const COUNTRY_CODES: Record<string, string> = {
  Australia: 'au', China: 'cn', Japan: 'jp', Bahrain: 'bh',
  'Saudi Arabia': 'sa', USA: 'us', 'United States': 'us', 'United States of America': 'us',
  Monaco: 'mc', Canada: 'ca', Spain: 'es', Austria: 'at',
  UK: 'gb', 'United Kingdom': 'gb', 'Great Britain': 'gb',
  Hungary: 'hu', Belgium: 'be', Netherlands: 'nl', Azerbaijan: 'az',
  Singapore: 'sg', Italy: 'it', Mexico: 'mx', Brazil: 'br',
  'United Arab Emirates': 'ae', UAE: 'ae', Qatar: 'qa', France: 'fr',
  Germany: 'de', Portugal: 'pt', Turkey: 'tr', Russia: 'ru', Thailand: 'th',
}

export function countryCode(country: string): string | null {
  return COUNTRY_CODES[country] ?? null
}

// IANA timezone of each circuit, so session times can be shown in track-local
// time alongside the visitor's own timezone (the API carries no location tz).
const CIRCUIT_TZ: Record<string, string> = {
  albert_park: 'Australia/Melbourne', shanghai: 'Asia/Shanghai', suzuka: 'Asia/Tokyo',
  bahrain: 'Asia/Bahrain', jeddah: 'Asia/Riyadh', miami: 'America/New_York',
  imola: 'Europe/Rome', monaco: 'Europe/Monaco', catalunya: 'Europe/Madrid',
  villeneuve: 'America/Toronto', red_bull_ring: 'Europe/Vienna', silverstone: 'Europe/London',
  hungaroring: 'Europe/Budapest', spa: 'Europe/Brussels', zandvoort: 'Europe/Amsterdam',
  monza: 'Europe/Rome', baku: 'Asia/Baku', marina_bay: 'Asia/Singapore',
  americas: 'America/Chicago', rodriguez: 'America/Mexico_City', interlagos: 'America/Sao_Paulo',
  vegas: 'America/Los_Angeles', losail: 'Asia/Qatar', yas_marina: 'Asia/Dubai',
}

export function circuitTz(circuitId: string): string | null {
  return CIRCUIT_TZ[circuitId] ?? null
}
