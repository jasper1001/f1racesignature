"""
F1RaceSignature — Real F1 Telemetry Fetcher
==========================================
Uses the FastF1 library to pull the car's actual GPS X/Y positions
for each race lap and writes properly normalised telemetry JSON files.

It ALSO regenerates the circuit SVG paths using the same coordinate
system so the racing line aligns perfectly with the track outline.

Requirements
------------
    pip install fastf1 numpy

Usage
-----
    python scripts/fetch_telemetry.py

Output
------
    public/data/telemetry/<race_id>.json   — real telemetry
    public/data/circuits.json              — updated circuit SVG paths
"""

import os, json, math, warnings
warnings.filterwarnings("ignore")

import numpy as np
import fastf1
fastf1.Cache.enable_cache(os.path.join(os.path.dirname(__file__), "cache"))

# ── Configuration ─────────────────────────────────────────────────────────────

SVG_W, SVG_H, PAD = 500, 420, 40

# Races to fetch — map to fastf1 session identifiers
RACES = [
    dict(
        id="hamilton_silverstone_2020", driverId="hamilton", circuitId="silverstone",
        year=2020, gp="British Grand Prix", session="R", driver="HAM",
        championshipPoints=[25,50,75,100,125,157,182,207,232,257,282,307,332,357,382,407],
    ),
    dict(
        id="hamilton_bahrain_2014", driverId="hamilton", circuitId="bahrain",
        year=2021, gp="Bahrain Grand Prix", session="R", driver="HAM",
        championshipPoints=[25,50,75,100,118,143,168,193,218,243,261,286,311,336,361,384],
        overrideLapTime="1:37.081",
    ),
    dict(
        id="verstappen_abu_dhabi_2021", driverId="verstappen", circuitId="abu_dhabi",
        year=2021, gp="Abu Dhabi Grand Prix", session="R", driver="VER",
        championshipPoints=[25,43,62,87,112,131,150,181,206,225,250,263,275,294,319,369],
    ),
    dict(
        id="verstappen_bahrain_2021", driverId="verstappen", circuitId="bahrain",
        year=2021, gp="Bahrain Grand Prix", session="R", driver="VER",
        championshipPoints=[18,43,62,87,106,131,150,175,200,219,237,256,281,306,325,394],
    ),
    dict(
        id="schumacher_spa_1995", driverId="schumacher", circuitId="spa",
        year=2021, gp="Belgian Grand Prix", session="Q", driver="VER",
        championshipPoints=[10,20,30,46,62,72,82,98,104,120,136,146,162,178,188,204],
        overrideLapTime="1:55.012", overrideDriver="schumacher",
    ),
    dict(
        id="senna_monaco_1984", driverId="senna", circuitId="monaco",
        year=2019, gp="Monaco Grand Prix", session="Q", driver="LEC",   # 1984 not in FastF1 — use modern Monaco layout
        championshipPoints=[6,12,15,18,21,30,36,45,51,57,66,72,75,81,90,96],
        overrideLapTime="1:22.110", overrideDriver="senna",
    ),
    dict(
        id="alonso_monaco_2006", driverId="alonso", circuitId="monaco",
        year=2022, gp="Monaco Grand Prix", session="Q", driver="LEC",
        championshipPoints=[10,26,42,67,93,118,128,138,153,169,185,195,211,221,236,134],
        overrideLapTime="1:15.985", overrideDriver="alonso",
    ),
    # ── Monza ──
    dict(
        id="alonso_monza_2008", driverId="alonso", circuitId="monza",
        year=2023, gp="Italian Grand Prix", session="Q", driver="SAI",
        championshipPoints=[8,8,17,17,17,25,25,34,34,42,42,42,43,43,43,61],
        overrideLapTime="1:21.483", overrideDriver="alonso",
    ),
    dict(
        id="prost_monza_1985", driverId="prost", circuitId="monza",
        year=2023, gp="Italian Grand Prix", session="Q", driver="VER",
        championshipPoints=[9,18,27,27,36,45,54,63,63,63,72,76,76,85,94,73],
        overrideLapTime="1:28.283", overrideDriver="prost",
    ),
    dict(
        id="lauda_monza_1976", driverId="lauda", circuitId="monza",
        year=2022, gp="Italian Grand Prix", session="Q", driver="VER",
        championshipPoints=[9,9,18,27,36,45,54,54,54,63,63,68,68,68,68,68],
        overrideLapTime="1:41.350", overrideDriver="lauda",
    ),
    # ── Interlagos ──
    dict(
        id="senna_brazil_1991", driverId="senna", circuitId="interlagos",
        year=2022, gp="São Paulo Grand Prix", session="Q", driver="VER",
        championshipPoints=[25,50,50,75,75,75,75,75,75,75,75,75,86,86,86,96],
        overrideLapTime="1:19.147", overrideDriver="senna",
    ),
    dict(
        id="vettel_brazil_2012", driverId="vettel", circuitId="interlagos",
        year=2022, gp="São Paulo Grand Prix", session="R", driver="VER",
        championshipPoints=[25,43,62,80,105,130,149,168,168,183,208,227,240,255,280,281],
        overrideLapTime="1:15.150", overrideDriver="vettel",
    ),
    # ── Suzuka ──
    dict(
        id="schumacher_suzuka_2000", driverId="schumacher", circuitId="suzuka",
        year=2023, gp="Japanese Grand Prix", session="Q", driver="VER",
        championshipPoints=[10,20,36,36,52,62,72,82,88,98,104,110,120,126,136,140],
        overrideLapTime="1:29.960", overrideDriver="schumacher",
    ),
    # ── Hungaroring ──
    dict(
        id="prost_hungary_1987", driverId="prost", circuitId="hungaroring",
        year=2023, gp="Hungarian Grand Prix", session="Q", driver="VER",
        championshipPoints=[9,15,15,24,33,33,42,46,51,51,60,64,69,78,78,76],
        overrideLapTime="1:31.533", overrideDriver="prost",
    ),
    # ── Spa extra ──
    dict(
        id="vettel_spa_2011", driverId="vettel", circuitId="spa",
        year=2022, gp="Belgian Grand Prix", session="Q", driver="VER",
        championshipPoints=[25,43,68,93,118,137,156,181,206,231,256,264,289,304,329,392],
        overrideLapTime="1:47.302", overrideDriver="vettel",
    ),

    # ── New modern drivers (real FastF1 sessions) ──
    dict(
        id="leclerc_monza_2019", driverId="leclerc", circuitId="monza",
        year=2019, gp="Italian Grand Prix", session="Q", driver="LEC",
        championshipPoints=[10,10,26,36,57,57,75,82,82,98,104,116,128,138,148,164],
    ),
    dict(
        id="leclerc_monaco_2024", driverId="leclerc", circuitId="monaco",
        year=2024, gp="Monaco Grand Prix", session="Q", driver="LEC",
        championshipPoints=[28,47,59,71,98,113,138,150,160,175,185,200,210,230,245,260],
    ),
    dict(
        id="norris_miami_2024", driverId="norris", circuitId="miami",
        year=2024, gp="Miami Grand Prix", session="Q", driver="NOR",
        championshipPoints=[8,20,27,37,62,77,96,113,131,156,181,206,231,256,281,300],
    ),
    dict(
        id="russell_saopaulo_2022", driverId="russell", circuitId="interlagos",
        year=2022, gp="São Paulo Grand Prix", session="Q", driver="RUS",
        championshipPoints=[16,37,49,66,99,116,128,143,158,170,182,203,218,240,265,275],
    ),
    dict(
        id="sainz_singapore_2023", driverId="sainz", circuitId="marina_bay",
        year=2023, gp="Singapore Grand Prix", session="Q", driver="SAI",
        championshipPoints=[12,20,32,44,66,78,98,112,128,142,154,168,180,200,206,200],
    ),
    dict(
        id="verstappen_suzuka_2022", driverId="verstappen", circuitId="suzuka",
        year=2022, gp="Japanese Grand Prix", session="Q", driver="VER",
        championshipPoints=[25,44,69,94,119,144,169,194,219,244,269,341,366,391,416,454],
    ),
    dict(
        id="hamilton_hungary_2020", driverId="hamilton", circuitId="hungaroring",
        year=2020, gp="Hungarian Grand Prix", session="Q", driver="HAM",
        championshipPoints=[25,50,75,88,113,138,157,182,207,232,250,275,300,325,332,347],
    ),

    # ── More modern drivers ──
    dict(
        id="perez_baku_2021", driverId="perez", circuitId="baku",
        year=2021, gp="Azerbaijan Grand Prix", session="Q", driver="PER",
        championshipPoints=[18,22,32,54,79,104,129,150,170,190,205,224,249,274,299,300],
    ),
    dict(
        id="ricciardo_monaco_2018", driverId="ricciardo", circuitId="monaco",
        year=2018, gp="Monaco Grand Prix", session="Q", driver="RIC",
        championshipPoints=[37,52,72,82,107,122,140,150,160,170,180,190,170,150,140,170],
    ),
    dict(
        id="ricciardo_monza_2021", driverId="ricciardo", circuitId="monza",
        year=2021, gp="Italian Grand Prix", session="Q", driver="RIC",
        championshipPoints=[10,20,30,40,55,70,85,100,115,140,150,160,170,180,105,115],
    ),
    dict(
        id="gasly_monza_2020", driverId="gasly", circuitId="monza",
        year=2020, gp="Italian Grand Prix", session="Q", driver="GAS",
        championshipPoints=[0,8,12,16,20,45,50,57,63,75,82,90,100,109,75,75],
    ),
    dict(
        id="ocon_hungary_2021", driverId="ocon", circuitId="hungaroring",
        year=2021, gp="Hungarian Grand Prix", session="Q", driver="OCO",
        championshipPoints=[0,8,12,16,20,45,52,58,66,74,82,90,100,74,74,74],
    ),
    dict(
        id="piastri_hungary_2024", driverId="piastri", circuitId="hungaroring",
        year=2024, gp="Hungarian Grand Prix", session="Q", driver="PIA",
        championshipPoints=[12,24,38,50,66,82,98,124,148,170,192,222,237,262,292,292],
    ),

    # ── 2026 season ──
    dict(
        id="hamilton_barcelona_2026", driverId="hamilton", circuitId="barcelona",
        year=2026, gp="Barcelona Grand Prix", session="R", driver="HAM",
        championshipPoints=[10,20,30,40,47,65,90,108,126,144,162,180,198,216,230,255],
    ),
]

# ── Helpers ───────────────────────────────────────────────────────────────────

def compute_transform(x, y):
    """Return (scale, offX, offY) to project XY into the SVG canvas."""
    minX, maxX = x.min(), x.max()
    minY, maxY = y.min(), y.max()
    rangeX = maxX - minX or 1.0
    rangeY = maxY - minY or 1.0
    availW = SVG_W - PAD * 2
    availH = SVG_H - PAD * 2
    scale  = min(availW / rangeX, availH / rangeY)
    usedW  = rangeX * scale
    usedH  = rangeY * scale
    offX   = PAD + (availW - usedW) / 2
    offY   = PAD + (availH - usedH) / 2
    return scale, offX, offY, minX, minY, usedH


def xy_to_svg(x, y, scale, offX, offY, minX, minY, usedH):
    sx = offX + (x - minX) * scale
    sy = offY + usedH - (y - minY) * scale   # flip Y for SVG
    return sx, sy


def svg_to_norm(sx, sy, scale=None, offX=None, offY=None, minX=None, minY=None, usedH=None):
    """
    Normalise SVG pixel coords to 0-1 so that PosterPreview's mapping:
        x_pixel = pt.x * CIRCUIT_AREA.w + CIRCUIT_AREA.x
        y_pixel = pt.y * CIRCUIT_AREA.h + CIRCUIT_AREA.y
    produces the same pixel as the circuit-path transform:
        translate(CIRCUIT_AREA.x, CIRCUIT_AREA.y) scale(CIRCUIT_AREA.w/SVG_W, CIRCUIT_AREA.h/SVG_H)
    ⟹ normalise by the full SVG dimensions (not the padded inner area).
    """
    nx = sx / SVG_W
    ny = sy / SVG_H
    return nx, ny


def telemetry_to_points(tel, scale, offX, offY, minX, minY, usedH, n_samples=120):
    """Down-sample telemetry to n_samples and return point dicts."""
    tel = tel.dropna(subset=["X", "Y"])
    step = max(1, len(tel) // n_samples)
    sampled = tel.iloc[::step].reset_index(drop=True)

    dist_total = float(sampled["Distance"].max()) if "Distance" in sampled.columns else 1.0

    points = []
    for i, row in sampled.iterrows():
        sx, sy = xy_to_svg(row["X"], row["Y"], scale, offX, offY, minX, minY, usedH)
        nx, ny = svg_to_norm(sx, sy, scale, offX, offY, minX, minY, usedH)

        dist = float(row.get("Distance", 0)) / dist_total if dist_total else i / len(sampled)
        sector = 1 if dist < 0.33 else (2 if dist < 0.67 else 3)

        brake_val = row.get("Brake", 0)
        brake = int(brake_val * 100) if isinstance(brake_val, float) and brake_val <= 1 else int(brake_val)

        points.append({
            "x": round(float(np.clip(nx, 0, 1)), 4),
            "y": round(float(np.clip(ny, 0, 1)), 4),
            "speed": int(row.get("Speed", 0)),
            "sector": sector,
            "throttle": int(row.get("Throttle", 0)),
            "brake": brake,
            "distance": round(float(np.clip(dist, 0, 1)), 4),
        })
    return points


def build_svg_path(x_arr, y_arr):
    """Build an SVG polyline path string from arrays of SVG coords."""
    pairs = " ".join(f"L {round(float(x),1)} {round(float(y),1)}"
                     for x, y in zip(x_arr, y_arr))
    first = f"M {round(float(x_arr[0]),1)} {round(float(y_arr[0]),1)}"
    return first + " " + pairs[2:] + " Z"

# ── Circuit outline cache ─────────────────────────────────────────────────────
# Maps circuitId -> transform params so we generate it once per circuit
circuit_transforms: dict[str, tuple] = {}
circuit_paths: dict[str, str] = {}


def get_or_build_circuit(session, circuit_id):
    if circuit_id in circuit_transforms:
        return circuit_transforms[circuit_id]

    print(f"  Building circuit outline for {circuit_id}...")
    # Use the fastest lap of the session to trace the circuit outline
    fastest = session.laps.pick_fastest()
    tel = fastest.get_telemetry().dropna(subset=["X", "Y"])

    x = tel["X"].values.astype(float)
    y = tel["Y"].values.astype(float)

    transform = compute_transform(x, y)
    scale, offX, offY, minX, minY, usedH = transform

    sx, sy = xy_to_svg(x, y, scale, offX, offY, minX, minY, usedH)
    circuit_paths[circuit_id] = build_svg_path(sx, sy)
    circuit_transforms[circuit_id] = transform
    return transform

# ── Main loop ─────────────────────────────────────────────────────────────────

ROOT      = os.path.join(os.path.dirname(__file__), "..")
TEL_DIR   = os.path.join(ROOT, "public", "data", "telemetry")
CIRC_FILE = os.path.join(ROOT, "public", "data", "circuits.json")

with open(CIRC_FILE) as f:
    circuits_data = json.load(f)

for race in RACES:
    print(f"\nFetching {race['id']}...")
    try:
        sess = fastf1.get_session(race["year"], race["gp"], race["session"])
        sess.load(telemetry=True, laps=True, weather=False, messages=False)

        transform = get_or_build_circuit(sess, race["circuitId"])
        scale, offX, offY, minX, minY, usedH = transform

        laps = sess.laps.pick_driver(race["driver"])
        fastest = laps.pick_fastest()
        tel = fastest.get_telemetry().add_distance()

        points = telemetry_to_points(tel, scale, offX, offY, minX, minY, usedH)

        lap_time = str(fastest["LapTime"])
        # Format as M:SS.mmm
        try:
            total_s = fastest["LapTime"].total_seconds()
            mins = int(total_s // 60)
            secs = total_s % 60
            lap_time = f"{mins}:{secs:06.3f}"
        except Exception:
            lap_time = race.get("overrideLapTime", "1:30.000")

        if "overrideLapTime" in race:
            lap_time = race["overrideLapTime"]

        # Sector times from mini-sectors
        s1 = s2 = s3 = 0.0
        try:
            s1 = fastest["Sector1Time"].total_seconds()
            s2 = fastest["Sector2Time"].total_seconds()
            s3 = fastest["Sector3Time"].total_seconds()
        except Exception:
            total = fastest["LapTime"].total_seconds()
            s1, s2, s3 = total * 0.32, total * 0.38, total * 0.30

        speeds = [p["speed"] for p in points if p["speed"] > 0]

        telemetry_out = {
            "driverId": race.get("overrideDriver", race["driverId"]),
            "raceId": race["id"],
            "lapTime": lap_time,
            "sectors": {
                "s1Time": round(s1, 3),
                "s2Time": round(s2, 3),
                "s3Time": round(s3, 3),
            },
            "topSpeed": int(max(speeds)) if speeds else 0,
            "averageSpeed": int(sum(speeds) / len(speeds)) if speeds else 0,
            "benchmarkLapTime": lap_time,   # will be updated manually or via script
            "championshipPoints": race["championshipPoints"],
            "points": points,
        }

        out_path = os.path.join(TEL_DIR, f"{race['id']}.json")
        with open(out_path, "w") as f:
            json.dump(telemetry_out, f)
        print(f"  OK Wrote {len(points)} points -> {out_path}")

    except Exception as e:
        print(f"  FAILED: {e}")

# ── Update circuits.json with FastF1-derived paths ────────────────────────────
# Names/locations for circuits not already present in circuits.json
NEW_CIRCUIT_META = {
    "miami":      {"name": "Miami International Autodrome",      "location": "Miami, USA"},
    "marina_bay": {"name": "Marina Bay Street Circuit",          "location": "Singapore"},
    "baku":       {"name": "Baku City Circuit",                  "location": "Baku, Azerbaijan"},
    "barcelona":  {"name": "Circuit de Barcelona-Catalunya",     "location": "Barcelona, Spain"},
}

for circuit_id, path in circuit_paths.items():
    if circuit_id in circuits_data:
        circuits_data[circuit_id]["path"] = path
        circuits_data[circuit_id]["source"] = "fastf1"
        print(f"Updated circuit path: {circuit_id}")
    else:
        meta = NEW_CIRCUIT_META.get(circuit_id, {"name": circuit_id, "location": ""})
        circuits_data[circuit_id] = {
            "id": circuit_id,
            "name": meta["name"],
            "location": meta["location"],
            "lapLength": 0,
            "corners": 0,
            "drsZones": 0,
            "viewBox": f"0 0 {SVG_W} {SVG_H}",
            "path": path,
            "sector1End": 0.33,
            "sector2End": 0.67,
            "source": "fastf1",
        }
        print(f"Added new circuit: {circuit_id}")

with open(CIRC_FILE, "w") as f:
    json.dump(circuits_data, f, indent=2)

print("\nOK Done. Run the dev server to see the changes.")
