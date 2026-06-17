"""
Generate lib/driverTeams.ts from real Jolpica/Ergast data — each driver's
season-by-season constructor history, collapsed into stints (start/end year),
handling mid-season team switches. Run:  python scripts/gen_driver_teams.py
"""

import os, json, time, urllib.request

# our driver id -> Jolpica/Ergast driverId
DRIVERS = {
    "hamilton": "hamilton", "verstappen": "max_verstappen", "schumacher": "michael_schumacher",
    "senna": "senna", "prost": "prost", "lauda": "lauda", "alonso": "alonso", "vettel": "vettel",
    "leclerc": "leclerc", "norris": "norris", "russell": "russell", "sainz": "sainz",
    "perez": "perez", "ricciardo": "ricciardo", "gasly": "gasly", "ocon": "ocon",
    "piastri": "piastri", "antonelli": "antonelli",
}

CURRENT_SEASON = 2026

# base constructorId (engine suffix stripped) -> accent colour. All visible on a near-black card.
COLORS = {
    "mclaren": "#ff8000", "mercedes": "#00d2be", "ferrari": "#dc0000", "red_bull": "#1e41ff",
    "toro_rosso": "#2b4ea2", "alphatauri": "#5e7da0", "rb": "#6692ff", "alpine": "#0093cc",
    "renault": "#ffd700", "williams": "#005aff", "racing_point": "#f596c8", "force_india": "#f596c8",
    "aston_martin": "#229971", "haas": "#b6babd", "sauber": "#52e252", "alfa": "#a72540",
    "audi": "#bb0a30", "cadillac": "#d4a017", "benetton": "#00a651", "jordan": "#ffd11a",
    "lotus_f1": "#f4c020", "lotus": "#1b6e3c", "toleman": "#2aa1ad", "brabham": "#2a4fb0",
    "manor": "#e10600", "marussia": "#e10600", "virgin": "#e10600", "hrt": "#b8973a",
    "bmw_sauber": "#0a64c2", "minardi": "#c79a2e", "team_lotus": "#f4c020",
    "march": "#3f7d54", "brm": "#1a5e3a",
}
FALLBACK = "#9aa0a6"

# Clean display names for base ids whose API name carries an engine suffix.
CLEAN_NAME = {
    "team_lotus": "Lotus", "march": "March", "brm": "BRM", "brabham": "Brabham",
}
NAME_FIX = {
    "Alpine F1 Team": "Alpine", "Haas F1 Team": "Haas", "RB F1 Team": "RB",
    "Red Bull": "Red Bull Racing", "Cadillac F1 Team": "Cadillac",
}


def fetch_results(jolpica_id):
    rows, offset = [], 0
    while True:
        url = f"https://api.jolpi.ca/ergast/f1/drivers/{jolpica_id}/results.json?limit=100&offset={offset}"
        data = json.load(urllib.request.urlopen(url))
        md = data["MRData"]
        races = md["RaceTable"]["Races"]
        for r in races:
            res = r.get("Results", [])
            if not res:
                continue
            c = res[0]["Constructor"]
            rows.append((int(r["season"]), int(r["round"]), c["constructorId"], c["name"]))
        offset += 100
        if offset >= int(md["total"]):
            break
        time.sleep(0.3)
    return rows


def build_stints(rows):
    rows.sort(key=lambda x: (x[0], x[1]))
    stints = []
    for season, _round, cid, cname in rows:
        base = cid.split("-")[0]  # strip engine suffix (e.g. brabham-ford -> brabham)
        name = CLEAN_NAME.get(base, NAME_FIX.get(cname, cname))
        if stints and stints[-1]["base"] == base:
            stints[-1]["end"] = season
        else:
            stints.append({"base": base, "name": name, "start": season, "end": season})
    return stints


unmapped = set()
out = {}
for our_id, jid in DRIVERS.items():
    try:
        rows = fetch_results(jid)
    except Exception as e:
        print(f"  FAILED {our_id} ({jid}): {e}")
        continue
    stints = build_stints(rows)
    arr = []
    for s in stints:
        if s["base"] not in COLORS:
            unmapped.add((s["base"], s["name"]))
        end = None if s["end"] >= CURRENT_SEASON else s["end"]
        arr.append({
            "team": s["name"],
            "startYear": s["start"],
            "endYear": end,
            "color": COLORS.get(s["base"], FALLBACK),
        })
    out[our_id] = arr
    print(f"  {our_id}: " + " -> ".join(f"{a['team']}({a['startYear']}-{a['endYear'] or 'now'})" for a in arr))

if unmapped:
    print("\nUNMAPPED constructors (using fallback colour):")
    for cid, name in sorted(unmapped):
        print(f"  {cid}  ({name})")

# ── Emit TS ──────────────────────────────────────────────────────────────────
def ts_obj(arr):
    items = []
    for a in arr:
        end = "null" if a["endYear"] is None else str(a["endYear"])
        items.append(
            f"    {{ team: {json.dumps(a['team'])}, startYear: {a['startYear']}, "
            f"endYear: {end}, color: {json.dumps(a['color'])} }},"
        )
    return "\n".join(items)

lines = [
    "// Career team history for the profile-page transfer diagram. Generated from",
    "// real Jolpica/Ergast season-by-season data via scripts/gen_driver_teams.py.",
    "// `endYear: null` means the driver is still with that team.",
    "",
    "export interface TeamStint {",
    "  team: string",
    "  startYear: number",
    "  endYear: number | null",
    "  color: string",
    "}",
    "",
    "const TEAM_TRANSFERS: Record<string, TeamStint[]> = {",
]
for our_id, arr in out.items():
    lines.append(f"  {our_id}: [")
    lines.append(ts_obj(arr))
    lines.append("  ],")
lines += [
    "}",
    "",
    "export function getTeamTransfers(driverId: string): TeamStint[] {",
    "  return TEAM_TRANSFERS[driverId] ?? []",
    "}",
    "",
]

dest = os.path.join(os.path.dirname(__file__), "..", "lib", "driverTeams.ts")
with open(dest, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))
print(f"\nWrote {dest}")
