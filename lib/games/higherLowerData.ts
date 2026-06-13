export interface HLDriver {
  id: string
  name: string
  wins: number
  poles: number
  podiums: number
  fastestLaps: number
  championships: number
  raceStarts: number
  fact: string
}

export type HLStat = 'wins' | 'poles' | 'podiums' | 'fastestLaps' | 'championships' | 'raceStarts'

export const HL_STATS: HLStat[] = ['wins', 'poles', 'podiums', 'fastestLaps', 'championships', 'raceStarts']

export const STAT_CONFIG: Record<HLStat, string> = {
  wins:          'Career Wins',
  poles:         'Pole Positions',
  podiums:       'Podiums',
  fastestLaps:   'Fastest Laps',
  championships: 'World Championships',
  raceStarts:    'Race Starts',
}

export const HL_DRIVERS: HLDriver[] = [
  {
    id: 'lewis-hamilton',
    name: 'Lewis Hamilton',
    wins: 104, poles: 104, podiums: 197, fastestLaps: 67, championships: 7, raceStarts: 332,
    fact: 'The only driver ever to reach 100 wins and 100 pole positions — both records he holds outright.',
  },
  {
    id: 'max-verstappen',
    name: 'Max Verstappen',
    wins: 63, poles: 40, podiums: 110, fastestLaps: 31, championships: 4, raceStarts: 209,
    fact: 'In 2023 he won 19 of 22 races — the most dominant single season in F1 history.',
  },
  {
    id: 'michael-schumacher',
    name: 'Michael Schumacher',
    wins: 91, poles: 68, podiums: 155, fastestLaps: 77, championships: 7, raceStarts: 308,
    fact: 'Held the wins record for 14 years until Hamilton surpassed him at the 2020 Portuguese GP.',
  },
  {
    id: 'ayrton-senna',
    name: 'Ayrton Senna',
    wins: 41, poles: 65, podiums: 80, fastestLaps: 19, championships: 3, raceStarts: 161,
    fact: 'His pole position strike rate of 40% remains the highest of any driver with more than 50 starts.',
  },
  {
    id: 'alain-prost',
    name: 'Alain Prost',
    wins: 51, poles: 33, podiums: 106, fastestLaps: 41, championships: 4, raceStarts: 199,
    fact: 'Known as "The Professor" for his calculating style — he retired 16 times from the lead to save the car.',
  },
  {
    id: 'sebastian-vettel',
    name: 'Sebastian Vettel',
    wins: 53, poles: 57, podiums: 122, fastestLaps: 38, championships: 4, raceStarts: 299,
    fact: 'Won four consecutive titles from 2010–2013, each time finishing with the most poles of any champion that year.',
  },
  {
    id: 'fernando-alonso',
    name: 'Fernando Alonso',
    wins: 32, poles: 22, podiums: 106, fastestLaps: 26, championships: 2, raceStarts: 399,
    fact: 'Still racing at 43 in 2024, Fernando became the most experienced active driver in F1 history.',
  },
  {
    id: 'kimi-raikkonen',
    name: 'Kimi Räikkönen',
    wins: 21, poles: 18, podiums: 103, fastestLaps: 46, championships: 1, raceStarts: 349,
    fact: 'Holds the all-time record for most F1 race starts, finishing his career with 349 grands prix.',
  },
  {
    id: 'nigel-mansell',
    name: 'Nigel Mansell',
    wins: 31, poles: 32, podiums: 59, fastestLaps: 30, championships: 1, raceStarts: 191,
    fact: 'Won both the F1 championship (1992) and the IndyCar title (1993) in consecutive seasons.',
  },
  {
    id: 'niki-lauda',
    name: 'Niki Lauda',
    wins: 25, poles: 24, podiums: 54, fastestLaps: 25, championships: 2, raceStarts: 171,
    fact: 'Survived a fiery crash at the Nürburgring in 1976, returning to race just six weeks later.',
  },
  {
    id: 'nelson-piquet',
    name: 'Nelson Piquet',
    wins: 23, poles: 24, podiums: 60, fastestLaps: 23, championships: 3, raceStarts: 204,
    fact: 'Three-time champion known for his fierce rivalry with Nigel Mansell at Williams in the late 1980s.',
  },
  {
    id: 'mika-hakkinen',
    name: 'Mika Häkkinen',
    wins: 20, poles: 26, podiums: 51, fastestLaps: 25, championships: 2, raceStarts: 165,
    fact: 'The "Flying Finn" who beat Schumacher to back-to-back titles in 1998 and 1999 with McLaren.',
  },
  {
    id: 'damon-hill',
    name: 'Damon Hill',
    wins: 22, poles: 20, podiums: 42, fastestLaps: 19, championships: 1, raceStarts: 122,
    fact: 'Son of double champion Graham Hill, he clinched the 1996 title in the final race of the season.',
  },
  {
    id: 'jackie-stewart',
    name: 'Jackie Stewart',
    wins: 27, poles: 17, podiums: 43, fastestLaps: 15, championships: 3, raceStarts: 99,
    fact: 'Retired at just 34 at the height of his powers, campaigning for the safety reforms that transformed F1.',
  },
  {
    id: 'juan-manuel-fangio',
    name: 'Juan Manuel Fangio',
    wins: 24, poles: 29, podiums: 35, fastestLaps: 23, championships: 5, raceStarts: 51,
    fact: 'Won five championships across four different constructors — a feat still unmatched in F1 history.',
  },
  {
    id: 'jim-clark',
    name: 'Jim Clark',
    wins: 25, poles: 33, podiums: 32, fastestLaps: 28, championships: 2, raceStarts: 72,
    fact: 'Won 25 of his 72 races — a 35% win rate that no driver from any era has ever come close to matching.',
  },
  {
    id: 'nico-rosberg',
    name: 'Nico Rosberg',
    wins: 23, poles: 30, podiums: 57, fastestLaps: 20, championships: 1, raceStarts: 206,
    fact: 'Won the 2016 championship by five points then retired five days later — one of sport\'s great exits.',
  },
  {
    id: 'jenson-button',
    name: 'Jenson Button',
    wins: 15, poles: 8, podiums: 50, fastestLaps: 8, championships: 1, raceStarts: 306,
    fact: 'His 2009 championship with the underdog Brawn GP team is considered one of the great sporting fairytales.',
  },
  {
    id: 'valtteri-bottas',
    name: 'Valtteri Bottas',
    wins: 10, poles: 20, podiums: 67, fastestLaps: 19, championships: 0, raceStarts: 261,
    fact: 'Finished runner-up to Hamilton three times at Mercedes despite never winning a World Championship.',
  },
  {
    id: 'rubens-barrichello',
    name: 'Rubens Barrichello',
    wins: 11, poles: 14, podiums: 68, fastestLaps: 17, championships: 0, raceStarts: 326,
    fact: 'The longest F1 career of his era — held the starts record until Raikkonen overtook him in 2017.',
  },
  {
    id: 'mark-webber',
    name: 'Mark Webber',
    wins: 9, poles: 13, podiums: 42, fastestLaps: 19, championships: 0, raceStarts: 215,
    fact: 'Famous for his radio outburst "Not bad for a number two driver!" after winning at Silverstone in 2012.',
  },
  {
    id: 'david-coulthard',
    name: 'David Coulthard',
    wins: 13, poles: 12, podiums: 62, fastestLaps: 18, championships: 0, raceStarts: 246,
    fact: 'Won 13 races and 62 podiums across 15 seasons with McLaren and Red Bull.',
  },
  {
    id: 'felipe-massa',
    name: 'Felipe Massa',
    wins: 11, poles: 16, podiums: 41, fastestLaps: 15, championships: 0, raceStarts: 269,
    fact: 'Lost the 2008 championship to Lewis Hamilton by a single point on the very last corner of the season.',
  },
  {
    id: 'daniel-ricciardo',
    name: 'Daniel Ricciardo',
    wins: 8, poles: 3, podiums: 32, fastestLaps: 16, championships: 0, raceStarts: 243,
    fact: 'His overtake around the outside of Rosberg at Monaco in 2016 is one of the greatest passes ever seen.',
  },
  {
    id: 'sergio-perez',
    name: 'Sergio Pérez',
    wins: 6, poles: 3, podiums: 40, fastestLaps: 12, championships: 0, raceStarts: 281,
    fact: 'His Abu Dhabi defence of Hamilton in 2021 helped Verstappen win the championship on the final lap.',
  },
  {
    id: 'charles-leclerc',
    name: 'Charles Leclerc',
    wins: 8, poles: 24, podiums: 42, fastestLaps: 9, championships: 0, raceStarts: 146,
    fact: 'Took back-to-back wins at Spa and Monza in 2019 — his first two Ferrari victories in successive weekends.',
  },
  {
    id: 'carlos-sainz',
    name: 'Carlos Sainz',
    wins: 4, poles: 5, podiums: 28, fastestLaps: 4, championships: 0, raceStarts: 207,
    fact: 'The first Spaniard to win an F1 race since Fernando Alonso — a consistency machine across five teams.',
  },
  {
    id: 'lando-norris',
    name: 'Lando Norris',
    wins: 4, poles: 4, podiums: 31, fastestLaps: 6, championships: 0, raceStarts: 126,
    fact: 'Won his maiden race at Miami 2024 — a career-defining moment after years of near-misses.',
  },
  {
    id: 'george-russell',
    name: 'George Russell',
    wins: 2, poles: 3, podiums: 15, fastestLaps: 6, championships: 0, raceStarts: 126,
    fact: 'Won on his third race for Mercedes at Interlagos 2022 — the first win of his career.',
  },
  {
    id: 'oscar-piastri',
    name: 'Oscar Piastri',
    wins: 3, poles: 1, podiums: 14, fastestLaps: 3, championships: 0, raceStarts: 44,
    fact: 'Won his first F1 race in only his 11th grand prix — the fastest maiden win in McLaren\'s modern era.',
  },
  {
    id: 'ralf-schumacher',
    name: 'Ralf Schumacher',
    wins: 6, poles: 6, podiums: 27, fastestLaps: 8, championships: 0, raceStarts: 180,
    fact: 'Younger brother of Michael — all six of his wins came with Williams between 2001 and 2003.',
  },
  {
    id: 'giancarlo-fisichella',
    name: 'Giancarlo Fisichella',
    wins: 3, poles: 4, podiums: 19, fastestLaps: 6, championships: 0, raceStarts: 229,
    fact: 'Won a chaotic 2003 Brazilian GP in circumstances so confused that Jordan initially didn\'t know who had won.',
  },
  {
    id: 'heinz-frentzen',
    name: 'Heinz-Harald Frentzen',
    wins: 3, poles: 2, podiums: 18, fastestLaps: 6, championships: 0, raceStarts: 157,
    fact: 'Was considered Schumacher\'s equal in German karting — he arrived in F1 before Michael did.',
  },
  {
    id: 'jacques-villeneuve',
    name: 'Jacques Villeneuve',
    wins: 11, poles: 13, podiums: 23, fastestLaps: 9, championships: 1, raceStarts: 163,
    fact: 'Son of the legendary Gilles — the only Canadian ever to win the Formula 1 World Championship.',
  },
  {
    id: 'eddie-irvine',
    name: 'Eddie Irvine',
    wins: 4, poles: 0, podiums: 26, fastestLaps: 7, championships: 0, raceStarts: 146,
    fact: 'Came within one race of the 1999 championship while standing in for the injured Michael Schumacher.',
  },
  {
    id: 'gerhard-berger',
    name: 'Gerhard Berger',
    wins: 10, poles: 12, podiums: 48, fastestLaps: 21, championships: 0, raceStarts: 210,
    fact: 'Long-time teammate of both Senna and Prost — one of the last great drivers never to win a championship.',
  },
  {
    id: 'jean-alesi',
    name: 'Jean Alesi',
    wins: 1, poles: 2, podiums: 32, fastestLaps: 4, championships: 0, raceStarts: 201,
    fact: 'Famous for 201 races and just one win — Canada 1995, on his birthday, driving the number 27 Ferrari.',
  },
  {
    id: 'riccardo-patrese',
    name: 'Riccardo Patrese',
    wins: 6, poles: 8, podiums: 37, fastestLaps: 13, championships: 0, raceStarts: 256,
    fact: 'Held the record for most F1 starts (256) for over a decade before Barrichello finally overtook him.',
  },
  {
    id: 'emerson-fittipaldi',
    name: 'Emerson Fittipaldi',
    wins: 14, poles: 6, podiums: 35, fastestLaps: 6, championships: 2, raceStarts: 144,
    fact: 'The youngest F1 champion at the time — he was just 25 years old when he won his first title in 1972.',
  },
  {
    id: 'mario-andretti',
    name: 'Mario Andretti',
    wins: 12, poles: 18, podiums: 19, fastestLaps: 10, championships: 1, raceStarts: 128,
    fact: 'The 1978 world champion — still the last American to win the Formula 1 World Championship.',
  },
  {
    id: 'gilles-villeneuve',
    name: 'Gilles Villeneuve',
    wins: 6, poles: 2, podiums: 13, fastestLaps: 8, championships: 0, raceStarts: 67,
    fact: 'Father of Jacques — considered by many the most naturally gifted and electrifying driver of his era.',
  },
  {
    id: 'jody-scheckter',
    name: 'Jody Scheckter',
    wins: 10, poles: 3, podiums: 33, fastestLaps: 5, championships: 1, raceStarts: 112,
    fact: 'Won the 1979 championship with Ferrari — it would be 21 years before Ferrari claimed another title.',
  },
  {
    id: 'carlos-reutemann',
    name: 'Carlos Reutemann',
    wins: 12, poles: 6, podiums: 45, fastestLaps: 6, championships: 0, raceStarts: 146,
    fact: 'Argentine legend who controversially disobeyed Williams team orders to beat Jones at Long Beach 1981.',
  },
  {
    id: 'keke-rosberg',
    name: 'Keke Rosberg',
    wins: 5, poles: 5, podiums: 17, fastestLaps: 3, championships: 1, raceStarts: 114,
    fact: 'Father of Nico — won the 1982 championship with just five wins, the fewest of any champion.',
  },
  {
    id: 'rene-arnoux',
    name: 'René Arnoux',
    wins: 7, poles: 18, podiums: 22, fastestLaps: 12, championships: 0, raceStarts: 149,
    fact: 'His wheel-to-wheel battle with Villeneuve at Dijon 1979 remains the greatest dice in F1 history.',
  },
  {
    id: 'jarno-trulli',
    name: 'Jarno Trulli',
    wins: 1, poles: 4, podiums: 11, fastestLaps: 1, championships: 0, raceStarts: 252,
    fact: 'So often led races only to retire that F1 commentators coined the term "Trulli train" for slow processions.',
  },
  {
    id: 'nick-heidfeld',
    name: 'Nick Heidfeld',
    wins: 0, poles: 1, podiums: 13, fastestLaps: 1, championships: 0, raceStarts: 183,
    fact: 'Scored 13 podiums without a single race win — often cited as the unluckiest fast driver in F1 history.',
  },
  {
    id: 'robert-kubica',
    name: 'Robert Kubica',
    wins: 1, poles: 1, podiums: 12, fastestLaps: 1, championships: 0, raceStarts: 99,
    fact: 'A near-fatal rally crash in 2011 ended his prime F1 career just as he was being tipped for a title challenge.',
  },
  {
    id: 'heikki-kovalainen',
    name: 'Heikki Kovalainen',
    wins: 1, poles: 1, podiums: 4, fastestLaps: 2, championships: 0, raceStarts: 111,
    fact: 'Won his only F1 race at Hungary 2008 — standing in for the sick Lewis Hamilton who led the championship.',
  },
  {
    id: 'kamui-kobayashi',
    name: 'Kamui Kobayashi',
    wins: 0, poles: 0, podiums: 3, fastestLaps: 2, championships: 0, raceStarts: 75,
    fact: 'A Japanese fan favourite for his brave overtaking — his Monza 2012 qualifying lap left the crowd speechless.',
  },
  {
    id: 'esteban-ocon',
    name: 'Esteban Ocon',
    wins: 1, poles: 0, podiums: 3, fastestLaps: 1, championships: 0, raceStarts: 148,
    fact: 'Won a chaotic 2021 Hungarian GP after starting fifth — his maiden win came out of almost nowhere.',
  },
  {
    id: 'pierre-gasly',
    name: 'Pierre Gasly',
    wins: 1, poles: 0, podiums: 4, fastestLaps: 3, championships: 0, raceStarts: 144,
    fact: 'Won at Monza 2020 for AlphaTauri — one of the greatest shocks of the modern F1 era.',
  },
  {
    id: 'nico-hulkenberg',
    name: 'Nico Hülkenberg',
    wins: 0, poles: 1, podiums: 0, fastestLaps: 2, championships: 0, raceStarts: 223,
    fact: 'Holds the record for most F1 starts without a podium — 223 and still counting as of 2024.',
  },
  {
    id: 'kevin-magnussen',
    name: 'Kevin Magnussen',
    wins: 0, poles: 0, podiums: 1, fastestLaps: 2, championships: 0, raceStarts: 178,
    fact: 'Scored a podium on his F1 debut at Australia 2014 — one of only a handful to achieve that feat.',
  },
  {
    id: 'lance-stroll',
    name: 'Lance Stroll',
    wins: 0, poles: 1, podiums: 3, fastestLaps: 1, championships: 0, raceStarts: 167,
    fact: 'His shock pole position at Istanbul 2020 on a wet track was one of the biggest surprises of the season.',
  },
  {
    id: 'yuki-tsunoda',
    name: 'Yuki Tsunoda',
    wins: 0, poles: 0, podiums: 0, fastestLaps: 1, championships: 0, raceStarts: 88,
    fact: 'The first Japanese driver to race in F1 since Kamui Kobayashi — known for his explosive radio messages.',
  },
  {
    id: 'alex-albon',
    name: 'Alexander Albon',
    wins: 0, poles: 0, podiums: 2, fastestLaps: 0, championships: 0, raceStarts: 95,
    fact: 'Left Red Bull in 2021, returned with Williams in 2022 and became their most important driver in years.',
  },
  {
    id: 'timo-glock',
    name: 'Timo Glock',
    wins: 0, poles: 0, podiums: 3, fastestLaps: 1, championships: 0, raceStarts: 91,
    fact: 'His tyre choice in the final laps of Brazil 2008 gifted Lewis Hamilton the championship on the last corner.',
  },
  {
    id: 'pastor-maldonado',
    name: 'Pastor Maldonado',
    wins: 1, poles: 1, podiums: 1, fastestLaps: 0, championships: 0, raceStarts: 95,
    fact: 'Won at Spain 2012 — the only Formula 1 race victory by a Venezuelan driver in the sport\'s history.',
  },
  {
    id: 'vitaly-petrov',
    name: 'Vitaly Petrov',
    wins: 0, poles: 0, podiums: 1, fastestLaps: 0, championships: 0, raceStarts: 57,
    fact: 'The first Russian to score an F1 podium — Australia 2010 — and one of only two Russians to race in F1.',
  },
  {
    id: 'antonio-giovinazzi',
    name: 'Antonio Giovinazzi',
    wins: 0, poles: 0, podiums: 0, fastestLaps: 0, championships: 0, raceStarts: 62,
    fact: 'The last full-time Italian driver in F1 — raced for Alfa Romeo from 2019 to 2021.',
  },
  {
    id: 'mick-schumacher',
    name: 'Mick Schumacher',
    wins: 0, poles: 0, podiums: 0, fastestLaps: 0, championships: 0, raceStarts: 43,
    fact: 'Son of the legendary Michael — showed great promise at Haas but couldn\'t secure a seat beyond 2022.',
  },
]

export function pickRound(
  recentPairIds: Set<string>,
): { driverA: HLDriver; driverB: HLDriver; stat: HLStat } | null {
  const stat = HL_STATS[Math.floor(Math.random() * HL_STATS.length)]

  for (let attempt = 0; attempt < 100; attempt++) {
    const idxA = Math.floor(Math.random() * HL_DRIVERS.length)
    const idxB = Math.floor(Math.random() * HL_DRIVERS.length)
    if (idxA === idxB) continue

    const a = HL_DRIVERS[idxA]
    const b = HL_DRIVERS[idxB]
    if (a[stat] === b[stat]) continue

    const pairKey = [a.id, b.id].sort().join('|')
    if (recentPairIds.has(pairKey)) continue

    return { driverA: a, driverB: b, stat }
  }
  return null
}
