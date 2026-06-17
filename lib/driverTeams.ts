// Career team history for the profile-page transfer diagram. Generated from
// real Jolpica/Ergast season-by-season data via scripts/gen_driver_teams.py.
// `endYear: null` means the driver is still with that team.

export interface TeamStint {
  team: string
  startYear: number
  endYear: number | null
  color: string
}

const TEAM_TRANSFERS: Record<string, TeamStint[]> = {
  hamilton: [
    { team: "McLaren", startYear: 2007, endYear: 2012, color: "#ff8000" },
    { team: "Mercedes", startYear: 2013, endYear: 2024, color: "#00d2be" },
    { team: "Ferrari", startYear: 2025, endYear: null, color: "#dc0000" },
  ],
  verstappen: [
    { team: "Toro Rosso", startYear: 2015, endYear: 2016, color: "#2b4ea2" },
    { team: "Red Bull Racing", startYear: 2016, endYear: null, color: "#1e41ff" },
  ],
  schumacher: [
    { team: "Jordan", startYear: 1991, endYear: 1991, color: "#ffd11a" },
    { team: "Benetton", startYear: 1991, endYear: 1995, color: "#00a651" },
    { team: "Ferrari", startYear: 1996, endYear: 2006, color: "#dc0000" },
    { team: "Mercedes", startYear: 2010, endYear: 2012, color: "#00d2be" },
  ],
  senna: [
    { team: "Toleman", startYear: 1984, endYear: 1984, color: "#2aa1ad" },
    { team: "Lotus", startYear: 1985, endYear: 1987, color: "#f4c020" },
    { team: "McLaren", startYear: 1988, endYear: 1993, color: "#ff8000" },
    { team: "Williams", startYear: 1994, endYear: 1994, color: "#005aff" },
  ],
  prost: [
    { team: "McLaren", startYear: 1980, endYear: 1980, color: "#ff8000" },
    { team: "Renault", startYear: 1981, endYear: 1983, color: "#ffd700" },
    { team: "McLaren", startYear: 1984, endYear: 1989, color: "#ff8000" },
    { team: "Ferrari", startYear: 1990, endYear: 1991, color: "#dc0000" },
    { team: "Williams", startYear: 1993, endYear: 1993, color: "#005aff" },
  ],
  lauda: [
    { team: "March", startYear: 1971, endYear: 1972, color: "#3f7d54" },
    { team: "BRM", startYear: 1973, endYear: 1973, color: "#1a5e3a" },
    { team: "Ferrari", startYear: 1974, endYear: 1977, color: "#dc0000" },
    { team: "Brabham", startYear: 1978, endYear: 1979, color: "#2a4fb0" },
    { team: "McLaren", startYear: 1982, endYear: 1985, color: "#ff8000" },
  ],
  alonso: [
    { team: "Minardi", startYear: 2001, endYear: 2001, color: "#c79a2e" },
    { team: "Renault", startYear: 2003, endYear: 2006, color: "#ffd700" },
    { team: "McLaren", startYear: 2007, endYear: 2007, color: "#ff8000" },
    { team: "Renault", startYear: 2008, endYear: 2009, color: "#ffd700" },
    { team: "Ferrari", startYear: 2010, endYear: 2014, color: "#dc0000" },
    { team: "McLaren", startYear: 2015, endYear: 2018, color: "#ff8000" },
    { team: "Alpine", startYear: 2021, endYear: 2022, color: "#0093cc" },
    { team: "Aston Martin", startYear: 2023, endYear: null, color: "#229971" },
  ],
  vettel: [
    { team: "BMW Sauber", startYear: 2007, endYear: 2007, color: "#0a64c2" },
    { team: "Toro Rosso", startYear: 2007, endYear: 2008, color: "#2b4ea2" },
    { team: "Red Bull Racing", startYear: 2009, endYear: 2014, color: "#1e41ff" },
    { team: "Ferrari", startYear: 2015, endYear: 2020, color: "#dc0000" },
    { team: "Aston Martin", startYear: 2021, endYear: 2022, color: "#229971" },
  ],
  leclerc: [
    { team: "Sauber", startYear: 2018, endYear: 2018, color: "#52e252" },
    { team: "Ferrari", startYear: 2019, endYear: null, color: "#dc0000" },
  ],
  norris: [
    { team: "McLaren", startYear: 2019, endYear: null, color: "#ff8000" },
  ],
  russell: [
    { team: "Williams", startYear: 2019, endYear: 2020, color: "#005aff" },
    { team: "Mercedes", startYear: 2020, endYear: 2020, color: "#00d2be" },
    { team: "Williams", startYear: 2020, endYear: 2021, color: "#005aff" },
    { team: "Mercedes", startYear: 2022, endYear: null, color: "#00d2be" },
  ],
  sainz: [
    { team: "Toro Rosso", startYear: 2015, endYear: 2017, color: "#2b4ea2" },
    { team: "Renault", startYear: 2017, endYear: 2018, color: "#ffd700" },
    { team: "McLaren", startYear: 2019, endYear: 2020, color: "#ff8000" },
    { team: "Ferrari", startYear: 2021, endYear: 2024, color: "#dc0000" },
    { team: "Williams", startYear: 2025, endYear: null, color: "#005aff" },
  ],
  perez: [
    { team: "Sauber", startYear: 2011, endYear: 2012, color: "#52e252" },
    { team: "McLaren", startYear: 2013, endYear: 2013, color: "#ff8000" },
    { team: "Force India", startYear: 2014, endYear: 2018, color: "#f596c8" },
    { team: "Racing Point", startYear: 2019, endYear: 2020, color: "#f596c8" },
    { team: "Red Bull Racing", startYear: 2021, endYear: 2024, color: "#1e41ff" },
    { team: "Cadillac", startYear: 2026, endYear: null, color: "#d4a017" },
  ],
  ricciardo: [
    { team: "HRT", startYear: 2011, endYear: 2011, color: "#b8973a" },
    { team: "Toro Rosso", startYear: 2012, endYear: 2013, color: "#2b4ea2" },
    { team: "Red Bull Racing", startYear: 2014, endYear: 2018, color: "#1e41ff" },
    { team: "Renault", startYear: 2019, endYear: 2020, color: "#ffd700" },
    { team: "McLaren", startYear: 2021, endYear: 2022, color: "#ff8000" },
    { team: "AlphaTauri", startYear: 2023, endYear: 2023, color: "#5e7da0" },
    { team: "RB", startYear: 2024, endYear: 2024, color: "#6692ff" },
  ],
  gasly: [
    { team: "Toro Rosso", startYear: 2017, endYear: 2018, color: "#2b4ea2" },
    { team: "Red Bull Racing", startYear: 2019, endYear: 2019, color: "#1e41ff" },
    { team: "Toro Rosso", startYear: 2019, endYear: 2019, color: "#2b4ea2" },
    { team: "AlphaTauri", startYear: 2020, endYear: 2022, color: "#5e7da0" },
    { team: "Alpine", startYear: 2023, endYear: null, color: "#0093cc" },
  ],
  ocon: [
    { team: "Manor Marussia", startYear: 2016, endYear: 2016, color: "#e10600" },
    { team: "Force India", startYear: 2017, endYear: 2018, color: "#f596c8" },
    { team: "Renault", startYear: 2020, endYear: 2020, color: "#ffd700" },
    { team: "Alpine", startYear: 2021, endYear: 2024, color: "#0093cc" },
    { team: "Haas", startYear: 2025, endYear: null, color: "#b6babd" },
  ],
  piastri: [
    { team: "McLaren", startYear: 2023, endYear: null, color: "#ff8000" },
  ],
  antonelli: [
    { team: "Mercedes", startYear: 2025, endYear: null, color: "#00d2be" },
  ],
}

export function getTeamTransfers(driverId: string): TeamStint[] {
  return TEAM_TRANSFERS[driverId] ?? []
}
