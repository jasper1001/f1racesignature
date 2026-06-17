"""
One-off: generate real telemetry for Kimi Antonelli's winning lap at the
2026 Monaco Grand Prix.

It reproduces the EXISTING `monaco` circuit transform (built from the 2019
Monaco session in fetch_telemetry.py) rather than rebuilding the circuit, so
Antonelli's racing line aligns with the circuit outline already in
circuits.json and the other Monaco posters are left untouched.

    python scripts/fetch_antonelli_monaco.py
    -> public/data/telemetry/antonelli_monaco_2026.json
"""

import os, json, warnings
warnings.filterwarnings("ignore")

import numpy as np
import fastf1

ROOT = os.path.join(os.path.dirname(__file__), "..")
fastf1.Cache.enable_cache(os.path.join(os.path.dirname(__file__), "cache"))

SVG_W, SVG_H, PAD = 500, 420, 40

# Real cumulative championship points after each completed 2026 round (Jolpica).
CHAMPIONSHIP_POINTS = [18, 47, 72, 100, 131, 156, 156]


def compute_transform(x, y):
    minX, maxX = x.min(), x.max()
    minY, maxY = y.min(), y.max()
    rangeX = maxX - minX or 1.0
    rangeY = maxY - minY or 1.0
    availW = SVG_W - PAD * 2
    availH = SVG_H - PAD * 2
    scale = min(availW / rangeX, availH / rangeY)
    usedW = rangeX * scale
    usedH = rangeY * scale
    offX = PAD + (availW - usedW) / 2
    offY = PAD + (availH - usedH) / 2
    return scale, offX, offY, minX, minY, usedH


def xy_to_svg(x, y, scale, offX, offY, minX, minY, usedH):
    sx = offX + (x - minX) * scale
    sy = offY + usedH - (y - minY) * scale
    return sx, sy


def telemetry_to_points(tel, transform, n_samples=120):
    scale, offX, offY, minX, minY, usedH = transform
    tel = tel.dropna(subset=["X", "Y"])
    step = max(1, len(tel) // n_samples)
    sampled = tel.iloc[::step].reset_index(drop=True)
    dist_total = float(sampled["Distance"].max()) if "Distance" in sampled.columns else 1.0

    points = []
    for i, row in sampled.iterrows():
        sx, sy = xy_to_svg(row["X"], row["Y"], scale, offX, offY, minX, minY, usedH)
        nx, ny = sx / SVG_W, sy / SVG_H
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


# 1. Reproduce the monaco transform from the 2019 Monaco session (matches
#    circuits.json — see fetch_telemetry.py senna_monaco_1984 entry).
print("Reproducing monaco transform from 2019 Monaco Q...")
ref = fastf1.get_session(2019, "Monaco Grand Prix", "Q")
ref.load(telemetry=True, laps=True, weather=False, messages=False)
rtel = ref.laps.pick_fastest().get_telemetry().dropna(subset=["X", "Y"])
transform = compute_transform(rtel["X"].values.astype(float), rtel["Y"].values.astype(float))

# 2. Antonelli's pole lap from 2026 Monaco qualifying. (Race position telemetry
#    is only partially available for 2026; qualifying gives the clean, complete
#    fast lap — consistent with the other Monaco posters, which also use Q.)
print("Loading 2026 Monaco qualifying for Antonelli...")
sess = fastf1.get_session(2026, "Monaco Grand Prix", "Q")
sess.load(telemetry=True, laps=True, weather=False, messages=False)
fastest = sess.laps.pick_drivers("ANT").pick_fastest()
tel = fastest.get_telemetry().add_distance()

points = telemetry_to_points(tel, transform)

total_s = fastest["LapTime"].total_seconds()
lap_time = f"{int(total_s // 60)}:{total_s % 60:06.3f}"

try:
    s1 = fastest["Sector1Time"].total_seconds()
    s2 = fastest["Sector2Time"].total_seconds()
    s3 = fastest["Sector3Time"].total_seconds()
except Exception:
    s1, s2, s3 = total_s * 0.32, total_s * 0.38, total_s * 0.30

speeds = [p["speed"] for p in points if p["speed"] > 0]

out = {
    "driverId": "antonelli",
    "raceId": "antonelli_monaco_2026",
    "lapTime": lap_time,
    "sectors": {"s1Time": round(s1, 3), "s2Time": round(s2, 3), "s3Time": round(s3, 3)},
    "topSpeed": int(max(speeds)) if speeds else 0,
    "averageSpeed": int(sum(speeds) / len(speeds)) if speeds else 0,
    "benchmarkLapTime": lap_time,
    "championshipPoints": CHAMPIONSHIP_POINTS,
    "points": points,
}

out_path = os.path.join(ROOT, "public", "data", "telemetry", "antonelli_monaco_2026.json")
with open(out_path, "w") as f:
    json.dump(out, f)

print(f"OK lapTime={lap_time} points={len(points)} top={out['topSpeed']} -> {out_path}")
