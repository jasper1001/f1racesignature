// ISO 3166-1 alpha-2 country list for the optional leaderboard "country" field.
// Stored as the 2-letter code; flag emoji derived from it.

export interface Country { code: string; name: string }

export function flagEmoji(code: string): string {
  if (!code || code.length !== 2) return ''
  return code.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
}

export const COUNTRIES: Country[] = [
  { code: 'AR', name: 'Argentina' }, { code: 'AU', name: 'Australia' }, { code: 'AT', name: 'Austria' },
  { code: 'AZ', name: 'Azerbaijan' }, { code: 'BH', name: 'Bahrain' }, { code: 'BD', name: 'Bangladesh' },
  { code: 'BE', name: 'Belgium' }, { code: 'BR', name: 'Brazil' }, { code: 'BG', name: 'Bulgaria' },
  { code: 'CA', name: 'Canada' }, { code: 'CL', name: 'Chile' }, { code: 'CN', name: 'China' },
  { code: 'CO', name: 'Colombia' }, { code: 'HR', name: 'Croatia' }, { code: 'CZ', name: 'Czechia' },
  { code: 'DK', name: 'Denmark' }, { code: 'EG', name: 'Egypt' }, { code: 'EE', name: 'Estonia' },
  { code: 'FI', name: 'Finland' }, { code: 'FR', name: 'France' }, { code: 'DE', name: 'Germany' },
  { code: 'GR', name: 'Greece' }, { code: 'HK', name: 'Hong Kong' }, { code: 'HU', name: 'Hungary' },
  { code: 'IS', name: 'Iceland' }, { code: 'IN', name: 'India' }, { code: 'ID', name: 'Indonesia' },
  { code: 'IE', name: 'Ireland' }, { code: 'IL', name: 'Israel' }, { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' }, { code: 'KZ', name: 'Kazakhstan' }, { code: 'KE', name: 'Kenya' },
  { code: 'KW', name: 'Kuwait' }, { code: 'LV', name: 'Latvia' }, { code: 'LB', name: 'Lebanon' },
  { code: 'LT', name: 'Lithuania' }, { code: 'LU', name: 'Luxembourg' }, { code: 'MY', name: 'Malaysia' },
  { code: 'MT', name: 'Malta' }, { code: 'MX', name: 'Mexico' }, { code: 'MC', name: 'Monaco' },
  { code: 'MA', name: 'Morocco' }, { code: 'NL', name: 'Netherlands' }, { code: 'NZ', name: 'New Zealand' },
  { code: 'NG', name: 'Nigeria' }, { code: 'NO', name: 'Norway' }, { code: 'PK', name: 'Pakistan' },
  { code: 'PA', name: 'Panama' }, { code: 'PE', name: 'Peru' }, { code: 'PH', name: 'Philippines' },
  { code: 'PL', name: 'Poland' }, { code: 'PT', name: 'Portugal' }, { code: 'QA', name: 'Qatar' },
  { code: 'RO', name: 'Romania' }, { code: 'RU', name: 'Russia' }, { code: 'SA', name: 'Saudi Arabia' },
  { code: 'RS', name: 'Serbia' }, { code: 'SG', name: 'Singapore' }, { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' }, { code: 'ZA', name: 'South Africa' }, { code: 'KR', name: 'South Korea' },
  { code: 'ES', name: 'Spain' }, { code: 'SE', name: 'Sweden' }, { code: 'CH', name: 'Switzerland' },
  { code: 'TW', name: 'Taiwan' }, { code: 'TH', name: 'Thailand' }, { code: 'TR', name: 'Türkiye' },
  { code: 'UA', name: 'Ukraine' }, { code: 'AE', name: 'United Arab Emirates' }, { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' }, { code: 'UY', name: 'Uruguay' }, { code: 'VE', name: 'Venezuela' },
  { code: 'VN', name: 'Vietnam' },
]

export const countryName = (code?: string | null) =>
  code ? COUNTRIES.find((c) => c.code === code)?.name ?? code : ''
