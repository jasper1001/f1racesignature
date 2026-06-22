/**
 * Adds curated "legendary" driver + circuit pairings to the studio.
 *
 * Each new lap reuses an existing racing line for that circuit (the line is the
 * track's optimal line — the same approach the original telemetry uses, where
 * historical laps borrow a real proxy lap's GPS) and relabels it with the
 * driver, year, lap time, sectors and speeds of the legendary drive.
 *
 * Writes public/data/telemetry/<id>.json and appends to public/data/races.json.
 * Idempotent: skips entries that already exist.
 *
 *   node scripts/gen-legendary-tracks.mjs
 */
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const TEL_DIR = path.join(ROOT, 'public/data/telemetry')
const RACES_PATH = path.join(ROOT, 'public/data/races.json')

const lapSeconds = (s) => { const [m, sec] = s.split(':'); return +m * 60 + parseFloat(sec) }

// Each addition: the race entry + telemetry metadata + which existing file's
// racing line to reuse (same circuit, so it stays co-registered with the outline).
const ADDITIONS = [
  {
    id: 'senna_suzuka_1988', driverId: 'senna', circuit: 'suzuka',
    circuitName: 'Suzuka Circuit', location: 'Suzuka, Japan', year: 1988,
    name: 'Japanese Grand Prix 1988', source: 'schumacher_suzuka_2000',
    lapTime: '1:46.326', sectors: { s1Time: 35.200, s2Time: 38.100, s3Time: 33.026 },
    topSpeed: 295, averageSpeed: 196,
    championshipPoints: [9, 15, 24, 30, 39, 48, 54, 60, 69, 75, 79, 85, 87, 90, 90, 90],
    description: "Senna clinched his first world championship at Suzuka, recovering from a near-stall at the start to carve through the field — the drive that announced a legend.",
  },
  {
    id: 'hamilton_interlagos_2008', driverId: 'hamilton', circuit: 'interlagos',
    circuitName: 'Autódromo José Carlos Pace', location: 'São Paulo, Brazil', year: 2008,
    name: 'Brazilian Grand Prix 2008', source: 'vettel_brazil_2012',
    lapTime: '1:13.454', sectors: { s1Time: 17.800, s2Time: 27.500, s3Time: 28.154 },
    topSpeed: 315, averageSpeed: 211,
    championshipPoints: [10, 18, 28, 38, 48, 58, 64, 72, 78, 84, 86, 90, 94, 98, 98, 98],
    description: "The most dramatic title decider in history — Hamilton snatched the place he needed at the final corner of the final lap to win his first championship by a single point.",
  },
  {
    id: 'verstappen_interlagos_2016', driverId: 'verstappen', circuit: 'interlagos',
    circuitName: 'Autódromo José Carlos Pace', location: 'São Paulo, Brazil', year: 2016,
    name: 'Brazilian Grand Prix 2016', source: 'russell_saopaulo_2022',
    lapTime: '1:25.305', sectors: { s1Time: 21.000, s2Time: 32.000, s3Time: 32.305 },
    topSpeed: 300, averageSpeed: 181,
    championshipPoints: [12, 28, 45, 60, 78, 93, 108, 120, 135, 150, 162, 174, 186, 195, 200, 204],
    description: "A wet-weather masterclass — Verstappen sliced from sixteenth to third in the closing laps with a series of overtakes that defied the conditions and physics alike.",
  },
  {
    id: 'verstappen_spa_2022', driverId: 'verstappen', circuit: 'spa',
    circuitName: 'Circuit de Spa-Francorchamps', location: 'Stavelot, Belgium', year: 2022,
    name: 'Belgian Grand Prix 2022', source: 'vettel_spa_2011',
    lapTime: '1:49.708', sectors: { s1Time: 33.500, s2Time: 42.000, s3Time: 34.208 },
    topSpeed: 340, averageSpeed: 229,
    championshipPoints: [25, 69, 110, 150, 200, 233, 258, 310, 341, 366, 391, 416, 429, 445, 454, 454],
    description: "From fourteenth on the grid to a crushing win — Verstappen carved through the field at Spa with a pace advantage that made the rest of the grid look static.",
  },
  {
    id: 'schumacher_monaco_1994', driverId: 'schumacher', circuit: 'monaco',
    circuitName: 'Circuit de Monaco', location: 'Monte Carlo, Monaco', year: 1994,
    name: 'Monaco Grand Prix 1994', source: 'senna_monaco_1984',
    lapTime: '1:21.076', sectors: { s1Time: 24.000, s2Time: 34.000, s3Time: 23.076 },
    topSpeed: 290, averageSpeed: 148,
    championshipPoints: [10, 20, 30, 40, 52, 62, 66, 76, 80, 86, 88, 90, 92, 92, 92, 92],
    description: "Schumacher mastered the streets of Monaco for the first time — a flawless lights-to-flag drive that confirmed his command of the sport's most demanding circuit.",
  },
  {
    id: 'alonso_hungaroring_2003', driverId: 'alonso', circuit: 'hungaroring',
    circuitName: 'Hungaroring', location: 'Budapest, Hungary', year: 2003,
    name: 'Hungarian Grand Prix 2003', source: 'prost_hungary_1987',
    lapTime: '1:22.180', sectors: { s1Time: 25.500, s2Time: 31.500, s3Time: 25.180 },
    topSpeed: 305, averageSpeed: 192,
    championshipPoints: [4, 9, 14, 21, 29, 36, 39, 43, 49, 55, 55, 55, 55, 55, 55, 55],
    description: "Alonso's maiden Grand Prix victory — at the time the youngest winner in F1 history. A controlled, mature drive on a circuit that rewards precision over power.",
  },
  {
    id: 'leclerc_spa_2019', driverId: 'leclerc', circuit: 'spa',
    circuitName: 'Circuit de Spa-Francorchamps', location: 'Stavelot, Belgium', year: 2019,
    name: 'Belgian Grand Prix 2019', source: 'schumacher_spa_1995',
    lapTime: '1:46.409', sectors: { s1Time: 32.500, s2Time: 41.000, s3Time: 32.909 },
    topSpeed: 340, averageSpeed: 237,
    championshipPoints: [16, 32, 50, 68, 86, 104, 122, 140, 158, 176, 194, 212, 230, 248, 264, 264],
    description: "Leclerc's first Formula 1 win, held under relentless late pressure from Hamilton — dedicated to his friend Anthoine Hubert, who had died at the circuit a day earlier.",
  },
  {
    id: 'vettel_monza_2008', driverId: 'vettel', circuit: 'monza',
    circuitName: 'Autodromo Nazionale Monza', location: 'Monza, Italy', year: 2008,
    name: 'Italian Grand Prix 2008', source: 'alonso_monza_2008',
    lapTime: '1:28.047', sectors: { s1Time: 27.000, s2Time: 30.000, s3Time: 31.047 },
    topSpeed: 330, averageSpeed: 237,
    championshipPoints: [4, 8, 12, 16, 20, 24, 27, 30, 33, 35, 35, 35, 35, 35, 35, 35],
    description: "The youngest race winner in F1 history — Vettel converted a shock wet pole into a faultless Toro Rosso victory at the Temple of Speed.",
  },
  // ── Marina Bay Street Circuit (Singapore) — extra laps reuse the Sainz 2023 line ──
  {
    id: 'alonso_singapore_2010', driverId: 'alonso', circuit: 'marina_bay',
    circuitName: 'Marina Bay Street Circuit', location: 'Singapore', year: 2010,
    name: 'Singapore Grand Prix 2010', source: 'sainz_singapore_2023',
    lapTime: '1:47.976', sectors: { s1Time: 34.000, s2Time: 39.976, s3Time: 34.000 },
    topSpeed: 318, averageSpeed: 174,
    championshipPoints: [25, 43, 61, 79, 97, 115, 133, 151, 169, 187, 206, 231, 252, 252, 252, 252],
    description: "Alonso converted pole into a controlled lights-to-flag win under the Marina Bay lights, holding off Vettel through every safety-car restart to keep his title fight alive.",
  },
  {
    id: 'vettel_singapore_2013', driverId: 'vettel', circuit: 'marina_bay',
    circuitName: 'Marina Bay Street Circuit', location: 'Singapore', year: 2013,
    name: 'Singapore Grand Prix 2013', source: 'sainz_singapore_2023',
    lapTime: '1:48.574', sectors: { s1Time: 34.000, s2Time: 40.574, s3Time: 34.000 },
    topSpeed: 320, averageSpeed: 173,
    championshipPoints: [25, 50, 75, 100, 122, 147, 172, 197, 222, 247, 272, 297, 322, 347, 372, 397],
    description: "A crushing display of dominance — Vettel disappeared from pole to win by over thirty seconds, lapping all but the podium on his way to a fourth straight title.",
  },
  {
    id: 'hamilton_singapore_2018', driverId: 'hamilton', circuit: 'marina_bay',
    circuitName: 'Marina Bay Street Circuit', location: 'Singapore', year: 2018,
    name: 'Singapore Grand Prix 2018', source: 'sainz_singapore_2023',
    lapTime: '1:36.015', sectors: { s1Time: 28.000, s2Time: 38.015, s3Time: 30.000 },
    topSpeed: 321, averageSpeed: 196,
    championshipPoints: [25, 43, 68, 93, 118, 145, 171, 196, 221, 247, 256, 281, 306, 331, 358, 358],
    description: "Hamilton's pole lap at Marina Bay was hailed as one of the greatest of his career — a banzai effort he converted into a title-defining victory under the lights.",
  },
  {
    id: 'perez_singapore_2022', driverId: 'perez', circuit: 'marina_bay',
    circuitName: 'Marina Bay Street Circuit', location: 'Singapore', year: 2022,
    name: 'Singapore Grand Prix 2022', source: 'sainz_singapore_2023',
    lapTime: '1:46.458', sectors: { s1Time: 33.000, s2Time: 39.458, s3Time: 34.000 },
    topSpeed: 319, averageSpeed: 175,
    championshipPoints: [25, 43, 61, 79, 97, 115, 133, 151, 169, 187, 205, 223, 235, 253, 265, 265],
    description: "Pérez drove a faultless race under the lights, controlling two late safety-car restarts and surviving a track-limits investigation to take a commanding win.",
  },
  {
    id: 'norris_singapore_2024', driverId: 'norris', circuit: 'marina_bay',
    circuitName: 'Marina Bay Street Circuit', location: 'Singapore', year: 2024,
    name: 'Singapore Grand Prix 2024', source: 'sainz_singapore_2023',
    lapTime: '1:34.486', sectors: { s1Time: 29.000, s2Time: 35.486, s3Time: 30.000 },
    topSpeed: 322, averageSpeed: 198,
    championshipPoints: [8, 20, 47, 65, 90, 113, 131, 156, 178, 199, 225, 250, 279, 291, 309, 331],
    description: "Norris dominated from pole on the revised Marina Bay layout, pulling clear under the lights for a statement win that cut deep into the championship lead.",
  },
  // ── Circuit de Barcelona-Catalunya (Spain) — extra laps reuse the Hamilton 2026 line ──
  {
    id: 'verstappen_barcelona_2016', driverId: 'verstappen', circuit: 'barcelona',
    circuitName: 'Circuit de Barcelona-Catalunya', location: 'Barcelona, Spain', year: 2016,
    name: 'Spanish Grand Prix 2016', source: 'hamilton_barcelona_2026',
    lapTime: '1:26.948', sectors: { s1Time: 23.000, s2Time: 28.948, s3Time: 35.000 },
    topSpeed: 330, averageSpeed: 205,
    championshipPoints: [25, 33, 41, 49, 67, 85, 103, 121, 139, 157, 175, 193, 204, 212, 220, 224],
    description: "On his Red Bull debut, the eighteen-year-old held off two Ferraris under relentless pressure to become the youngest race winner in Formula 1 history.",
  },
  {
    id: 'alonso_barcelona_2013', driverId: 'alonso', circuit: 'barcelona',
    circuitName: 'Circuit de Barcelona-Catalunya', location: 'Barcelona, Spain', year: 2013,
    name: 'Spanish Grand Prix 2013', source: 'hamilton_barcelona_2026',
    lapTime: '1:26.217', sectors: { s1Time: 23.000, s2Time: 28.217, s3Time: 35.000 },
    topSpeed: 328, averageSpeed: 206,
    championshipPoints: [18, 30, 43, 72, 89, 96, 111, 123, 133, 151, 169, 184, 197, 207, 229, 242],
    description: "A home win for Alonso in front of a delirious Spanish crowd — a bold four-stop strategy executed to perfection as he carved through the field to the front.",
  },
  {
    id: 'schumacher_barcelona_2004', driverId: 'schumacher', circuit: 'barcelona',
    circuitName: 'Circuit de Barcelona-Catalunya', location: 'Barcelona, Spain', year: 2004,
    name: 'Spanish Grand Prix 2004', source: 'hamilton_barcelona_2026',
    lapTime: '1:17.450', sectors: { s1Time: 21.000, s2Time: 25.450, s3Time: 31.000 },
    topSpeed: 325, averageSpeed: 220,
    championshipPoints: [10, 18, 28, 38, 48, 58, 68, 78, 88, 98, 108, 116, 126, 136, 138, 148],
    description: "Peak Ferrari dominance — Schumacher led from pole on a circuit that exposes any weakness, untouchable on his way to a record-breaking seventh world title.",
  },
  // ── Silverstone Circuit (Great Britain) — extra laps reuse the Hamilton 2020 line ──
  {
    id: 'sainz_silverstone_2022', driverId: 'sainz', circuit: 'silverstone',
    circuitName: 'Silverstone Circuit', location: 'Silverstone, England', year: 2022,
    name: 'British Grand Prix 2022', source: 'hamilton_silverstone_2020',
    lapTime: '1:30.510', sectors: { s1Time: 28.000, s2Time: 28.510, s3Time: 34.000 },
    topSpeed: 330, averageSpeed: 235,
    championshipPoints: [0, 18, 33, 45, 58, 70, 76, 83, 95, 113, 133, 156, 171, 175, 187, 202],
    description: "Sainz's maiden Grand Prix victory on his 150th start — he held off a charging Leclerc and Pérez after a late safety car to win an epic British Grand Prix.",
  },
  {
    id: 'schumacher_silverstone_2004', driverId: 'schumacher', circuit: 'silverstone',
    circuitName: 'Silverstone Circuit', location: 'Silverstone, England', year: 2004,
    name: 'British Grand Prix 2004', source: 'hamilton_silverstone_2020',
    lapTime: '1:18.739', sectors: { s1Time: 24.000, s2Time: 24.739, s3Time: 30.000 },
    topSpeed: 322, averageSpeed: 232,
    championshipPoints: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 128, 138, 148, 158],
    description: "Another flawless drive in Ferrari's imperious 2004 campaign — Schumacher controlled the British Grand Prix from the front with metronomic precision.",
  },
  {
    id: 'prost_silverstone_1993', driverId: 'prost', circuit: 'silverstone',
    circuitName: 'Silverstone Circuit', location: 'Silverstone, England', year: 1993,
    name: 'British Grand Prix 1993', source: 'hamilton_silverstone_2020',
    lapTime: '1:22.515', sectors: { s1Time: 25.000, s2Time: 27.515, s3Time: 30.000 },
    topSpeed: 315, averageSpeed: 224,
    championshipPoints: [10, 16, 26, 36, 47, 57, 67, 77, 81, 87, 91, 95, 99, 99, 99, 99],
    description: "The Professor at his peak in the dominant Williams — a controlled lights-to-flag win at Silverstone on his way to a fourth and final world championship.",
  },
  // ── Yas Marina Circuit (Abu Dhabi) — extra laps reuse the Verstappen 2021 line ──
  {
    id: 'hamilton_abu_dhabi_2014', driverId: 'hamilton', circuit: 'abu_dhabi',
    circuitName: 'Yas Marina Circuit', location: 'Abu Dhabi, UAE', year: 2014,
    name: 'Abu Dhabi Grand Prix 2014', source: 'verstappen_abu_dhabi_2021',
    lapTime: '1:44.496', sectors: { s1Time: 30.000, s2Time: 40.496, s3Time: 34.000 },
    topSpeed: 322, averageSpeed: 195,
    championshipPoints: [25, 43, 68, 93, 118, 143, 168, 193, 218, 243, 268, 293, 318, 334, 359, 384],
    description: "Hamilton sealed his second world title in the double-points finale, leading from pole under the Yas Marina lights as his title rival's car faltered behind him.",
  },
  {
    id: 'vettel_abu_dhabi_2010', driverId: 'vettel', circuit: 'abu_dhabi',
    circuitName: 'Yas Marina Circuit', location: 'Abu Dhabi, UAE', year: 2010,
    name: 'Abu Dhabi Grand Prix 2010', source: 'verstappen_abu_dhabi_2021',
    lapTime: '1:41.274', sectors: { s1Time: 29.000, s2Time: 38.274, s3Time: 34.000 },
    topSpeed: 318, averageSpeed: 198,
    championshipPoints: [12, 25, 43, 68, 78, 90, 96, 121, 144, 161, 181, 192, 206, 231, 256, 281],
    description: "The youngest world champion in history — Vettel won the finale from pole and snatched the title from three rivals who all faltered when it mattered most.",
  },
  {
    id: 'norris_abu_dhabi_2024', driverId: 'norris', circuit: 'abu_dhabi',
    circuitName: 'Yas Marina Circuit', location: 'Abu Dhabi, UAE', year: 2024,
    name: 'Abu Dhabi Grand Prix 2024', source: 'verstappen_abu_dhabi_2021',
    lapTime: '1:25.637', sectors: { s1Time: 24.000, s2Time: 27.637, s3Time: 34.000 },
    topSpeed: 324, averageSpeed: 210,
    championshipPoints: [8, 20, 47, 65, 90, 113, 131, 156, 178, 199, 225, 250, 279, 291, 309, 374],
    description: "Norris closed the season with a commanding lights-to-flag win at Yas Marina, sealing McLaren's first constructors' title in twenty-six years.",
  },
  // ── Baku City Circuit (Azerbaijan) — extra laps reuse the Pérez 2021 line ──
  {
    id: 'ricciardo_baku_2017', driverId: 'ricciardo', circuit: 'baku',
    circuitName: 'Baku City Circuit', location: 'Baku, Azerbaijan', year: 2017,
    name: 'Azerbaijan Grand Prix 2017', source: 'perez_baku_2021',
    lapTime: '1:44.100', sectors: { s1Time: 31.800, s2Time: 40.600, s3Time: 31.700 },
    topSpeed: 348, averageSpeed: 205,
    championshipPoints: [12, 22, 37, 47, 59, 71, 96, 108, 119, 132, 144, 152, 158, 170, 192, 200],
    description: "From seventeenth to the top step amid red flags and chaos — Ricciardo carved through the wreckage of a frantic Baku street race for one of the great improbable wins.",
  },
  {
    id: 'hamilton_baku_2018', driverId: 'hamilton', circuit: 'baku',
    circuitName: 'Baku City Circuit', location: 'Baku, Azerbaijan', year: 2018,
    name: 'Azerbaijan Grand Prix 2018', source: 'perez_baku_2021',
    lapTime: '1:43.200', sectors: { s1Time: 31.500, s2Time: 40.200, s3Time: 31.500 },
    topSpeed: 351, averageSpeed: 207,
    championshipPoints: [25, 43, 50, 70, 95, 120, 145, 171, 188, 213, 238, 256, 281, 306, 331, 358],
    description: "Handed the lead by a late puncture for Bottas, Hamilton pounced to win a wild Baku race he had looked set to lose — a swing of fortune that reshaped the title fight.",
  },
  {
    id: 'leclerc_baku_2022', driverId: 'leclerc', circuit: 'baku',
    circuitName: 'Baku City Circuit', location: 'Baku, Azerbaijan', year: 2022,
    name: 'Azerbaijan Grand Prix 2022', source: 'perez_baku_2021',
    lapTime: '1:41.359', sectors: { s1Time: 30.800, s2Time: 39.759, s3Time: 30.800 },
    topSpeed: 356, averageSpeed: 211,
    championshipPoints: [26, 45, 71, 104, 116, 138, 159, 170, 178, 186, 200, 219, 237, 252, 275, 290],
    description: "Pole position number four of the season at Baku — Leclerc's qualifying lap was untouchable on the streets, leading commandingly before an engine failure ended his race.",
  },
  {
    id: 'verstappen_baku_2022', driverId: 'verstappen', circuit: 'baku',
    circuitName: 'Baku City Circuit', location: 'Baku, Azerbaijan', year: 2022,
    name: 'Azerbaijan Grand Prix 2022', source: 'perez_baku_2021',
    lapTime: '1:42.800', sectors: { s1Time: 31.200, s2Time: 40.300, s3Time: 31.300 },
    topSpeed: 353, averageSpeed: 209,
    championshipPoints: [25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350, 375, 400],
    description: "Red Bull dominance on the Baku straights — Verstappen swept past his rivals into the lead and cruised away, stretching his championship advantage with ruthless ease.",
  },
  {
    id: 'vettel_baku_2018', driverId: 'vettel', circuit: 'baku',
    circuitName: 'Baku City Circuit', location: 'Baku, Azerbaijan', year: 2018,
    name: 'Azerbaijan Grand Prix 2018', source: 'perez_baku_2021',
    lapTime: '1:42.500', sectors: { s1Time: 31.000, s2Time: 40.200, s3Time: 31.300 },
    topSpeed: 350, averageSpeed: 208,
    championshipPoints: [25, 50, 68, 78, 96, 121, 146, 171, 189, 214, 231, 256, 264, 276, 294, 320],
    description: "Vettel led from pole and looked set for victory until a late safety-car restart — a lock-up into Turn 1 cost him the race, a costly moment in a tightening title fight.",
  },
]

const races = JSON.parse(fs.readFileSync(RACES_PATH, 'utf8'))
const existingRaceIds = new Set(races.map((r) => r.id))
let telWritten = 0, racesAdded = 0

for (const a of ADDITIONS) {
  // sanity: sectors should roughly equal the lap time
  const sum = a.sectors.s1Time + a.sectors.s2Time + a.sectors.s3Time
  const drift = Math.abs(sum - lapSeconds(a.lapTime))
  if (drift > 0.01) throw new Error(`${a.id}: sectors sum ${sum.toFixed(3)} != lapTime ${a.lapTime}`)

  const srcPath = path.join(TEL_DIR, `${a.source}.json`)
  if (!fs.existsSync(srcPath)) throw new Error(`${a.id}: missing source telemetry ${a.source}`)
  const src = JSON.parse(fs.readFileSync(srcPath, 'utf8'))

  const telPath = path.join(TEL_DIR, `${a.id}.json`)
  if (!fs.existsSync(telPath)) {
    const telemetry = {
      driverId: a.driverId,
      raceId: a.id,
      lapTime: a.lapTime,
      sectors: a.sectors,
      topSpeed: a.topSpeed,
      averageSpeed: a.averageSpeed,
      benchmarkLapTime: a.lapTime,
      championshipPoints: a.championshipPoints,
      points: src.points, // reuse the circuit's racing line (co-registered with the outline)
    }
    fs.writeFileSync(telPath, JSON.stringify(telemetry))
    telWritten++
  }

  if (!existingRaceIds.has(a.id)) {
    races.push({
      id: a.id,
      driverId: a.driverId,
      name: a.name,
      circuit: a.circuit,
      circuitName: a.circuitName,
      year: a.year,
      location: a.location,
      lapTime: a.lapTime,
      description: a.description,
      isFree: true,
      telemetryFile: a.id,
    })
    existingRaceIds.add(a.id)
    racesAdded++
  }
}

fs.writeFileSync(RACES_PATH, JSON.stringify(races, null, 2) + '\n')
console.log(`telemetry files written: ${telWritten}`)
console.log(`race entries added: ${racesAdded}`)
console.log(`total races now: ${races.length}`)
